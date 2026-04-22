import {inject, Injectable} from '@angular/core';
import {KitchenHelperService} from './kitchen-helper.service';
import {
  AccessoryConfig, FacadeConfig, JsonOption, LegConfig,
  OptionGroup, OptionOrGroup, ParsedCorpus, ParsedGroups, ParsedSizes,
  PlankConfig, RadioButtonOption, ResolvedFacade, ResolvedLeg, ResolvedPanel,
  ResolvedPlinth, ResolvedRod, ResolvedShelf, ResolvedTabletop,
  RodConfig, ShelfConfig, Vec3,
} from '../interfaces/unit-config.models';
import {
  ALIGN_BOTTOM, ALIGN_CENTER, ALIGN_LEFT, ALIGN_RIGHT, ALIGN_TOP,
  OPTION_TYPE_HIDDEN_NUMBER, OPTION_TYPE_HIDDEN_TEXT,
  OPTION_TYPE_JSON, OPTION_TYPE_RADIOBUTTON,
} from '../constants';

export const DEFAULT_LEG_HEIGHT = 150; // мм
export const DEFAULT_LEG_RADIUS = 15;  // мм
export const DEFAULT_FACADE_DEPTH = 19;  // мм
export const DEFAULT_HANDLE_DEPTH = 22;  // мм
export const PLINTH_THICKNESS = 16;  // мм
export const TABLETOP_THICKNESS = 38;  // мм

@Injectable({providedIn: 'root'})
export class UnitBuildHelpers {
  readonly helper = inject(KitchenHelperService);

  // ── Разбор групп опций ──────────────────────────────────────────────────

  parseGroups(options: OptionOrGroup[]): ParsedGroups {
    const getGroup = (id: string): OptionGroup | undefined =>
      options.find((o): o is OptionGroup => 'isGroup' in o && o.id === id);

    const getOption = (id: string) =>
      options.find((o) => !('isGroup' in o) && o.id === id);

    // группа размеров
    const sizesGroup = getGroup('sizes');
    const sizes: ParsedSizes = {
      height: this.getHiddenNumber(sizesGroup?.options ?? [], 'height') ?? 870,
      depth: this.getHiddenNumber(sizesGroup?.options ?? [], 'depth') ?? 600,
    };

    // группа корпуса
    const corpusGroup = getGroup('corpus');
    const corpusOpts = corpusGroup?.options ?? [];
    const widthOpt = corpusOpts.find(
      (o): o is RadioButtonOption => o.type === OPTION_TYPE_RADIOBUTTON && o.id === 'width',
    );
    const frontPanelOpt = corpusOpts.find(o => !('isGroup' in o) && o.id === 'frontPanel');
    const corpus: ParsedCorpus = {
      catalogCode: this.getHiddenText(corpusOpts, 'catalogCode') ?? '',
      width: widthOpt ? parseFloat(widthOpt.defaultValue) : (this.getHiddenNumber(corpusOpts, 'width') ?? 450),
      availableWidths: widthOpt ? widthOpt.items.map((i: any) => parseFloat(i.id)) : [],
      height: this.getHiddenNumber(corpusOpts, 'height') ?? 720,
      depth: this.getHiddenNumber(corpusOpts, 'depth') ?? 478,
      thickness: this.getHiddenNumber(corpusOpts, 'thickness') ?? 16,
      backThickness: this.getHiddenNumber(corpusOpts, 'backThickness') ?? 4,
      frontPanel: frontPanelOpt && 'value' in frontPanelOpt ? (frontPanelOpt.value as { length: number }) : undefined,
      bottomGap: this.getHiddenNumber(corpusOpts, 'bottomGap'),
      smallWidth: this.getHiddenNumber(corpusOpts, 'smallWidth'),
      smallDepth: this.getHiddenNumber(corpusOpts, 'smallDepth'),
      sideDepth: this.getHiddenNumber(corpusOpts, 'sideDepth'),
      sideWidth: this.getHiddenNumber(corpusOpts, 'backSideDepth'),
    };

    // className — опция верхнего уровня (не группа)
    const classNameOpt: any = getOption('className');
    const className =
      (classNameOpt?.type === OPTION_TYPE_HIDDEN_TEXT || classNameOpt?.type === 'hiddenText')
        ? classNameOpt.value : '';

    // sideType — radioButton со значениями "left" | "right"
    const sideTypeOpt: any = getOption('sideType');
    const sideType: string =
      (sideTypeOpt?.type === OPTION_TYPE_RADIOBUTTON || sideTypeOpt?.type === 'radioButton')
        ? (sideTypeOpt.defaultValue ?? 'left') : 'left';

    // JSON-массивы
    const facades = this.getJsonValue<FacadeConfig>(options, 'facades');
    const legs = this.getJsonValue<LegConfig>(options, 'legs');
    const shelves = this.getJsonValue<ShelfConfig>(getGroup('corpus')?.options ?? options, 'shelves').length
      ? this.getJsonValue<ShelfConfig>(getGroup('corpus')?.options ?? options, 'shelves')
      : this.getJsonValue<ShelfConfig>(options, 'shelves');
    const rods = this.getJsonValue<RodConfig>(options, 'rods');
    const tabletops = this.getJsonValue<AccessoryConfig>(options, 'tabletops');
    const aprons = this.getJsonValue<AccessoryConfig>(options, 'aprons');
    const plinths = this.getJsonValue<AccessoryConfig>(options, 'plinths');
    const corners = this.getJsonValue<AccessoryConfig>(options, 'corners');


    const planks = this.getJsonValue<AccessoryConfig>(corpusOpts, 'planks') as any;

    return {
      sizes,
      corpus,
      className,
      sideType,
      facades,
      legs,
      shelves,
      rods,
      tabletops,
      aprons,
      plinths,
      corners,
      planks
    };
  }

  // ── Панели (стенки корпуса) ─────────────────────────────────────────────
  //catalogType?: string,
  //     smallWidth?: number,  // ширина торцевой боковой панели (N_ENDF)
  //     smallDepth?: number,  // глубина торцевой боковой панели (N_ENDF)
  //     sideType?: string,    // 'left' | 'right' — открытая сторона торцевого модуля

  buildPanels(
    width: number,
    height: number,
    depth: number,
    t: number,         // толщина боковой стенки
    bt: number,        // толщина задней стенки
    options: Record<string, any>
  ): ResolvedPanel[] {
    const innerW = width - t * 2;
    const panelD = depth - bt;  // панели не заходят в зону задней стенки
    const baseY = options['legHeight'] || 0;   // нижняя граница корпуса над полом
    const m = (v: number) => this.helper.toM(v);

    const facadesConfig = {
      back: {
        name: 'back',
        size: {x: m(width), y: m(height), z: m(bt)},
        position: {x: 0, y: m(baseY + height / 2), z: m(-(depth - bt / 2))}
      },
      front: {
        name: 'front',
        size: {x: m(width), y: m(height), z: m(bt)},
        position: {x: 0, y: m(baseY + height / 2), z: m(-bt / 2)}
      },
      left: {
        name: 'left',
        size: {x: m(t), y: m(height), z: m(panelD)},
        position: {x: m(-(width / 2 - t / 2)), y: m(baseY + height / 2), z: m(-(panelD / 2))}
      },
      right: {
        name: 'right',
        size: {x: m(t), y: m(height), z: m(panelD)},
        position: {x: m(width / 2 - t / 2), y: m(baseY + height / 2), z: m(-(panelD / 2))}
      },
      bottom: {
        name: 'bottom',
        size: {x: m(innerW), y: m(t), z: m(panelD)},
        position: {x: 0, y: m(baseY + t / 2), z: m(-(panelD / 2))}
      },
      top: {
        name: 'top',
        size: {x: m(innerW), y: m(t), z: m(panelD)},
        position: {x: 0, y: m(height - bt * 2), z: m(-(panelD / 2))}
      },
    };


    let facades = []

    switch (options['catalogCode']) {
      case "N_BAR":
        facades.push(facadesConfig.front, facadesConfig.back)
        break;
      case "VU_590":
      case "VU_599": {
        // Угловой шкаф: пятиугольный корпус в плане XZ.
        // sd = sideDepth: глубина боковой панели (от задней стенки) и ширина передней подпорки.
        // sw = sideWidth (backSideDepth): толщина тонкой передней подпорки.
        const exposedIsLeft = options['sideType'] !== 'right';
        const sd = options['sideDepth'] || width;   // 300 мм
        const sw = options['sideWidth'] ?? bt;       // 4 мм
        const half = innerW / 2;                    // innerHalfW = 280 мм
        const deltaZ = panelD - sd;                 // 288 мм

        // Пятиугольник (XZ, 5 вершин, против часовой сверху):
        // Для exposedIsLeft=true: левая сторона — полная, правая — sd от задней стенки.
        // Диагональный фасад: от c1 до c2.
        const pentagonCorners = exposedIsLeft
          ? [
            {x: m(-half), z: 0},          // c0: передне-левый (полная левая)
            {x: m(-half + sd), z: 0},           // c1: правый конец передней подпорки
            {x: m(+half), z: m(-deltaZ)},  // c2: передняя грань короткой правой панели
            {x: m(+half), z: m(-panelD)},  // c3: задне-правый
            {x: m(-half), z: m(-panelD)},  // c4: задне-левый
          ]
          : [
            {x: m(+half), z: 0},           // c0: передне-правый (полная правая)
            {x: m(+half - sd), z: 0},            // c1: левый конец передней подпорки
            {x: m(-half), z: m(-deltaZ)},   // c2: передняя грань короткой левой панели
            {x: m(-half), z: m(-panelD)},   // c3: задне-левый
            {x: m(+half), z: m(-panelD)},   // c4: задне-правый
          ];

        // Дно — пятиугольная панель
        const bottomPanel: ResolvedPanel = {
          name: 'bottom',
          size: {x: 0, y: m(t), z: 0},
          position: {x: 0, y: m(baseY + t / 2), z: 0},
          trapezoidCorners: pentagonCorners,
        };

        // Передняя подпорка (ширина sd, толщина sw)
        const frontCenterX = exposedIsLeft ? m(-half + sd / 2) : m(+half - sd / 2);
        const frontPanel: ResolvedPanel = {
          name: 'front',
          size: {x: m(sd), y: m(height), z: m(sw)},
          position: {x: frontCenterX, y: m(baseY + height / 2), z: m(-sw / 2)},
        };

        // Короткая боковая панель (глубина sd, от задней стенки)
        const shortSideX = exposedIsLeft ? m(width / 2 - t / 2) : m(-(width / 2 - t / 2));
        const shortSidePanel: ResolvedPanel = {
          name: exposedIsLeft ? 'right' : 'left',
          size: {x: m(t), y: m(height), z: m(sd)},
          position: {x: shortSideX, y: m(baseY + height / 2), z: m(-panelD + sd / 2)},
        };

        // Крышка — пятиугольная (только для верхних шкафов)
        if (options['level'] === 'top') {
          facades.push({
            name: 'top',
            size: {x: 0, y: m(t), z: 0},
            position: {x: 0, y: m(baseY + height - t / 2), z: 0},
            trapezoidCorners: pentagonCorners,
          });
        }

        const fullSide = exposedIsLeft ? facadesConfig.left : facadesConfig.right;
        facades.push(fullSide, facadesConfig.back, bottomPanel, frontPanel, shortSidePanel);
        break;
      }
      case "VU_700":
        const exposedIsLeft = options['sideType'] !== 'right';
        const exposedMultiplier = exposedIsLeft ? -1 : 1;
        if (options['frontPanel']) {
          const frontWidth = options['frontPanel'].length;
          const front = {
            name: 'front',
            size: {x: m(frontWidth), y: m(height), z: m(bt)},
            position: {x: m((innerW - frontWidth) / 2) * exposedMultiplier, y: m(baseY + height / 2), z: m(-bt / 2)}
          }
          facades.push(front);
        }

        if (options['planks']) {
          options['planks'].forEach((plank: PlankConfig, index: number) => {
            const x = (width * exposedMultiplier / 2) - plank.position.x  * exposedMultiplier;
            const y = height / 2 + (plank.position.y ?? 0);
            const z = t;

            const plankConfig = {
              name: 'plank-' + index,
              size: {x: m(plank.length), y: m(t), z: m(50)},
              position: {x: m(x), y: m(y), z: m(z)},
              rotation: {x: plank?.rotation?.x ?? 0, y: plank?.rotation?.y ?? 0, z: plank?.rotation?.z ?? 0},
            };
            facades.push(plankConfig);
          })
        }

        facades.push(facadesConfig.left, facadesConfig.right, facadesConfig.bottom, facadesConfig.back);
        break;
      case "N_SM":
        facades.push(facadesConfig.left, facadesConfig.right);
        break;
      // Торцевые модули: нижние (N_END, N_ENDF) и верхние (VT_*, VPU_*)
      // — трапеция в плане, открытая сторона — малая боковая панель (sd × sw)
      // — закрытая сторона — стандартная панель полной глубины
      // — дно (и крышка для верхних) — трапециевидные панели
      case "VT_300":
      case "VT_309":
      case "VPU_300":
      case "VPU_309":
      case "N_END":
      case "N_ENDF": {
        // TODO найти определение для smallWidth
        // const sw = options['smallWidth'] ?? t;
        const sw = t;
        const sd = options['smallDepth'] ?? panelD;
        const exposedIsLeft = options['sideType'] !== 'right';

        const endPanel: ResolvedPanel = {
          name: exposedIsLeft ? 'left' : 'right',
          size: {x: m(sw), y: m(height), z: m(sd)},
          position: {
            x: exposedIsLeft ? m(-(width / 2 - sw / 2)) : m(width / 2 - sw / 2),
            y: m(baseY + height / 2),
            z: m(-(panelD - sd / 2)),
          },
        };
        // Трапециевидный контур (XZ, против часовой стрелки сверху):
        // c0 = торцевой фронт, c1 = большой фронт, c2 = зад-большой, c3 = зад-малый
        const deltaZ = panelD - sd;
        const halfW = innerW / 2;
        const trapezoidCorners = exposedIsLeft
          ? [
            {x: m(-halfW), z: m(-deltaZ)},  // c0: фронт малой стенки (лево)
            {x: m(+halfW), z: 0},            // c1: фронт большой стенки (право)
            {x: m(+halfW), z: m(-panelD)},   // c2: зад-право
            {x: m(-halfW), z: m(-panelD)},   // c3: зад-лево
          ]
          : [
            {x: m(+halfW), z: m(-deltaZ)},   // c0: фронт малой стенки (право)
            {x: m(-halfW), z: 0},             // c1: фронт большой стенки (лево)
            {x: m(-halfW), z: m(-panelD)},    // c2: зад-лево
            {x: m(+halfW), z: m(-panelD)},    // c3: зад-право
          ];

        const bottomPanel: ResolvedPanel = {
          name: 'bottom',
          size: {x: 0, y: m(t), z: 0},
          position: {x: 0, y: m(baseY + t / 2), z: 0},
          trapezoidCorners,
        };
        const closedPanel = exposedIsLeft ? facadesConfig.right : facadesConfig.left;
        facades.push(closedPanel, facadesConfig.back, endPanel, bottomPanel);

        // Верхние торцевые: крышка тоже трапеция
        if (options['level'] === 'top') {
          facades.push({
            name: 'top',
            size: {x: 0, y: m(t), z: 0},
            position: {x: 0, y: m(baseY + height - t / 2), z: 0},
            trapezoidCorners,
          });
        }
        break;
      }
      default:
        facades.push(facadesConfig.left, facadesConfig.back, facadesConfig.right, facadesConfig.bottom);
        break;
    }
    const strengtheningElements = this.buildStrengtheningPanels(width, height, depth, t, bt, options['legHeight'], options['catalogType']);

    // Крышка для верхних шкафов (прямоугольная).
    // End-юниты добавляют трапециевидную крышку внутри своего case.
    const isEndCode = ['VT_300', 'VT_309', 'VPU_300', 'VPU_309', 'N_END', 'N_ENDF', 'VU_590', 'VU_599']
      .includes(options['catalogCode']);
    if (options['level'] === 'top' && !isEndCode) {
      facades.push(facadesConfig.top);
    }

    return [...facades, ...strengtheningElements];
  }

  buildStrengtheningPanels(
    width: number,
    height: number,
    depth: number,
    t: number,         // толщина боковой стенки
    bt: number,        // толщина задней стенки
    legHeight: number,
    catalogType?: string
  ): ResolvedPanel[] {
    const innerW = width - t * 2;
    const panelD = depth - bt;  // панели не заходят в зону задней стенки
    const baseY = legHeight;   // нижняя граница корпуса над полом
    const m = (v: number) => this.helper.toM(v);

    const result: ResolvedPanel[] = [];
    switch (catalogType) {
      case 'N_BAR':
        const topStrengtheningXSize = m(width / 4);
        result.push(
          {
            name: 'topStrengtheningRight',
            size: {x: topStrengtheningXSize, y: m(bt), z: m(depth)},
            position: {x: m(width / 2) - topStrengtheningXSize / 2, y: m(baseY + height - bt), z: m(-depth / 2)}
          },
          {
            name: 'topStrengtheningLeft',
            size: {x: topStrengtheningXSize, y: m(bt), z: m(depth)},
            position: {x: -m(width / 2) + topStrengtheningXSize / 2, y: m(baseY + height - bt), z: m(-depth / 2)}
          },
          {
            name: 'topStrengtheningMid',
            size: {x: topStrengtheningXSize, y: m(bt), z: m(depth)},
            position: {x: 0, y: m(baseY + height - bt), z: m(-depth / 2)}
          },
        )
        break
      case "N_SM":
        result.push(
          {
            name: 'bottomStrengthening',
            size: {x: m(width), y: m(100), z: m(bt)},
            position: {x: m(0), y: m(50), z: m(0)}
          },
          {
            name: 'backStrengthening',
            size: {x: m(width), y: m(100), z: m(bt)},
            position: {x: m(0), y: m(height / 2 + 50), z: -m(depth)}
          },
        )
        break
      default:
        break;
    }
    return result;
  }

  // ── Фасады ──────────────────────────────────────────────────────────────

  buildFacades(
    configs: FacadeConfig[],
    corpusWidth: number,
    corpusHeight: number,
    _corpusDepth: number,
    legHeight: number,
    sideType: string = 'left',
  ): ResolvedFacade[] {
    const baseY = legHeight;
    const facadeD = DEFAULT_FACADE_DEPTH;
    const m = (v: number) => this.helper.toM(v);
    const mirrorX = sideType === 'right';

    return configs.map((fc: FacadeConfig) => {
      const rawW = this.helper.calculateSizeByParent(fc.initSizes.width, corpusWidth);
      const w = rawW - fc.gap.left - fc.gap.right;
      const rawH = this.helper.calculateSizeByParent(fc.initSizes.height, corpusHeight);
      const h = rawH - fc.gap.top - fc.gap.bottom;

      let y = this.resolveAlignY(fc?.align?.y || '0', h, corpusHeight, fc.gap, baseY);
      if (fc.margin?.y !== undefined) y += fc.margin.y;

      let x = 0;
      if (fc.align?.x === ALIGN_LEFT) {
        x = -(corpusWidth / 2 - w / 2);
      } else if (fc.align?.x === ALIGN_RIGHT) {
        x = corpusWidth / 2 - w / 2;
      } else {
        x = fc.margin?.x
          ? (corpusWidth / 2 - w / 2) + fc.margin.x
          : corpusWidth / 2 - w / 2;
      }

      // disableSideTypes: фасад имеет фиксированную позицию, глобальный sideType не применяется
      if (mirrorX && !fc.disableSideTypes) x = -x;

      let z = facadeD / 2;
      if (fc.margin?.z) {
        z += fc.margin?.z / 2;
      }

      const handle = this.buildHandle(fc, w, h, x, y, z, facadeD);

      return {
        size: {x: m(w), y: m(h), z: m(facadeD)},
        position: {x: m(x), y: m(y), z: m(z)},
        openType: fc.openType,
        functionalType: fc.functionalType,
        modelType: fc.modelType,
        handle,
      };
    });
  }

  resolveAlignY(
    alignY: string,
    facadeH: number,
    corpusH: number,
    gap: FacadeConfig['gap'],
    baseY: number,
  ): number {
    switch (alignY) {
      case ALIGN_TOP:
        return baseY + corpusH - gap.top - facadeH / 2;
      case ALIGN_BOTTOM:
        return baseY + gap.bottom + facadeH / 2;
      case ALIGN_CENTER:
      default:
        return baseY + corpusH / 2;
    }
  }

  buildHandle(
    fc: FacadeConfig,
    facadeW: number,
    facadeH: number,
    facadeX: number,
    facadeY: number,
    facadeZ: number,
    facadeD: number,
  ): ResolvedFacade['handle'] | undefined {
    if (fc.handle == null) return undefined;

    const hW = 120;
    const hH = 20;
    const hD = DEFAULT_HANDLE_DEPTH;
    const m = (v: number) => this.helper.toM(v);

    let hx = facadeX;
    if (fc.handle.align.x === ALIGN_LEFT) hx = facadeX - (facadeW / 2 - hW / 2);
    if (fc.handle.align.x === ALIGN_RIGHT) hx = facadeX + (facadeW / 2 - hW / 2);

    let hy = facadeY;
    const marginY = fc.handle.margin?.y ?? 20;
    if (fc.handle.align.y === ALIGN_TOP) hy = facadeY + facadeH / 2 - hH / 2 - marginY;
    if (fc.handle.align.y === ALIGN_BOTTOM) hy = facadeY - facadeH / 2 + hH / 2 + marginY;

    const hz = facadeZ + facadeD / 2 + hD / 2;
    const rotation: Vec3 | undefined = fc.handle.location === 'vertical'
      ? {x: 0, y: 0, z: Math.PI / 2}
      : undefined;

    return {
      size: {x: m(hW), y: m(hH), z: m(hD)},
      position: {x: m(hx), y: m(hy), z: m(hz)},
      rotation,
    };
  }

  // ── Ножки ───────────────────────────────────────────────────────────────

  buildLegs(configs: LegConfig[], corpusWidth: number, corpusDepth: number): ResolvedLeg[] {
    if (!configs.length) return [];

    const legH = this.resolveLegHeight(configs);
    const radius = DEFAULT_LEG_RADIUS;
    const m = (v: number) => this.helper.toM(v);

    return configs.map((lc) => {
      const rawX = this.helper.calculateSizeByParent(lc.initPosition.x, corpusWidth);
      const rawZ = this.helper.calculateSizeByParent(lc.initPosition.z, corpusDepth);
      const x = rawX - corpusWidth / 2;
      const z = -(rawZ);
      const y = legH / 2;

      return {
        radius: m(lc.width ? lc.width / 2 : radius),
        height: m(legH),
        position: {x: m(x), y: m(y), z: m(z)},
      };
    });
  }

  resolveLegHeight(configs: LegConfig[], bottomGap?: number): number {
    if (!configs.length) return bottomGap ?? DEFAULT_LEG_HEIGHT;
    const h = configs[0].height;
    return h !== undefined ? h : DEFAULT_LEG_HEIGHT;
  }

  // ── Полки ───────────────────────────────────────────────────────────────

  buildShelves(
    configs: ShelfConfig[],
    corpusWidth: number,
    corpusDepth: number,
    corpusHeight: number,
    thickness: number,
    backThickness: number,
    legHeight: number,
  ): ResolvedShelf[] {

    const innerW = corpusWidth - thickness * 2;
    const innerD = corpusDepth - backThickness;
    const m = (v: number) => this.helper.toM(v);

    return configs.map((sc) => {
      const depth = this.helper.calculateSizeByParent(sc.depth, innerD);
      const rawY = this.helper.calculateSizeByParent(sc.initPosition.y, corpusHeight);
      const y = legHeight + rawY;

      if (sc.type === 'vertical') {
        // Вертикальная перегородка: length — высота, thickness — ширина.
        //
        // initPosition.x — позиция ВНЕШНЕЙ грани перегородки от левой ВНЕШНЕЙ стенки корпуса
        // (parent = corpusWidth). Поправка на thickness/2 переводит грань в центр:
        //   left-side  (rawX ≤ corpusWidth/2): centre = rawX - corpusWidth/2 + thickness/2
        //   right-side (rawX >  corpusWidth/2): centre = rawX - corpusWidth/2 - thickness/2
        let x = 0;
        if (sc.initPosition.x !== undefined) {
          const rawX = this.helper.calculateSizeByParent(sc.initPosition.x, corpusWidth);
          const sign = rawX <= corpusWidth / 2 ? 1 : -1;
          x = rawX - corpusWidth / 2 + sign * sc.thickness / 2;
        }
        const length = this.helper.calculateSizeByParent(sc.length, corpusHeight);
        return {
          size: {x: m(sc.thickness), y: m(length), z: m(depth)},
          position: {x: m(x), y: m(y), z: m(-(depth / 2))},
        };
      }

      // horizontal (по умолчанию): length — ширина, thickness — высота.
      // initPosition.x — центр полки от левой внутренней стенки (parent = innerW).
      const x = sc.initPosition.x !== undefined
        ? -(innerW / 2) + this.helper.calculateSizeByParent(sc.initPosition.x, innerW)
        : 0;
      const length = this.helper.calculateSizeByParent(sc.length, innerW);
      return {
        size: {x: m(length), y: m(sc.thickness), z: m(depth)},
        position: {x: m(x), y: m(y), z: m(-(depth / 2))},
      };
    });
  }

  // ── Штанги ──────────────────────────────────────────────────────────────

  buildRods(
    configs: RodConfig[],
    corpusWidth: number,
    corpusDepth: number,
    corpusHeight: number,
    legHeight: number,
  ): ResolvedRod[] {
    const innerW = corpusWidth - 32; // стандартный отступ 16 мм с каждой стороны
    const m = (v: number) => this.helper.toM(v);

    return configs.map((rc) => {
      const rawY = this.helper.calculateSizeByParent(rc.initPosition.y, corpusHeight);
      const y = legHeight + rawY;
      const z = -(corpusDepth / 2);

      return {
        radius: m(rc.radius),
        length: m(innerW),
        position: {x: 0, y: m(y), z: m(z)},
      };
    });
  }

  // ── Цоколи ──────────────────────────────────────────────────────────────

  buildPlinths(
    configs: AccessoryConfig[],
    corpusWidth: number,
    corpusDepth: number,
    legHeight: number,
    smallDepth?: number,
    sideType?: string,
  ): ResolvedPlinth[] {
    if (!configs.length) return [];

    const plinthThickness = PLINTH_THICKNESS;
    const m = (v: number) => this.helper.toM(v);

    // Параметры трапеции для N_ENDF (только если smallDepth задан)
    const hasSmall = smallDepth !== undefined && smallDepth > 0;
    const deltaZ = hasSmall ? corpusDepth - smallDepth! : 0;
    const diagLen = hasSmall ? Math.sqrt(corpusWidth * corpusWidth + deltaZ * deltaZ) : 0;
    const angle = hasSmall ? Math.atan2(deltaZ, corpusWidth) : 0;
    // sideType='left' → открытая сторона слева, фасад поворачивается вправо-вперёд → rotY отрицательный
    const rotY = sideType === 'right' ? angle : -angle;
    const exposedIsLeft = sideType !== 'right';

    return configs.map((pc) => {
      const length = pc.initSizes?.length ? Number(pc.initSizes.length) : 0;
      const h = legHeight;
      const ox = (pc.initPosition?.x ?? 0) + (pc.margin?.x ?? 0);
      const oz = pc.initPosition?.z ?? 0;

      let w: number, d: number, x: number, y: number, z: number;
      let rotation: Vec3 | undefined;

      switch (pc.positionType) {
        case 'front':
          if (hasSmall) {
            // Диагональный цоколь: длина = диагональ, повёрнут как фасад
            w = diagLen;
            d = plinthThickness;
            x = ox;
            y = h / 2;
            z = -(deltaZ / 2);  // центр диагонали
            rotation = {x: 0, y: rotY, z: 0};
          } else {
            w = length > 0 ? length : corpusWidth;
            d = plinthThickness;
            x = ox;
            y = h / 2;
            z = -plinthThickness / 2;
          }
          break;

        case 'back':
          w = length > 0 ? length : corpusWidth;
          d = plinthThickness;
          x = ox;
          y = h / 2;
          z = -(corpusDepth - plinthThickness / 2);
          break;

        case 'left':
          if (hasSmall && exposedIsLeft) {
            // Открытая левая сторона: глубина = smallDepth, позиция от задней стенки
            d = smallDepth!;
            w = plinthThickness;
            x = -(corpusWidth / 2 - plinthThickness / 2) + ox;
            y = h / 2;
            z = -(corpusDepth - d / 2);
          } else {
            w = plinthThickness;
            d = length > 0 ? length : corpusDepth;
            x = -(corpusWidth / 2 - plinthThickness / 2) + ox;
            y = h / 2;
            z = -d / 2;
          }
          break;

        case 'right':
          if (hasSmall && !exposedIsLeft) {
            // Открытая правая сторона: глубина = smallDepth, позиция от задней стенки
            d = smallDepth!;
            w = plinthThickness;
            x = corpusWidth / 2 - plinthThickness / 2 + ox;
            y = h / 2;
            z = -(corpusDepth - d / 2);
          } else {
            w = plinthThickness;
            d = length > 0 ? length : corpusDepth;
            x = corpusWidth / 2 - plinthThickness / 2 + ox;
            y = h / 2;
            z = -d / 2;
          }
          break;

        case 'none':
        default:
          w = length || plinthThickness;
          d = plinthThickness;
          x = ox;
          y = h / 2;
          z = oz / 1000 + d;
          rotation = {x: pc.rotation?.x ?? 0, y: pc.rotation?.y ?? 0, z: pc.rotation?.z ?? 0};
          break;
      }

      return {
        size: {x: m(w), y: m(h), z: m(d)},
        position: {x: m(x), y: m(y), z: m(z)},
        rotation,
      };
    });
  }

  // ── Столешницы ─────────────────────────────────────────────────────────

  buildTabletops(
    configs: AccessoryConfig[],
    corpusWidth: number,
    corpusDepth: number,
    corpusHeight: number,
    legHeight: number,
    smallDepth?: number,
    sideType?: string,
  ): ResolvedTabletop[] {
    if (!configs.length) return [];

    const TH = TABLETOP_THICKNESS;
    const m = (v: number) => this.helper.toM(v);
    const baseY = legHeight + corpusHeight;
    const overhang = 30; // мм — вынос вперёд (стандарт)
    const backOverhang = 0;   // задняя кромка у стенки

    // Для N_ENDF: трапецевидная столешница с теми же параметрами выноса,
    // что и стандартная (+100 мм по глубине, +50 мм по позиции).
    if (smallDepth !== undefined && smallDepth > 0) {
      const deltaZ = corpusDepth - smallDepth;
      const halfW = corpusWidth / 2;
      const exposedIsLeft = sideType !== 'right';

      // Углы трапеции в мм (XZ), CCW сверху:
      // c0 — фронт открытой (малой) стороны + вынос
      // c1 — фронт закрытой (большой) стороны + вынос
      // c2 — зад закрытой стороны
      // c3 — зад открытой стороны
      const trapezoidCorners = exposedIsLeft
        ? [
          {x: m(-halfW), z: m(-(deltaZ - overhang))},
          {x: m(+halfW), z: m(+overhang)},
          {x: m(+halfW), z: m(-(corpusDepth + backOverhang))},
          {x: m(-halfW), z: m(-(corpusDepth + backOverhang))},
        ]
        : [
          {x: m(+halfW), z: m(-(deltaZ - overhang))},
          {x: m(-halfW), z: m(+overhang)},
          {x: m(-halfW), z: m(-(corpusDepth + backOverhang))},
          {x: m(+halfW), z: m(-(corpusDepth + backOverhang))},
        ];

      return configs.map(() => ({
        size: {x: 0, y: m(TH), z: 0},
        position: {x: 0, y: m(baseY + TH / 2), z: 0},
        trapezoidCorners,
      }));
    }

    // Стандартная прямоугольная столешница
    return configs.map((tc) => {
      const length = Number(tc.initSizes?.length ?? tc.sizes?.length ?? corpusWidth);
      const width = Number(tc.sizes?.width ?? tc.initSizes?.width ?? corpusDepth);
      const x = tc.margin?.x ?? 0;
      const y = baseY + TH / 2;
      const z = -(width / 2) + (tc.margin?.z ?? 0);

      let rotation: Vec3 | undefined;
      if (tc.rotation?.y) rotation = {x: tc.rotation.x ?? 0, y: tc.rotation.y, z: tc.rotation.z ?? 0};

      // TODO + 50 к позиции и + 100 к глубине столешницы ( нужно запросить размеры )
      return {
        size: {x: m(length), y: m(TH), z: m(width + overhang)},
        position: {x: m(x), y: m(y), z: m(z + 50)},
        rotation,
      };
    });
  }

  // ── Вспомогательные методы ───────────────────────────────────────────────

  getJsonValue<T>(options: OptionOrGroup[], id: string): T[] {
    const opt = options.find((o): o is JsonOption<T> => !('isGroup' in o) && o.id === id && o.type === OPTION_TYPE_JSON);
    return (opt?.value as T[]) ?? [];
  }

  getHiddenNumber(options: OptionOrGroup[], id: string): number | undefined {
    const opt = options.find((o) => !('isGroup' in o) && o.id === id && o.type === OPTION_TYPE_HIDDEN_NUMBER);
    return opt && 'value' in opt ? (opt.value as number) : undefined;
  }

  getHiddenText(options: OptionOrGroup[], id: string): string | undefined {
    const opt = options.find((o) => o.id === id && (o as any).type === OPTION_TYPE_HIDDEN_TEXT);
    return opt && 'value' in opt ? (opt.value as string) : undefined;
  }
}
