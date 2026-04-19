import {inject, Injectable} from '@angular/core';
import {IUnitBuilderStrategy} from '../../interfaces/unit-builder.interface';
import {
  FacadeConfig, ParsedCorpus, ResolvedFacade, ResolvedShelf,
  ResolvedUnit, ShelfConfig, TrapezoidCorner,
} from '../../interfaces/unit-config.models';
import {
  DEFAULT_FACADE_DEPTH, DEFAULT_HANDLE_DEPTH, UnitBuildHelpers,
} from '../unit-build-helpers.service';
import {ALIGN_BOTTOM, ALIGN_LEFT, ALIGN_RIGHT, ALIGN_TOP} from '../../constants/geometry.constants';

/**
 * Верхние шкафы: normal, angle, vitrina, end.
 * Без ножек, цоколей и столешниц — только корпус, фасады, полки, штанги.
 * legHeight = 0: позиционирование начинается от нижней грани шкафа.
 */
@Injectable({ providedIn: 'root' })
export class TopUnitBuilderService implements IUnitBuilderStrategy {
  private readonly topHelper = inject(UnitBuildHelpers);

  private readonly END_CATALOG_CODES = ['VT_300', 'VT_309', 'VPU_300', 'VPU_309'];

  build(config: any): ResolvedUnit {
    const groups = this.topHelper.parseGroups(config.options);
    const {corpus, sizes, sideType, className} = groups;

    const corpusWidth = config.selectedWidth ?? corpus.width;
    const legHeight   = 0; // верхние шкафы крепятся к стене, нет ножек на полу

    const isEndUnit = this.END_CATALOG_CODES.includes(corpus.catalogCode)
      && corpus.smallDepth !== undefined;

    const panelOptions = {
      legHeight,
      level:      config.level,
      catalogCode: corpus.catalogCode,
      smallWidth:  corpus.smallWidth,
      smallDepth:  corpus.smallDepth,
      sideType,
    };

    console.log(this.topHelper.buildPanels(corpusWidth, corpus.height, corpus.depth, corpus.thickness, corpus.backThickness, panelOptions))

    return {
      uid:               config.uid,
      level:             config.level,
      className,
      size:              {x: this.topHelper.helper.toM(corpusWidth), y: this.topHelper.helper.toM(sizes.height), z: this.topHelper.helper.toM(sizes.depth)},
      corpusSize:        {x: this.topHelper.helper.toM(corpusWidth), y: this.topHelper.helper.toM(corpus.height), z: this.topHelper.helper.toM(corpus.depth)},
      corpusCatalogCode: corpus.catalogCode,
      availableWidths:   corpus.availableWidths,
      panels:   this.topHelper.buildPanels(corpusWidth, corpus.height, corpus.depth, corpus.thickness, corpus.backThickness, panelOptions),
      facades:  isEndUnit
        ? this.buildEndFacades(groups.facades, corpus, legHeight, sideType)
        : this.topHelper.buildFacades(groups.facades, corpusWidth, corpus.height, corpus.depth, legHeight, sideType),
      shelves:  isEndUnit
        ? this.buildEndShelves(groups.shelves, corpus, legHeight, sideType)
        : this.topHelper.buildShelves(groups.shelves, corpusWidth, corpus.depth, corpus.height, corpus.thickness, corpus.backThickness, legHeight),
      rods:      this.topHelper.buildRods(groups.rods, corpusWidth, corpus.depth, corpus.height, legHeight),
      legs:      [],
      plinths:   [],
      tabletops: [],
    };
  }

  // ── N_END / VT_* : торцевой верхний модуль ──────────────────────────────

  /**
   * Геометрия трапеции в плане (вид сверху) — идентична нижним торцевым.
   *
   * sideType='left' (малая сторона — слева):
   *   Большая стенка (право): front-right z=0, back z=-panelD
   *   Малая стенка  (лево):   front-left  z=-Δ, back z=-panelD
   *   Δ = panelD − smallDepth
   */
  private endGeometry(corpus: ParsedCorpus) {
    const panelD   = corpus.depth - corpus.backThickness;
    const smallD   = corpus.smallDepth!;
    const deltaZ   = panelD - smallD;
    const width    = corpus.width;
    const diagLen  = Math.sqrt(width * width + deltaZ * deltaZ);
    const angle    = Math.atan2(deltaZ, width);
    return {panelD, smallD, deltaZ, width, diagLen, angle};
  }

  /**
   * Диагональный фасад торцевого верхнего модуля.
   * Логика идентична BottomUnitBuilderService.buildEndFacades.
   */
  private buildEndFacades(
    configs: FacadeConfig[],
    corpus: ParsedCorpus,
    legHeight: number,
    sideType: string,
  ): ResolvedFacade[] {
    const {deltaZ, diagLen, angle} = this.endGeometry(corpus);
    const rotY    = sideType === 'right' ? angle : -angle;
    const centerZ = -(deltaZ / 2);
    const m = (v: number) => this.topHelper.helper.toM(v);

    return configs.map(fc => {
      const rawH = this.topHelper.helper.calculateSizeByParent(fc.initSizes.height, corpus.height);
      const h    = rawH - fc.gap.top - fc.gap.bottom;
      const y    = this.topHelper.resolveAlignY(fc.align?.y ?? 'center', h, corpus.height, fc.gap, legHeight);
      const handle = this.buildEndHandle(fc, diagLen, h, centerZ, y, rotY);

      return {
        size:          {x: m(diagLen), y: m(h), z: m(DEFAULT_FACADE_DEPTH)},
        position:      {x: 0, y: m(y), z: m(centerZ)},
        rotation:      {x: 0, y: rotY, z: 0},
        openType:      fc.openType,
        functionalType: fc.functionalType,
        modelType:     fc.modelType,
        handle,
      };
    });
  }

  /**
   * Ручка диагонального фасада.
   *
   * Алгоритм:
   * 1. Вычисляем позицию ручки в локальном пространстве фасада:
   *    — localX: вдоль диагонали, зависит от align.x + margin.x
   *    — localY: вертикаль, зависит от align.y + margin.y
   *    — localZ: перпендикуляр к фасаду (= выступ ручки)
   * 2. Трансформируем (localX, localZ) в мировые (worldX, worldZ) поворотом rotY вокруг Y.
   */
  private buildEndHandle(
    fc: FacadeConfig,
    facadeW: number,
    facadeH: number,
    facadeCenterZ: number,
    facadeY: number,
    rotY: number,
  ): ResolvedFacade['handle'] | undefined {
    if (fc.handle == null) return undefined;

    const hW = 120;
    const hH = 20;
    const hD = DEFAULT_HANDLE_DEPTH;
    const m  = (v: number) => this.topHelper.helper.toM(v);

    // ── Локальная X (вдоль диагонали) ────────────────────────────────────
    const marginX = fc.handle.margin?.x ?? 0;
    let localX = marginX;
    if (fc.handle.align.x === ALIGN_LEFT)  localX = -(facadeW / 2 - hW / 2) + marginX;
    if (fc.handle.align.x === ALIGN_RIGHT) localX =  (facadeW / 2 - hW / 2) + marginX;

    // ── Локальная Y (вертикаль) ───────────────────────────────────────────
    const marginY = fc.handle.margin?.y ?? 20;
    let localY = facadeY;
    if (fc.handle.align.y === ALIGN_TOP)    localY = facadeY + facadeH / 2 - hH / 2 - marginY;
    if (fc.handle.align.y === ALIGN_BOTTOM) localY = facadeY - facadeH / 2 + hH / 2 + marginY;

    // ── Локальная Z (выступ перпендикулярно фасаду) ───────────────────────
    const localZ = DEFAULT_FACADE_DEPTH / 2 + hD / 2;

    // ── Трансформация (localX, localZ) → мировые XZ через поворот rotY ───
    //   worldX =  localX·cos(rotY) + localZ·sin(rotY)
    //   worldZ = -localX·sin(rotY) + localZ·cos(rotY) + centerZ
    const worldX =  localX * Math.cos(rotY) + localZ * Math.sin(rotY);
    const worldZ = -localX * Math.sin(rotY) + localZ * Math.cos(rotY) + facadeCenterZ;

    // ── Поворот ручки: ориентация фасада + vertical/horizontal ────────────
    const rotZ = fc.handle.location === 'vertical' ? Math.PI / 2 : 0;

    return {
      size:     {x: m(hW), y: m(hH), z: m(hD)},
      position: {x: m(worldX), y: m(localY), z: m(worldZ)},
      rotation: {x: 0, y: rotY, z: rotZ},
    };
  }

  /**
   * Полки торцевого верхнего модуля — трапецевидная призма в XZ-плоскости.
   *
   * Контур совпадает с внутренним контуром корпуса.
   * Логика идентична BottomUnitBuilderService.buildEndShelves.
   */
  private buildEndShelves(
    configs: ShelfConfig[],
    corpus: ParsedCorpus,
    legHeight: number,
    sideType: string,
  ): ResolvedShelf[] {
    const {panelD, deltaZ} = this.endGeometry(corpus);
    const innerHalfW  = (corpus.width - corpus.thickness * 2) / 2;
    const exposedIsLeft = sideType === 'left';
    const m = (v: number) => this.topHelper.helper.toM(v);

    const trapezoidCorners: TrapezoidCorner[] = exposedIsLeft
      ? [
        {x: m(-innerHalfW), z: m(-deltaZ)},  // c0: фронт малой стенки (лево)
        {x: m(+innerHalfW), z: 0},            // c1: фронт большой стенки (право)
        {x: m(+innerHalfW), z: m(-panelD)},   // c2: зад-право
        {x: m(-innerHalfW), z: m(-panelD)},   // c3: зад-лево
      ]
      : [
        {x: m(+innerHalfW), z: m(-deltaZ)},   // c0: фронт малой стенки (право)
        {x: m(-innerHalfW), z: 0},             // c1: фронт большой стенки (лево)
        {x: m(-innerHalfW), z: m(-panelD)},   // c2: зад-лево
        {x: m(+innerHalfW), z: m(-panelD)},   // c3: зад-право
      ];

    return configs.map(sc => {
      const rawY = this.topHelper.helper.calculateSizeByParent(sc.initPosition.y, corpus.height);
      const y    = legHeight + rawY;

      return {
        size:             {x: 0, y: m(sc.thickness), z: 0},
        position:         {x: 0, y: m(y), z: 0},
        trapezoidCorners,
      };
    });
  }
}
