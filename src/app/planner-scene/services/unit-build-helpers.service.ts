import {inject, Injectable} from '@angular/core';
import {KitchenHelperService} from './kitchen-helper.service';
import {
  AccessoryConfig, FacadeConfig, JsonOption, LegConfig,
  OptionGroup, OptionOrGroup, ParsedCorpus, ParsedGroups, ParsedSizes,
  RadioButtonOption, ResolvedFacade, ResolvedLeg, ResolvedPanel,
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

    return {sizes, corpus, className, sideType, facades, legs, shelves, rods, tabletops, aprons, plinths, corners};
  }

  // ── Панели (стенки корпуса) ─────────────────────────────────────────────

  buildPanels(
    width: number,
    height: number,
    depth: number,
    t: number,         // толщина боковой стенки
    bt: number,        // толщина задней стенки
    legHeight: number,
    catalogType?: string,
  ): ResolvedPanel[] {
    const innerW = width - t * 2;
    const panelD = depth - bt;  // панели не заходят в зону задней стенки
    const baseY = legHeight;   // нижняя граница корпуса над полом
    const m = (v: number) => this.helper.toM(v);

    const facades = [
      {
        name: 'back',
        size: {x: m(width), y: m(height), z: m(bt)},
        position: {x: 0, y: m(baseY + height / 2), z: m(-(depth - bt / 2))}
      },
    ]

    switch (catalogType) {
      case "N_BAR":
        facades.push({
          name: 'front',
          size: {x: m(width), y: m(height), z: m(bt)},
          position: {x: 0, y: m(baseY + height / 2), z: m(-bt / 2)}
        })
        break;
      default:
        facades.push({
            name: 'left',
            size: {x: m(t), y: m(height), z: m(panelD)},
            position: {x: m(-(width / 2 - t / 2)), y: m(baseY + height / 2), z: m(-(panelD / 2))}
          },
          {
            name: 'right',
            size: {x: m(t), y: m(height), z: m(panelD)},
            position: {x: m(width / 2 - t / 2), y: m(baseY + height / 2), z: m(-(panelD / 2))}
          },
          {
            name: 'bottom',
            size: {x: m(innerW), y: m(t), z: m(panelD)},
            position: {x: 0, y: m(baseY + t / 2), z: m(-(panelD / 2))}
          })
        break;
    }
    const strengtheningElements = this.buildStrengtheningPanels(width, height, depth, t, bt, legHeight, catalogType);

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
            position: {x: m(width / 2)  - topStrengtheningXSize / 2, y: m(baseY + height - bt), z: m(-depth / 2)}
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
  ): ResolvedPlinth[] {
    if (!configs.length) return [];

    const plinthThickness = PLINTH_THICKNESS;
    const m = (v: number) => this.helper.toM(v);

    return configs.map((pc) => {
      const length = pc.initSizes?.length ? Number(pc.initSizes.length) : 0;
      const h = legHeight;
      const ox = (pc.initPosition?.x ?? 0) + (pc.margin?.x ?? 0);
      const oz = pc.initPosition?.z ?? 0;

      let w: number, d: number, x: number, y: number, z: number;
      let rotation: Vec3 | undefined;

      switch (pc.positionType) {
        case 'front':
          w = length > 0 ? length : corpusWidth;
          d = plinthThickness;
          x = ox;
          y = h / 2;
          z = -plinthThickness / 2;
          break;
        case 'back':
          w = length > 0 ? length : corpusWidth;
          d = plinthThickness;
          x = ox;
          y = h / 2;
          z = -(corpusDepth - plinthThickness / 2);
          break;
        case 'left':
          w = plinthThickness;
          d = length > 0 ? length : corpusDepth;
          x = -(corpusWidth / 2 - plinthThickness / 2) + ox;
          y = h / 2;
          z = -d / 2;
          break;
        case 'right':
          w = plinthThickness;
          d = length > 0 ? length : corpusDepth;
          x = corpusWidth / 2 - plinthThickness / 2 + ox;
          y = h / 2;
          z = -d / 2;
          break;
        case 'none':
        default:
          // TODO не уверен в расчетах
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
  ): ResolvedTabletop[] {
    if (!configs.length) return [];

    const TH = TABLETOP_THICKNESS;
    const m = (v: number) => this.helper.toM(v);
    const baseY = legHeight + corpusHeight;

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
        size: {x: m(length), y: m(TH), z: m(width + 100)},
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
