import {Injectable} from '@angular/core';
import {ResolvedPanel, ResolvedUnit} from '../interfaces/unit-config.models';

const DEFAULT_WALL_HEIGHT = 2500;
const DEFAULT_FRAME_WIDTH = 70;
const FRAME_DEPTH_EXTRA = 5; // frame slightly protrudes from wall face

/**
 * ConstructiveBuilderService
 *
 * Builds a ResolvedUnit-compatible object from a constructive.json item
 * (doors, doorways, windows, pillars, wall islands).
 *
 * Input option types (differ from UnitConfig):
 *   hiddenText   → value in opt.value
 *   hiddenNumber → value in opt.value
 *   range        → value in opt.defaultValue
 *   checkbox     → value in opt.defaultValue
 *
 * Coordinate origin: front-bottom-centre of the object.
 *   X: ← negative  0  positive →
 *   Y: 0 = floor level
 *   Z: 0 = front face, negative = into depth
 */
@Injectable({providedIn: 'root'})
export class ConstructiveBuilderService {

  build(config: any): ResolvedUnit {
    const className = this.getTopValue(config.options, 'className') ?? '';
    const sizes = this.parseSizes(config.options);
    const frameWidth = this.getTopValue(config.options, 'frameWidth') ?? DEFAULT_FRAME_WIDTH;

    const {width: w, height: h, depth: d} = sizes;

    const panels = this.buildPanels(className, w, h, d, frameWidth);

    return {
      uid: config.uid,
      level: config.level ?? 'bottom',
      className,
      size: {x: m(w), y: m(h), z: m(d)},
      corpusSize: {x: m(w), y: m(h), z: m(d)},
      corpusCatalogCode: config.catalogCode ?? '',
      availableWidths: [],
      panels,
      facades: [],
      legs: [],
      shelves: [],
      rods: [],
    };
  }

  // ── Dispatcher ────────────────────────────────────────────────────────────

  private buildPanels(
    className: string,
    w: number, h: number, d: number,
    fw: number,
  ): ResolvedPanel[] {
    switch (className) {
      case 'ConstructiveDoor':
      case 'ConstructiveDoorway':
        return this.buildDoorPanels(w, h, d, fw, className);
      case 'ConstructiveWindow':
        return this.buildWindowPanels(w, h, d, fw);
      case 'ConstructivePillar':
        return this.buildPillarPanels(w, h, d);
      case 'ConstructiveWallIsland':
        return this.buildWallIslandPanels(w, d);
      default:
        return this.buildPillarPanels(w, h, d);
    }
  }

  // ── Door / Doorway ────────────────────────────────────────────────────────
  // 3 frame panels: left post, right post, top lintel.
  // Opening bottom is at Y = 0 (floor level — no bottom frame).

  private buildDoorPanels(w: number, h: number, d: number, fw: number, type: string): ResolvedPanel[] {
    const fd = d + FRAME_DEPTH_EXTRA;
    const frames = [
      {
        name: 'frame-left',
        size: {x: m(fw), y: m(h), z: m(fd)},
        position: {x: m(-(w / 2 + fw / 2)), y: m(h / 2), z: m(-fd / 2)},
        color: '#c7c1c1'
      },
      {
        name: 'frame-right',
        size: {x: m(fw), y: m(h), z: m(fd)},
        position: {x: m(w / 2 + fw / 2), y: m(h / 2), z: m(-fd / 2)},
        color: '#c7c1c1'
      },
      {
        name: 'frame-top',
        size: {x: m(w + fw * 2), y: m(fw), z: m(fd)},
        position: {x: 0, y: m(h + fw / 2), z: m(-fd / 2)},
        color: '#c7c1c1'
      },
    ];

    const frontFrame = {
      name: 'frame-front',
      size: {x: m(w), y: m(h), z: m(fd / 4)},
      position: {x: m(0), y: m(h / 2), z: m(-fd / 2)},
      color: '#c4bfbf',
      materialType: type === 'ConstructiveDoor' ? undefined :'glass',
    };
    frames.push(frontFrame);


    return frames
  }

  // ── Window ────────────────────────────────────────────────────────────────
  // 4 frame panels + thin glass panel in the middle.

  private buildWindowPanels(w: number, h: number, d: number, fw: number): ResolvedPanel[] {
    const fd = d + FRAME_DEPTH_EXTRA;
    const totalW = w + fw * 2;
    const glassD = 4;
    return [
      {
        name: 'frame-left',
        size: {x: m(fw), y: m(h), z: m(fd)},
        position: {x: m(-(w / 2 + fw / 2)), y: m(h / 2), z: m(-fd / 2)},
      },
      {
        name: 'frame-right',
        size: {x: m(fw), y: m(h), z: m(fd)},
        position: {x: m(w / 2 + fw / 2), y: m(h / 2), z: m(-fd / 2)},
      },
      {
        name: 'frame-top',
        size: {x: m(totalW), y: m(fw), z: m(fd)},
        position: {x: 0, y: m(h + fw / 2), z: m(-fd / 2)},
      },
      {
        name: 'frame-middle',
        size: {x: m(totalW), y: m(fw), z: m(fd)},
        position: {x: 0, y: m(h/ 2), z: m(-fd / 2)},
      },
      {
        name: 'frame-middle-cross',
        size: {x: m(fw), y: m(h), z: m(fd)},
        position: {x: m(0), y: m(h / 2), z: m(-fd / 2)},
      },
      {
        name: 'frame-bottom',
        size: {x: m(totalW), y: m(fw), z: m(fd)},
        position: {x: 0, y: m(-fw / 2), z: m(-fd / 2)},
      },
      {
        name: 'glass',
        size: {x: m(w), y: m(h), z: m(glassD)},
        position: {x: 0, y: m(h / 2), z: m(-d / 2)},
        materialType: 'glass',
      },
    ];
  }

  // ── Pillar / Obstacle ─────────────────────────────────────────────────────

  private buildPillarPanels(w: number, h: number, d: number): ResolvedPanel[] {
    return [
      {
        name: 'body',
        size: {x: m(w), y: m(h), z: m(d)},
        position: {x: 0, y: m(h / 2), z: m(-d / 2)},
      },
    ];
  }

  // ── Wall island (partition) ───────────────────────────────────────────────
  // width = wall thickness, depth = wall length, height = room height default.

  private buildWallIslandPanels(width: number, depth: number): ResolvedPanel[] {
    const h = DEFAULT_WALL_HEIGHT;
    return [
      {
        name: 'wall',
        size: {x: m(width), y: m(h), z: m(depth)},
        position: {x: 0, y: m(h / 2), z: m(-depth / 2)},
      },
    ];
  }

  // ── Option parsing ────────────────────────────────────────────────────────

  /**
   * Extract width / height / depth from the top-level "sizes" group.
   * Falls back to safe defaults if a dimension is absent (e.g. wallIsland has no height).
   */
  private parseSizes(options: any[]): { width: number; height: number; depth: number } {
    const sizesGroup = options.find((o: any) => o.isGroup && o.id === 'sizes');
    const opts: any[] = sizesGroup?.options ?? [];
    return {
      width: this.getOptValue(opts, 'width') ?? 1000,
      height: this.getOptValue(opts, 'height') ?? DEFAULT_WALL_HEIGHT,
      depth: this.getOptValue(opts, 'depth') ?? 100,
    };
  }

  /**
   * Read value from a flat options array.
   * Supports both `value` (hiddenNumber / hiddenText) and `defaultValue` (range / checkbox).
   */
  private getOptValue(options: any[], id: string): number | undefined {
    const opt = options.find((o: any) => o.id === id);
    if (!opt) return undefined;
    const v = opt.value ?? opt.defaultValue;
    return v !== undefined ? Number(v) : undefined;
  }

  /** Read a top-level option (not inside a sub-group). Returns string | number. */
  private getTopValue(options: any[], id: string): any {
    const opt = options.find((o: any) => !o.isGroup && o.id === id);
    if (!opt) return undefined;
    return opt.value ?? opt.defaultValue;
  }
}

function m(mm: number): number {
  return mm / 1000;
}
