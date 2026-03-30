// ── Size expression ───────────────────────────────────────────────────────
// Can be: number (absolute mm), "%N" (N% of parent), "=(<formula>)" (computed)

export type SizeExpr = string | number;

// ── Option primitives ─────────────────────────────────────────────────────

export interface RadioItem {
  id: string;
  title: string;
}

interface OptionBase {
  id: string;
  sort: number;
  title: string;
}

export interface HiddenNumberOption extends OptionBase {
  type: 'hidden_number';
  value: number;
}

export interface HiddenTextOption extends OptionBase {
  type: 'hidden_text';
  value: string;
}

export interface RadioButtonOption extends OptionBase {
  type: 'radiobutton';
  defaultValue: string;
  items: RadioItem[];
}

export interface JsonOption<T = unknown> extends OptionBase {
  type: 'json';
  value: T[];
}

export type UnitOption =
  | HiddenNumberOption
  | HiddenTextOption
  | RadioButtonOption
  | JsonOption;

export interface OptionGroup {
  id: string;
  sort: number;
  title: string;
  isGroup: true;
  options: UnitOption[];
}

export type OptionOrGroup = UnitOption | OptionGroup;

// ── Catalog sub-configs ───────────────────────────────────────────────────

export interface FacadeHandleConfig {
  id: number;
  align: { x: string; y: string };
  location: string;
  margin?: { x?: number; y?: number };
  rotation?: { z?: number };
}

export interface FacadeConfig {
  id: number;
  initSizes: { width: SizeExpr; height: SizeExpr };
  gap: { bottom: number; left: number; right: number; top: number };
  geometryType: string;
  sideType: string;
  number: number;
  align: { x: string; y: string };
  margin?: { x?: number; y?: number; z?: number };
  modelType: string;
  calculateSizes?: { width: SizeExpr; height: SizeExpr };
  calculateType?: string;
  functionalType?: string;
  openType: string;
  groupId?: number;
  handle: FacadeHandleConfig;
}

export interface LegConfig {
  id: number;
  initPosition: { x: SizeExpr; z: SizeExpr };
  width?: number;
  height?: number;
}

export interface ShelfConfig {
  id: number;
  length: SizeExpr;
  depth: SizeExpr;
  initPosition: { y: SizeExpr };
  type: string;
  thickness: number;
  fixed?: boolean;
}

export interface RodConfig {
  id: number;
  radius: number;
  initPosition: { y: SizeExpr };
}

export interface AccessoryConfig {
  id: number;
  positionType: string;
  margin?: { x?: number; y?: number; z?: number };
  initSizes?: { length: SizeExpr; width?: SizeExpr };
  sizes?: { length: SizeExpr; width?: SizeExpr };
  initPosition?: { x?: number; z?: number };
  rotation?: { x?: number; y?: number; z?: number };
  functionalType?: string;
  canUnion?: boolean;
}

// ── Top-level unit config (matches build.js catalog format) ───────────────

export interface UnitConfig {
  uid: string;
  catalogCode: string;
  level: string;
  title: string;
  widthText?: string;
  depthText?: string;
  heightText?: string;
  image?: string;
  options: OptionOrGroup[];
}

// ── Parsed / resolved intermediate types ─────────────────────────────────

export interface ParsedCorpus {
  catalogCode: string;
  width: number;       // resolved from radiobutton default or selected value (mm)
  availableWidths: number[];
  height: number;      // mm
  depth: number;       // mm
  thickness: number;   // wall thickness, mm
  backThickness: number;
}

export interface ParsedSizes {
  height: number;  // outer unit height, mm
  depth: number;   // outer unit depth, mm
}

export interface ParsedGroups {
  sizes: ParsedSizes;
  corpus: ParsedCorpus;
  className: string;
  facades: FacadeConfig[];
  legs: LegConfig[];
  shelves: ShelfConfig[];
  rods: RodConfig[];
  tabletops: AccessoryConfig[];
  aprons: AccessoryConfig[];
  plinths: AccessoryConfig[];
  corners: AccessoryConfig[];
}

// ── Resolved unit (ready for rendering, all values in meters) ────────────

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ResolvedPanel {
  name: string;
  size: Vec3;
  position: Vec3;
  rotation?: Vec3;
}

export interface ResolvedFacade {
  size: Vec3;
  position: Vec3;
  openType: string;
  functionalType?: string;
  modelType: string;
  handle?: {
    size: Vec3;
    position: Vec3;
    rotation?: Vec3;
  };
}

export interface ResolvedLeg {
  radius: number;
  height: number;
  position: Vec3;
}

export interface ResolvedShelf {
  size: Vec3;
  position: Vec3;
}

export interface ResolvedRod {
  radius: number;
  length: number;
  position: Vec3;
}

export interface ResolvedPlinth {
  size: Vec3;
  position: Vec3;
  rotation?: Vec3;
}

export interface ResolvedTabletop {
  size: Vec3;
  position: Vec3;
  rotation?: Vec3;
}

export interface ResolvedUnit {
  uid: string;
  level: string;
  className: string;
  /** Outer bounding box in meters */
  size: Vec3;
  /** Corpus inner dimensions in meters */
  corpusSize: Vec3;
  corpusCatalogCode: string;
  availableWidths: number[];
  panels: ResolvedPanel[];
  facades: ResolvedFacade[];
  legs: ResolvedLeg[];
  shelves: ResolvedShelf[];
  rods: ResolvedRod[];
  plinths?: ResolvedPlinth[];
  tabletops?: ResolvedTabletop[];
}
