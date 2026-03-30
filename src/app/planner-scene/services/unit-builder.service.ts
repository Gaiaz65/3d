import { inject, Injectable } from '@angular/core';

import { KitchenHelperService } from './kitchen-helper.service';
import {
  AccessoryConfig,
  FacadeConfig, JsonOption, LegConfig,
  OptionGroup,
  OptionOrGroup, ParsedCorpus,
  ParsedGroups,
  ParsedSizes, RadioButtonOption, ResolvedFacade, ResolvedLeg, ResolvedPanel, ResolvedPlinth, ResolvedRod, ResolvedShelf,
  ResolvedTabletop, ResolvedUnit, RodConfig, ShelfConfig,
  UnitConfig, Vec3
} from '../interfaces/unit-config.models';
import {
  OPTION_TYPE_HIDDEN_NUMBER,
  OPTION_TYPE_HIDDEN_TEXT,
  OPTION_TYPE_JSON,
  OPTION_TYPE_RADIOBUTTON
} from '../constants';


export const DEFAULT_LEG_HEIGHT = 150;
export const DEFAULT_LEG_RADIUS = 15;
export const DEFAULT_FACADE_DEPTH = 19;
export const DEFAULT_HANDLE_DEPTH = 22;

export const ALIGN_LEFT = 'left';
export const ALIGN_RIGHT = 'right';
export const ALIGN_CENTER = 'center';
export const ALIGN_TOP = 'top';
export const ALIGN_BOTTOM = 'bottom';



/**
 * UnitBuilderService
 *
 * Reproduces the core of the build.js unit builder pipeline:
 *   1. Parse option groups from the raw UnitConfig
 *   2. Resolve all SizeExpr values via KitchenHelperService
 *   3. Return a fully resolved ResolvedUnit (all coords in metres, Y-up)
 *
 * Coordinate origin: front-bottom-centre of the corpus.
 *   X: ←negative  0  positive→
 *   Y: 0 = floor level (bottom of corpus/legs)
 *   Z: 0 = front face, negative = into the wall
 */
@Injectable({ providedIn: 'root' })
export class UnitBuilderService {
  private readonly h = inject(KitchenHelperService);

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Build a fully resolved unit from a catalog UnitConfig.
   *
   * @param config        Raw catalog config object
   * @param selectedWidth Override the default corpus width (mm). If omitted,
   *                      the radiobutton defaultValue is used.
   */
  build(config: UnitConfig, selectedWidth?: number): ResolvedUnit {
    console.log(config);
    const groups = this.parseGroups(config.options);

    const corpusWidth = selectedWidth ?? groups.corpus.width;
    const outerHeight = groups.sizes.height;
    const outerDepth = groups.sizes.depth;
    const { height: corpusH, depth: corpusD, thickness, backThickness } = groups.corpus;

    const legHeight = this.resolveLegHeight(groups.legs);

    const panels = this.buildPanels(corpusWidth, corpusH, corpusD, thickness, backThickness, legHeight);
    const facades = this.buildFacades(groups.facades, corpusWidth, corpusH, corpusD, legHeight);
    const legs = this.buildLegs(groups.legs, corpusWidth, corpusD);
    const shelves = this.buildShelves(groups.shelves, corpusWidth, corpusD, corpusH, thickness, backThickness, legHeight);
    const rods = this.buildRods(groups.rods, corpusWidth, corpusD, corpusH, legHeight);
    const plinths = this.buildPlinths(groups.plinths, corpusWidth, corpusD, legHeight);
    const tabletops = this.buildTabletops(groups.tabletops, corpusWidth, corpusD, corpusH, legHeight);

    return {
      uid: config.uid,
      level: config.level,
      className: groups.className,
      size: {
        x: this.h.toM(corpusWidth),
        y: this.h.toM(outerHeight),
        z: this.h.toM(outerDepth),
      },
      corpusSize: {
        x: this.h.toM(corpusWidth),
        y: this.h.toM(corpusH),
        z: this.h.toM(corpusD),
      },
      corpusCatalogCode: groups.corpus.catalogCode,
      availableWidths: groups.corpus.availableWidths,
      panels,
      facades,
      legs,
      shelves,
      rods,
      plinths,
      tabletops,
    };
  }

  // ── Option group parsing ────────────────────────────────────────────────

  private parseGroups(options: OptionOrGroup[]): ParsedGroups {
    const getGroup = (id: string): OptionGroup | undefined =>
      options.find((o): o is OptionGroup => 'isGroup' in o && o.id === id);

    const getOption = (id: string) =>
      options.find((o) => !('isGroup' in o) && o.id === id);

    // sizes group
    const sizesGroup = getGroup('sizes');
    const sizes: ParsedSizes = {
      height: this.getHiddenNumber(sizesGroup?.options ?? [], 'height') ?? 870,
      depth: this.getHiddenNumber(sizesGroup?.options ?? [], 'depth') ?? 600,
    };

    // corpus group
    const corpusGroup = getGroup('corpus');
    const corpusOpts = corpusGroup?.options ?? [];
    const widthOpt = corpusOpts.find(
      (o): o is RadioButtonOption => o.type === OPTION_TYPE_RADIOBUTTON && o.id === 'width',
    );
    const corpus: ParsedCorpus = {
      catalogCode: this.getHiddenText(corpusOpts, 'catalogCode') ?? '',
      width: widthOpt ? parseFloat(widthOpt.defaultValue) : (this.getHiddenNumber(corpusOpts, 'width') ?? 450),
      availableWidths: widthOpt ? widthOpt.items.map((i: any) => parseFloat(i.id)) : [],
      height: this.getHiddenNumber(corpusOpts, 'height') ?? 720,
      depth: this.getHiddenNumber(corpusOpts, 'depth') ?? 478,
      thickness: this.getHiddenNumber(corpusOpts, 'thickness') ?? 16,
      backThickness: this.getHiddenNumber(corpusOpts, 'backThickness') ?? 4,
    };

    // className (top-level option, not a group)
    const classNameOpt: any = getOption('className');
    const className =
      (classNameOpt?.type === OPTION_TYPE_HIDDEN_TEXT || classNameOpt?.type === 'hiddenText')
        ? classNameOpt.value : '';

    // JSON arrays
    const facades = this.getJsonValue<FacadeConfig>(options, 'facades');
    const legs = this.getJsonValue<LegConfig>(options, 'legs');
    const shelves = this.getJsonValue<ShelfConfig>(getGroup('corpus')?.options ?? options, 'shelves')
      .length
      ? this.getJsonValue<ShelfConfig>(getGroup('corpus')?.options ?? options, 'shelves')
      : this.getJsonValue<ShelfConfig>(options, 'shelves');
    const rods = this.getJsonValue<RodConfig>(options, 'rods');
    const tabletops = this.getJsonValue<AccessoryConfig>(options, 'tabletops');
    const aprons = this.getJsonValue<AccessoryConfig>(options, 'aprons');
    const plinths = this.getJsonValue<AccessoryConfig>(options, 'plinths');
    const corners = this.getJsonValue<AccessoryConfig>(options, 'corners');

    return { sizes, corpus, className, facades, legs, shelves, rods, tabletops, aprons, plinths, corners };
  }

  // ── Panels (corpus box walls) ───────────────────────────────────────────
  //
  // Origin: front-bottom-centre of corpus at Y = legHeight (so corpus bottom = legHeight)
  // All coords in metres after toM().

  private buildPanels(
    width: number,
    height: number,
    depth: number,
    t: number,   // wall thickness
    bt: number,  // back thickness
    legHeight: number,
  ): ResolvedPanel[] {
    const innerW = width - t * 2;
    const panelD = depth - bt;  // panels don't extend into back-panel area
    const baseY = legHeight;    // bottom of corpus above floor

    const m = (v: number) => this.h.toM(v);

    return [
      {
        name: 'left',
        size:     { x: m(t),      y: m(height), z: m(panelD) },
        position: { x: m(-(width / 2 - t / 2)), y: m(baseY + height / 2), z: m(-(panelD / 2)) },
      },
      {
        name: 'right',
        size:     { x: m(t),      y: m(height), z: m(panelD) },
        position: { x: m(width / 2 - t / 2),    y: m(baseY + height / 2), z: m(-(panelD / 2)) },
      },
      {
        name: 'bottom',
        size:     { x: m(innerW), y: m(t),      z: m(panelD) },
        position: { x: 0,                        y: m(baseY + t / 2),      z: m(-(panelD / 2)) },
      },
      {
        name: 'top',
        size:     { x: m(innerW), y: m(t),      z: m(panelD) },
        position: { x: 0,                        y: m(baseY + height - t / 2), z: m(-(panelD / 2)) },
      },
      {
        name: 'back',
        size:     { x: m(width),  y: m(height), z: m(bt) },
        position: { x: 0,                        y: m(baseY + height / 2), z: m(-(depth - bt / 2)) },
      },
    ];
  }

  // ── Facades ─────────────────────────────────────────────────────────────

  private buildFacades(
    configs: FacadeConfig[],
    corpusWidth: number,
    corpusHeight: number,
    corpusDepth: number,
    legHeight: number,
  ): ResolvedFacade[] {
    const baseY = legHeight;
    const facadeD = DEFAULT_FACADE_DEPTH;
    const m = (v: number) => this.h.toM(v);

    return configs.map((fc) => {
      // Resolve width
      const rawW = this.h.calculateSizeByParent(fc.initSizes.width, corpusWidth);
      const w = rawW - fc.gap.left - fc.gap.right;

      // Resolve height
      const rawH = this.h.calculateSizeByParent(fc.initSizes.height, corpusHeight);
      const h = rawH - fc.gap.top - fc.gap.bottom;

      // Y position from alignment
      let y = this.resolveAlignY(fc?.align?.y || '0', h, corpusHeight, fc.gap, baseY);

      // Apply margin
      if (fc.margin?.y !== undefined) y += fc.margin.y;

      // X position from alignment
      let x = 0;
      if (fc.align?.x === ALIGN_LEFT) x = -(corpusWidth / 2 - w / 2);
      if (fc.align?.x === ALIGN_RIGHT) x = corpusWidth / 2 - w / 2;
      if (fc.margin?.x !== undefined) x += fc.margin.x;

      // Z: facade sits in front of the corpus opening
      const z = facadeD / 2;

      // Handle
      const handle = this.buildHandle(fc, w, h, y, z, facadeD);

      return {
        size:          { x: m(w), y: m(h), z: m(facadeD) },
        position:      { x: m(x), y: m(y), z: m(z) },
        openType:      fc.openType,
        functionalType: fc.functionalType,
        modelType:     fc.modelType,
        handle,
      };
    });
  }

  private resolveAlignY(
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

  private buildHandle(
    fc: FacadeConfig,
    facadeW: number,
    facadeH: number,
    facadeY: number,
    facadeZ: number,
    facadeD: number,
  ): ResolvedFacade['handle'] | undefined {
    if (fc.handle == null) return undefined;

    const hW = 120;
    const hH = 20;
    const hD = DEFAULT_HANDLE_DEPTH;
    const m = (v: number) => this.h.toM(v);

    let hx = 0;
    if (fc.handle.align.x === ALIGN_LEFT) hx = -(facadeW / 2 - hW / 2);
    if (fc.handle.align.x === ALIGN_RIGHT) hx = facadeW / 2 - hW / 2;

    let hy = facadeY;
    const marginY = fc.handle.margin?.y ?? 20;
    if (fc.handle.align.y === ALIGN_TOP) hy = facadeY + facadeH / 2 - hH / 2 - marginY;
    if (fc.handle.align.y === ALIGN_BOTTOM) hy = facadeY - facadeH / 2 + hH / 2 + marginY;

    const hz = facadeZ + facadeD / 2 + hD / 2;

    const rotation: Vec3 | undefined = fc.handle.location === 'vertical'
      ? { x: 0, y: 0, z: Math.PI / 2 }
      : undefined;

    return {
      size:     { x: m(hW), y: m(hH), z: m(hD) },
      position: { x: m(hx), y: m(hy), z: m(hz) },
      rotation,
    };
  }

  // ── Legs ────────────────────────────────────────────────────────────────

  private buildLegs(configs: LegConfig[], corpusWidth: number, corpusDepth: number): ResolvedLeg[] {
    if (!configs.length) return [];

    const legH = this.resolveLegHeight(configs);
    const radius = DEFAULT_LEG_RADIUS;
    const m = (v: number) => this.h.toM(v);

    return configs.map((lc) => {
      // x position: expressed as distance from left edge (0 = left, width = right)
      const rawX = this.h.calculateSizeByParent(lc.initPosition.x, corpusWidth);
      // z position: expressed as distance from front edge (0 = front, depth = back)
      const rawZ = this.h.calculateSizeByParent(lc.initPosition.z, corpusDepth);

      // Convert to centered coords
      const x = rawX - corpusWidth / 2;
      const z = -(rawZ);   // negative = into wall
      const y = legH / 2;  // centre of leg cylinder

      return {
        radius: m(lc.width ? lc.width / 2 : radius),
        height: m(legH),
        position: { x: m(x), y: m(y), z: m(z) },
      };
    });
  }

  private resolveLegHeight(configs: LegConfig[]): number {
    if (!configs.length) return DEFAULT_LEG_HEIGHT;
    const h = configs[0].height;
    return h !== undefined ? h : DEFAULT_LEG_HEIGHT;
  }

  // ── Shelves ─────────────────────────────────────────────────────────────

  private buildShelves(
    configs: ShelfConfig[],
    corpusWidth: number,
    corpusDepth: number,
    corpusHeight: number,
    thickness: number,
    backThickness: number,
    legHeight: number,
  ): ResolvedShelf[] {
    const innerW = corpusWidth - thickness * 2;
    const m = (v: number) => this.h.toM(v);

    return configs.map((sc) => {
      const length = this.h.calculateSizeByParent(sc.length, innerW);
      const depth = this.h.calculateSizeByParent(sc.depth, corpusDepth - backThickness);
      const rawY = this.h.calculateSizeByParent(sc.initPosition.y, corpusHeight);
      const y = legHeight + rawY;

      return {
        size:     { x: m(length), y: m(sc.thickness), z: m(depth) },
        position: { x: 0,         y: m(y),             z: m(-(depth / 2)) },
      };
    });
  }

  // ── Rods ─────────────────────────────────────────────────────────────────

  private buildRods(
    configs: RodConfig[],
    corpusWidth: number,
    corpusDepth: number,
    corpusHeight: number,
    legHeight: number,
  ): ResolvedRod[] {
    const innerW = corpusWidth - 32; // standard 16mm inset each side
    const m = (v: number) => this.h.toM(v);

    return configs.map((rc) => {
      const rawY = this.h.calculateSizeByParent(rc.initPosition.y, corpusHeight);
      const y = legHeight + rawY;
      const z = -(corpusDepth / 2);

      return {
        radius:   m(rc.radius),
        length:   m(innerW),
        position: { x: 0, y: m(y), z: m(z) },
      };
    });
  }

  // ── Plinths ──────────────────────────────────────────────────────────────
  //
  // positionType: 'front' | 'back' | 'left' | 'right' | 'none'
  // Origin matches corpus: x=0 center, y=0 floor, z=0 front face → negative = into wall.

  private buildPlinths(
    configs: AccessoryConfig[],
    corpusWidth: number,
    corpusDepth: number,
    legHeight: number,
  ): ResolvedPlinth[] {
    if (!configs.length) return [];

    const THICKNESS = 16;
    const m = (v: number) => this.h.toM(v);

    return configs.map((pc) => {
      const length = pc.initSizes?.length ? Number(pc.initSizes.length) : 0;
      const h = legHeight;
      const t = THICKNESS;
      const ox = (pc.initPosition?.x ?? 0) + (pc.margin?.x ?? 0);
      const oz = pc.initPosition?.z ?? 0;

      let w: number, d: number, x: number, y: number, z: number;
      let rotation: Vec3 | undefined;

      switch (pc.positionType) {
        case 'front':
          w = length > 0 ? length : corpusWidth;
          d = t;
          x = ox;
          y = h / 2;
          z = -t / 2;
          break;

        case 'back':
          w = length > 0 ? length : corpusWidth;
          d = t;
          x = ox;
          y = h / 2;
          z = -(corpusDepth - t / 2);
          break;

        case 'left':
          w = t;
          d = length > 0 ? length : corpusDepth;
          x = -(corpusWidth / 2 - t / 2) + ox;
          y = h / 2;
          z = -d / 2;
          break;

        case 'right':
          w = t;
          d = length > 0 ? length : corpusDepth;
          x = corpusWidth / 2 - t / 2 + ox;
          y = h / 2;
          z = -d / 2;
          break;

        case 'none':
        default:
          w = length > 0 ? length : t;
          d = t;
          x = ox;
          y = h / 2;
          z = oz > 0 ? -oz : -t / 2;
          if (pc.rotation?.y) {
            rotation = { x: pc.rotation.x ?? 0, y: pc.rotation.y, z: pc.rotation.z ?? 0 };
          }
          break;
      }

      return {
        size:     { x: m(w), y: m(h), z: m(d) },
        position: { x: m(x), y: m(y), z: m(z) },
        rotation,
      };
    });
  }

  // ── Tabletops ─────────────────────────────────────────────────────────────
  //
  // Sits on top of corpus: Y = legHeight + corpusHeight + thickness/2.
  // Length from initSizes.length | sizes.length | corpusWidth.
  // Width  from sizes.width | corpusDepth.
  // margin.z shifts the tabletop along the Z axis (mm, negative = into room).
  // rotation.y applies a Y-axis rotation (e.g. π/2 for perpendicular bar tops).

  private buildTabletops(
    configs: AccessoryConfig[],
    corpusWidth: number,
    corpusDepth: number,
    corpusHeight: number,
    legHeight: number,
  ): ResolvedTabletop[] {
    if (!configs.length) return [];

    const THICKNESS = 38;
    const m = (v: number) => this.h.toM(v);
    const baseY = legHeight + corpusHeight;

    return configs.map((tc) => {
      const length = Number(tc.initSizes?.length ?? tc.sizes?.length ?? corpusWidth);
      const width  = Number(tc.sizes?.width  ?? tc.initSizes?.width  ?? corpusDepth);
      const t      = THICKNESS;

      const x = tc.margin?.x ?? 0;
      const y = baseY + t / 2;
      const z = -(width / 2) + (tc.margin?.z ?? 0);

      let rotation: Vec3 | undefined;
      if (tc.rotation?.y) {
        rotation = { x: tc.rotation.x ?? 0, y: tc.rotation.y, z: tc.rotation.z ?? 0 };
      }

      return {
        size:     { x: m(length), y: m(t), z: m(width) },
        position: { x: m(x), y: m(y), z: m(z) },
        rotation,
      };
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private getJsonValue<T>(options: OptionOrGroup[], id: string): T[] {
    const opt = options.find((o): o is JsonOption<T> => !('isGroup' in o) && o.id === id && o.type === OPTION_TYPE_JSON);
    return (opt?.value as T[]) ?? [];
  }

  private getHiddenNumber(options: OptionOrGroup[], id: string): number | undefined {
    const opt = options.find((o) => !('isGroup' in o) && o.id === id && o.type === OPTION_TYPE_HIDDEN_NUMBER);
    return opt && 'value' in opt ? (opt.value as number) : undefined;
  }

  private getHiddenText(options: OptionOrGroup[], id: string): string | undefined {
    const opt = options.find((o) => !('isGroup' in o) && o.id === id && o.type === OPTION_TYPE_HIDDEN_TEXT);
    return opt && 'value' in opt ? (opt.value as string) : undefined;
  }
}
