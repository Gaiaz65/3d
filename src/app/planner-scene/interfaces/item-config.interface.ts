/**
 * Конфигурация материала объекта.
 * Можно передать цвет, URL текстуры и PBR-параметры.
 */
export interface ItemMaterial {
  /** HEX-цвет (0xRRGGBB) или CSS-строка ('white', '#ccc') */
  color?: number | string;
  /** URL текстуры (диффузная карта) */
  textureUrl?: string;
  /** Шероховатость 0–1, default 0.7 */
  roughness?: number;
  /** Металличность 0–1, default 0 */
  metalness?: number;
  /** Прозрачность 0–1, default 1 */
  opacity?: number;
}

/**
 * Отдельная часть составного объекта (фасад, полка, ножки и т.д.).
 * Размеры и смещение — в мм.
 */
export interface ItemPart {
  /** Техническое имя части (corpus, facade, shelf, leg, back...) */
  name: string;
  /** Размеры в мм */
  size: {
    width: number;
    height: number;
    depth: number;
  };
  /**
   * Смещение центра части относительно нижней центральной точки группы (в мм).
   * y = 0 соответствует полу.
   */
  offset: {
    x: number;
    y: number;
    z: number;
  };
  material?: ItemMaterial;
}

/**
 * Тип объекта — влияет на набор автоматически генерируемых частей.
 * 'custom' — только то, что задано в parts[].
 */
export type ItemType =
  | 'box'              // простой ящик (одна геометрия)
  | 'cabinet-floor'    // нижняя тумба (corpus + фасад + ножки)
  | 'cabinet-wall'     // навесной шкаф (corpus + фасад)
  | 'shelf'            // открытая полка
  | 'custom';          // произвольный набор частей

/**
 * Полная конфигурация 3D-объекта.
 * Повторяет схему записей из j.js: uid, размеры в мм, материал, части.
 */
export interface ItemConfig {
  /** Уникальный идентификатор (из j.js uid) */
  uid?: string;
  /** Отображаемое название */
  title?: string;

  // ── Габариты в мм ──────────────────────────────────────────────────────────
  /** Ширина в мм */
  width: number;
  /** Высота в мм */
  height: number;
  /** Глубина в мм */
  depth: number;

  /** Тип объекта, определяет авто-генерацию частей */
  type?: ItemType;

  /** Материал по умолчанию (применяется ко всем частям без собственного материала) */
  material?: ItemMaterial;

  /**
   * Явное описание частей.
   * Если задан type != 'custom' и parts пустой — части генерируются автоматически.
   * Если parts задан — используются только они (type = 'custom' неявно).
   */
  parts?: ItemPart[];
}
