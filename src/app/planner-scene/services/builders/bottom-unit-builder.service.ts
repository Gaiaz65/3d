import {inject, Injectable} from '@angular/core';
import {IUnitBuilderStrategy} from '../../interfaces/unit-builder.interface';
import {
  AccessoryConfig, FacadeConfig, LegConfig, ParsedCorpus, ResolvedFacade,
  ResolvedLeg, ResolvedPanel, ResolvedPlinth, ResolvedShelf, ResolvedTabletop,
  ResolvedUnit, ShelfConfig,
} from '../../interfaces/unit-config.models';
import {
  DEFAULT_FACADE_DEPTH, DEFAULT_HANDLE_DEPTH, DEFAULT_LEG_RADIUS,
  PLINTH_THICKNESS, TABLETOP_THICKNESS, UnitBuildHelpers,
} from '../unit-build-helpers.service';
import {GROUP_BOTTOM_ANGLE_UNITS} from '../../constants';

/**
 * Нижние тумбы: normal, angle, end.
 * Полный пайплайн — корпус, фасады, ножки, полки, штанги, цоколи, столешница.
 */
@Injectable({providedIn: 'root'})
export class BottomUnitBuilderService implements IUnitBuilderStrategy {
  private readonly helper = inject(UnitBuildHelpers);

  build(config: any): ResolvedUnit {
    const legLess = ['N_SM'];
    const groups = this.helper.parseGroups(config.options);
    const {corpus, sizes, sideType, className} = groups;

    const facadeWidth = config.selectedWidth ?? corpus.width;
    const legHeight = legLess.includes(corpus.catalogCode) ? 0 : this.helper.resolveLegHeight(groups.legs, corpus.bottomGap);
    const isAngle = config.sectionId === GROUP_BOTTOM_ANGLE_UNITS;
    const END_CATALOG_CODES = ['N_ENDF', 'N_END'];
    const isEndUnit = END_CATALOG_CODES.includes(corpus.catalogCode) && corpus.smallDepth !== undefined;

    const facadeConfigs = isAngle
      ? this.normalizeFacadesForAngle(groups.facades)
      : groups.facades;

    const panels = this.helper.buildPanels(
      corpus.width, corpus.height, corpus.depth,
      corpus.thickness, corpus.backThickness,
      legHeight, corpus.catalogCode,
      corpus.smallWidth, corpus.smallDepth, sideType,
    );
    if (corpus.frontPanel) {
      panels.push(...this.buildFrontPanel(corpus.frontPanel.length, corpus.width, corpus.height, corpus.thickness, legHeight, sideType));
    }

    return {
      uid: config.uid,
      level: config.level,
      className,
      size: {
        x: this.helper.helper.toM(facadeWidth),
        y: this.helper.helper.toM(sizes.height),
        z: this.helper.helper.toM(sizes.depth)
      },
      corpusSize: {
        x: this.helper.helper.toM(corpus.width),
        y: this.helper.helper.toM(corpus.height),
        z: this.helper.helper.toM(corpus.depth)
      },
      corpusCatalogCode: corpus.catalogCode,
      availableWidths: corpus.availableWidths,
      panels,
      facades: isEndUnit
        ? this.buildEndFacades(facadeConfigs, corpus, legHeight, sideType)
        : this.helper.buildFacades(facadeConfigs, facadeWidth, corpus.height, corpus.depth, legHeight, sideType),
      legs: isEndUnit
        ? this.buildEndLegs(groups.legs, corpus, sideType)
        : this.helper.buildLegs(groups.legs, corpus.width, corpus.depth),
      shelves: isEndUnit
        ? this.buildEndShelves(groups.shelves, corpus, legHeight, sideType)
        : this.helper.buildShelves(groups.shelves, corpus.width, corpus.depth, corpus.height, corpus.thickness, corpus.backThickness, legHeight),
      rods: this.helper.buildRods(groups.rods, corpus.width, corpus.depth, corpus.height, legHeight),
      plinths: this.helper.buildPlinths(groups.plinths, corpus.width, corpus.depth, legHeight, corpus.smallDepth, sideType),
      tabletops: [],
    };
  }

  // ── N_ENDF: трапециевидный торцевой модуль ──────────────────────────────

  /**
   * Геометрия трапеции в плане (вид сверху):
   *
   * sideType='left' (малая сторона — слева):
   *   Большая стенка (право): front-right z=0,  back z=-panelD
   *   Малая стенка  (лево):   front-left  z=-Δ, back z=-panelD
   *   Диагональный фасад: от (-width/2, z=-Δ) до (+width/2, z=0)
   *   Δ = panelD − smallDepth
   *
   * Поворот фасада вокруг Y:
   *   angle = atan2(Δ, width)
   *   sideType='left' → rotY = −angle (правый конец выдвигается вперёд)
   *   sideType='right'→ rotY = +angle
   */
  private endGeometry(corpus: ParsedCorpus) {
    const panelD = corpus.depth - corpus.backThickness;
    const smallD = corpus.smallDepth!;
    const deltaZ = panelD - smallD;
    const width = corpus.width;
    const diagLen = Math.sqrt(width * width + deltaZ * deltaZ);
    const angle = Math.atan2(deltaZ, width);
    return {panelD, smallD, deltaZ, width, diagLen, angle};
  }

  private buildEndFacades(
    configs: FacadeConfig[],
    corpus: ParsedCorpus,
    legHeight: number,
    sideType: string,
  ): ResolvedFacade[] {
    const {deltaZ, diagLen, angle} = this.endGeometry(corpus);
    const rotY = sideType === 'right' ? angle : -angle;
    const centerZ = -(deltaZ / 2);
    const m = (v: number) => this.helper.helper.toM(v);
    const baseY = legHeight;

    return configs.map(fc => {
      const rawH = this.helper.helper.calculateSizeByParent(fc.initSizes.height, corpus.height);
      const h = rawH - fc.gap.top - fc.gap.bottom;
      const y = this.helper.resolveAlignY(fc.align?.y ?? 'center', h, corpus.height, fc.gap, baseY);
      const handle = this.buildEndHandle(fc, h, centerZ, y, rotY);

      return {
        size: {x: m(diagLen), y: m(h), z: m(DEFAULT_FACADE_DEPTH)},
        position: {x: 0, y: m(y), z: m(centerZ)},
        rotation: {x: 0, y: rotY, z: 0},
        openType: fc.openType,
        functionalType: fc.functionalType,
        modelType: fc.modelType,
        handle,
      };
    });
  }

  /**
   * Ручка диагонального фасада.
   * Позиция вычисляется в локальной системе фасада (X вдоль диагонали),
   * затем трансформируется в мировые координаты поворотом rotY.
   */
  private buildEndHandle(
    fc: FacadeConfig,
    facadeH: number,
    facadeCenterZ: number,
    facadeY: number,
    rotY: number,
  ): ResolvedFacade['handle'] | undefined {
    if (fc.handle == null) return undefined;

    const hW = 120;
    const hH = 20;
    const hD = DEFAULT_HANDLE_DEPTH;
    const m = (v: number) => this.helper.helper.toM(v);

    // В локальном пространстве фасада: ручка у верхнего центра
    const marginY = fc.handle.margin?.y ?? 20;
    const localY = facadeY + facadeH / 2 - hH / 2 - marginY;
    // Смещение по Z (в сторону зрителя) от центра фасада
    const localZ = DEFAULT_FACADE_DEPTH / 2 + hD / 2;

    // Трансформация z-смещения в мировое пространство через поворот rotY
    const worldX = localZ * Math.sin(rotY);          // x = z_local * sin(rotY)
    const worldZ = localZ * Math.cos(rotY) + facadeCenterZ; // z = z_local * cos(rotY) + centerZ

    return {
      size: {x: m(hW), y: m(hH), z: m(hD)},
      position: {x: m(worldX), y: m(localY), z: m(worldZ)},
      rotation: {x: 0, y: rotY, z: 0},
    };
  }

  /**
   * Ножки трапециевидного модуля:
   * — задние ножки: стандартное положение (обе у задней стенки)
   * — передняя ножка большой стороны: z = −rawZ (стандарт, у фронта большой стенки)
   * — передняя ножка малой стороны:  z = −(rawZ + deltaZ) (смещена вглубь на deltaZ)
   */
  private buildEndLegs(
    configs: LegConfig[],
    corpus: ParsedCorpus,
    sideType: string,
  ): ResolvedLeg[] {
    if (!configs.length) return [];

    const legH = this.helper.resolveLegHeight(configs);
    const {deltaZ} = this.endGeometry(corpus);
    const exposedIsLeft = sideType !== 'right';
    const m = (v: number) => this.helper.helper.toM(v);

    return configs.map(lc => {
      const rawX = this.helper.helper.calculateSizeByParent(lc.initPosition.x, corpus.width);
      const rawZ = this.helper.helper.calculateSizeByParent(lc.initPosition.z, corpus.depth);
      const x = rawX - corpus.width / 2;

      const isFrontLeg = rawZ < corpus.depth / 2;
      const isOnExposedSide = exposedIsLeft ? x < 0 : x > 0;

      // Передняя ножка на торцевой стороне смещается вглубь на deltaZ
      const z = isFrontLeg && isOnExposedSide ? -(rawZ + deltaZ) : -(rawZ);

      return {
        radius: m(lc.width ? lc.width / 2 : DEFAULT_LEG_RADIUS),
        height: m(legH),
        position: {x: m(x), y: m(legH / 2), z: m(z)},
      };
    });
  }

  /**
   * Полки торцевого модуля:
   * Ограничены глубиной малой стороны (smallDepth).
   * Центр полки позиционируется от задней стенки: z = −(panelD − depth/2)
   */
  private buildEndShelves(
    configs: ShelfConfig[],
    corpus: ParsedCorpus,
    legHeight: number,
    sideType: string,
  ): ResolvedShelf[] {
    console.log(corpus)
    const {panelD, smallD} = this.endGeometry(corpus);
    const innerW = corpus.width - corpus.thickness * 2;
    const m = (v: number) => this.helper.helper.toM(v);

    return configs.map(sc => {
      const depth = this.helper.helper.calculateSizeByParent(sc.depth, smallD);
      const rawY = this.helper.helper.calculateSizeByParent(sc.initPosition.y, corpus.height);
      const y = legHeight + rawY;
      // Полка примыкает к задней стенке, её передняя грань — у фронта малой стенки
      const centerZ = -(panelD - depth / 2);

      const length = this.helper.helper.calculateSizeByParent(sc.length, innerW);
      return {
        size: {x: m(length), y: m(sc.thickness), z: m(depth)},
        position: {x: 0, y: m(y), z: m(centerZ)},
      };
    });
  }

  /**
   * Цоколи торцевого модуля:
   * — фронтальный цоколь: диагональный, совпадает с фасадом по углу и позиции
   * — боковые цоколи: стандартный алгоритм
   */
  private buildEndPlinths(
    configs: AccessoryConfig[],
    corpus: ParsedCorpus,
    legHeight: number,
    sideType: string,
  ): ResolvedPlinth[] {
    if (!configs.length) return [];

    const {deltaZ, diagLen, angle} = this.endGeometry(corpus);
    const rotY = sideType === 'right' ? angle : -angle;
    const centerZ = -(deltaZ / 2);
    const h = legHeight;
    const pt = PLINTH_THICKNESS;
    const m = (v: number) => this.helper.helper.toM(v);

    return configs.map(pc => {
      const length = pc.initSizes?.length ? Number(pc.initSizes.length) : 0;
      const ox = (pc.initPosition?.x ?? 0) + (pc.margin?.x ?? 0);

      switch (pc.positionType) {
        case 'front':
          return {
            size: {x: m(diagLen), y: m(h), z: m(pt)},
            position: {x: 0, y: m(h / 2), z: m(centerZ)},
            rotation: {x: 0, y: rotY, z: 0},
          };
        case 'left': {
          const d = length > 0 ? length : corpus.depth;
          return {
            size: {x: m(pt), y: m(h), z: m(d)},
            position: {x: m(-(corpus.width / 2 - pt / 2) + ox), y: m(h / 2), z: m(-d / 2)},
          };
        }
        case 'right': {
          const d = length > 0 ? length : corpus.depth;
          return {
            size: {x: m(pt), y: m(h), z: m(d)},
            position: {x: m(corpus.width / 2 - pt / 2 + ox), y: m(h / 2), z: m(-d / 2)},
          };
        }
        default:
          return {
            size: {x: m(length || pt), y: m(h), z: m(pt)},
            position: {x: m(ox), y: m(h / 2), z: 0},
          };
      }
    });
  }

  /**
   * Столешница торцевого модуля — трапеция в XZ-плоскости.
   * Углы совпадают с контуром корпуса + стандартный вынос 50 мм вперёд и назад.
   */
  private buildEndTabletops(
    configs: AccessoryConfig[],
    corpus: ParsedCorpus,
    legHeight: number,
    sideType: string,
  ): ResolvedTabletop[] {
    if (!configs.length) return [];

    const {panelD, deltaZ} = this.endGeometry(corpus);
    const TH = TABLETOP_THICKNESS;
    const baseY = legHeight + corpus.height;
    const halfW = corpus.width / 2;
    const overhang = 50; // мм: стандартный вынос столешницы
    const m = (v: number) => this.helper.helper.toM(v);
    const exposedIsLeft = sideType !== 'right';

    // Трапецевидный контур совпадает с подошвой корпуса + вынос
    const trapezoidCorners = exposedIsLeft
      ? [
        {x: m(-halfW), z: m(-(deltaZ - overhang))},
        {x: m(+halfW), z: m(+overhang)},
        {x: m(+halfW), z: m(-panelD - overhang)},
        {x: m(-halfW), z: m(-panelD - overhang)},
      ]
      : [
        {x: m(+halfW), z: m(-(deltaZ - overhang))},
        {x: m(-halfW), z: m(+overhang)},
        {x: m(-halfW), z: m(-panelD - overhang)},
        {x: m(+halfW), z: m(-panelD - overhang)},
      ];

    return configs.map(() => ({
      size: {x: 0, y: m(TH), z: 0},
      position: {x: 0, y: m(baseY + TH / 2), z: 0},
      trapezoidCorners,
    }));
  }

  // ── Стандартные приватные методы ─────────────────────────────────────────

  /**
   * Передняя панель угловой тумбы — закрывает переднюю грань со стороны,
   * противоположной основному фасаду.
   */
  private buildFrontPanel(
    length: number,
    corpusWidth: number,
    corpusHeight: number,
    thickness: number,
    legHeight: number,
    sideType: string,
  ): ResolvedPanel[] {
    const m = (v: number) => this.helper.helper.toM(v);
    const sign = sideType === 'right' ? 1 : -1;
    const x = sign * (corpusWidth / 2 - length / 2);
    const y = legHeight + corpusHeight / 2;
    const z = -thickness / 2;

    return [{
      name: 'front',
      size: {x: m(length), y: m(corpusHeight), z: m(thickness)},
      position: {x: m(x), y: m(y), z: m(z)},
    }];
  }

  /**
   * Для нижних угловых тумб временно игнорируем:
   * - reverseSideType   — логика зеркалирования фасада по sideType не применяется
   * - notCheckOfferModelType — каталожный флаг, не влияет на геометрию
   */
  private normalizeFacadesForAngle(facades: any[]): any[] {
    return facades.map(({reverseSideType: _, notCheckOfferModelType: __, ...rest}) => rest);
  }
}
