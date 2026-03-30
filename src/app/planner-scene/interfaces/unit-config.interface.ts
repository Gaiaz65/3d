// ─── Опции конфигуратора (j.js формат) ───────────────────────────────────────

export interface OptionItem {
  id: string;
  title: string;
}

export interface OptionGroup {
  id: string;
  title: string;
  sort?: number;
  isGroup: true;
  options: UnitOption[];
}

export interface OptionField {
  id: string;
  title: string;
  sort?: number;
  type?: string;
  value?: string | number | boolean | any[];
  defaultValue?: string | number;
  items?: OptionItem[];
  isGroup?: false;
}

export type UnitOption = OptionGroup | OptionField;

// ─── Полки ────────────────────────────────────────────────────────────────────

export interface ShelfConfig {
  id: number;
  /** Длина: '%100' = 100% ширины корпуса, или число в мм */
  length: string | number;
  /** Глубина: '%100' или формула вида '=({%100} - 10)' */
  depth: string | number;
  initPosition: {
    /** Позиция Y от низа корпуса: число (мм) или формула */
    y: string | number;
  };
  type: string;
  thickness: number;
  fixed?: boolean;
}

// ─── Фасады ───────────────────────────────────────────────────────────────────

export interface FacadeGap {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface HandleConfig {
  id: number;
  align: { x: string; y: string };
  modelType: string;
  margin: { x: number; y: number; z: number };
}

export interface FacadeConfig {
  id: number;
  /** Размеры: '%100' = 100% размера корпуса или фиксированное число в мм */
  initSizes: { width: string | number; height: string | number };
  gap?: FacadeGap;
  geometryType?: string;
  sideType?: string;
  number?: number;
  /** Выравнивание фасада внутри корпуса */
  align?: { x: string; y: string };
  modelType?: string;
  isFlipY?: boolean;
  groupId?: number;
  handle?: HandleConfig;
  openType?: string;
}

// ─── Ножки ────────────────────────────────────────────────────────────────────

export interface LegConfig {
  id: number;
  initPosition: {
    /** X от левого края корпуса, мм или формула */
    x: string | number;
    /** Z от задней стенки корпуса, мм или формула */
    z: string | number;
  };
}

// ─── Цоколи ──────────────────────────────────────────────────────────────────

export interface PlinthConfig {
  id: number;
  /** 'front' | 'back' | 'left' | 'right' */
  positionType: string;
}

// ─── Корневой конфиг юнита (j.js) ────────────────────────────────────────────

export interface UnitConfig {
  uid: string;
  catalogCode: string;
  /** 'top' | 'bottom' */
  level: string;
  /** Название (может быть в unicode-escape) */
  title: string;
  widthText?: string;
  depthText?: string;
  heightText?: string;
  image?: string;
  options: UnitOption[];
}
