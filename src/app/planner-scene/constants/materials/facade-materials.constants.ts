import {ItemMaterial} from '../../interfaces/item-config.interface';

export interface FacadeMaterial extends ItemMaterial {
  id: string;
  title: string;
  collection: string;
  subCollection?: string;
}

// ─── DOMA фасадные материалы ──────────────────────────────────────────────────

export const FACADE_MATERIALS_DOMA: FacadeMaterial[] = [
  {
    id: 'max-whiteShagren',
    title: 'Белый шагрень',
    collection: 'DOMA',
    color: '#f1f1f1',
    roughness: 0.85,
  },
  {
    id: 'max-mirror',
    title: 'Зеркало',
    collection: 'DOMA',
    color: '#d0d8e0',
    roughness: 0.05,
    metalness: 0.9,
  },
];

// ─── ERA фасадные материалы ───────────────────────────────────────────────────

export const FACADE_MATERIALS_ERA: FacadeMaterial[] = [
  {
    id: 'brauni-DubVotan',
    title: 'Дуб Вотан',
    collection: 'ERA',
    textureUrl: '/static-files/facade/era/dubVotan/map.jpg',
    roughness: 0.8,
  },
  {
    id: 'brauni-BelyjGladkij',
    title: 'Белый гладкий',
    collection: 'ERA',
    color: '#ffffff',
    roughness: 0.6,
  },
  {
    id: 'malva-Loredo',
    title: 'Лоредо',
    collection: 'ERA',
    textureUrl: '/static-files/facade/era/loredo/map.jpg',
    roughness: 0.75,
  },
];

// ─── FANT — коллекция Прованс ─────────────────────────────────────────────────

export const FACADE_MATERIALS_FANT_PROVANS: FacadeMaterial[] = [
  { id: 'fant-provans-Avinon',            title: 'Авиньон',              collection: 'FANT', subCollection: 'Прованс', color: '#e8e0d4', roughness: 0.75 },
  { id: 'fant-provans-AntracitMatovaya',  title: 'Антрацит матовый',     collection: 'FANT', subCollection: 'Прованс', color: '#3c3c3c', roughness: 0.8 },
  { id: 'fant-provans-BelyjMatovyj',      title: 'Белый матовый',        collection: 'FANT', subCollection: 'Прованс', color: '#f4f4f4', roughness: 0.85 },
  { id: 'fant-provans-BordoMatovyj',      title: 'Бордо матовый',        collection: 'FANT', subCollection: 'Прованс', color: '#6b1a1a', roughness: 0.8 },
  { id: 'fant-provans-VanilMatovyj',      title: 'Ваниль матовый',       collection: 'FANT', subCollection: 'Прованс', color: '#f5e6c8', roughness: 0.8 },
  { id: 'fant-provans-VisnjaMatovaya',    title: 'Вишня матовая',        collection: 'FANT', subCollection: 'Прованс', color: '#7b2d2d', roughness: 0.8 },
  { id: 'fant-provans-GrafitMatovyj',     title: 'Графит матовый',       collection: 'FANT', subCollection: 'Прованс', color: '#555555', roughness: 0.8 },
  { id: 'fant-provans-ZelenyjMatovyj',    title: 'Зелёный матовый',      collection: 'FANT', subCollection: 'Прованс', color: '#4a6741', roughness: 0.8 },
  { id: 'fant-provans-KaramelMatovyj',    title: 'Карамель матовый',     collection: 'FANT', subCollection: 'Прованс', color: '#c4944a', roughness: 0.75 },
  { id: 'fant-provans-KofejnyjMatovyj',   title: 'Кофейный матовый',     collection: 'FANT', subCollection: 'Прованс', color: '#6b4e38', roughness: 0.8 },
  { id: 'fant-provans-KremMatovyj',       title: 'Крем матовый',         collection: 'FANT', subCollection: 'Прованс', color: '#f0e8d0', roughness: 0.8 },
  { id: 'fant-provans-LazurMatovyj',      title: 'Лазурь матовый',       collection: 'FANT', subCollection: 'Прованс', color: '#7ab0d4', roughness: 0.8 },
  { id: 'fant-provans-LimonMatovyj',      title: 'Лимон матовый',        collection: 'FANT', subCollection: 'Прованс', color: '#e8dd6a', roughness: 0.8 },
  { id: 'fant-provans-MintMatovyj',       title: 'Мята матовый',         collection: 'FANT', subCollection: 'Прованс', color: '#8ecfba', roughness: 0.8 },
  { id: 'fant-provans-OranzhevyjMatovyj', title: 'Оранжевый матовый',    collection: 'FANT', subCollection: 'Прованс', color: '#e07030', roughness: 0.8 },
  { id: 'fant-provans-PesochnyMatovyj',   title: 'Песочный матовый',     collection: 'FANT', subCollection: 'Прованс', color: '#d4b896', roughness: 0.8 },
  { id: 'fant-provans-RozevaMatovaya',    title: 'Розевая матовая',       collection: 'FANT', subCollection: 'Прованс', color: '#e8b0b0', roughness: 0.8 },
  { id: 'fant-provans-SerebristyMatovyj', title: 'Серебристый матовый',  collection: 'FANT', subCollection: 'Прованс', color: '#c0c0c0', roughness: 0.7 },
  { id: 'fant-provans-SinijMatovyj',      title: 'Синий матовый',        collection: 'FANT', subCollection: 'Прованс', color: '#3d5a80', roughness: 0.8 },
  { id: 'fant-provans-SlivovyjMatovyj',   title: 'Сливовый матовый',     collection: 'FANT', subCollection: 'Прованс', color: '#6b4468', roughness: 0.8 },
  { id: 'fant-provans-TaborMatovyj',      title: 'Табор матовый',        collection: 'FANT', subCollection: 'Прованс', color: '#9e8a6a', roughness: 0.8 },
  { id: 'fant-provans-TerrakotaMatovaya', title: 'Терракота матовая',    collection: 'FANT', subCollection: 'Прованс', color: '#b55a3a', roughness: 0.8 },
  { id: 'fant-provans-TurquoiseMatovyj',  title: 'Бирюза матовый',       collection: 'FANT', subCollection: 'Прованс', color: '#45b3b0', roughness: 0.8 },
  { id: 'fant-provans-FistalMatovyj',     title: 'Фисташка матовый',     collection: 'FANT', subCollection: 'Прованс', color: '#8abf82', roughness: 0.8 },
  { id: 'fant-provans-FioletovyjMatovyj', title: 'Фиолетовый матовый',   collection: 'FANT', subCollection: 'Прованс', color: '#7856a0', roughness: 0.8 },
  { id: 'fant-provans-ChernyjMatovyj',    title: 'Чёрный матовый',       collection: 'FANT', subCollection: 'Прованс', color: '#1a1a1a', roughness: 0.85 },
];

// ─── FANT — коллекция London ──────────────────────────────────────────────────

export const FACADE_MATERIALS_FANT_LONDON: FacadeMaterial[] = [
  { id: 'fant-london-Antracit',    title: 'Антрацит',    collection: 'FANT', subCollection: 'London', color: '#3c3c3c', roughness: 0.2, metalness: 0.05 },
  { id: 'fant-london-Belyj',       title: 'Белый',       collection: 'FANT', subCollection: 'London', color: '#f4f4f4', roughness: 0.15 },
  { id: 'fant-london-Vishnja',     title: 'Вишня',       collection: 'FANT', subCollection: 'London', color: '#7b2d2d', roughness: 0.2 },
  { id: 'fant-london-Grafit',      title: 'Графит',      collection: 'FANT', subCollection: 'London', color: '#555555', roughness: 0.2 },
  { id: 'fant-london-Zelenyj',     title: 'Зелёный',     collection: 'FANT', subCollection: 'London', color: '#4a6741', roughness: 0.2 },
  { id: 'fant-london-Korica',      title: 'Корица',      collection: 'FANT', subCollection: 'London', color: '#8c5a30', roughness: 0.2 },
  { id: 'fant-london-Krem',        title: 'Крем',        collection: 'FANT', subCollection: 'London', color: '#f0e8d0', roughness: 0.2 },
  { id: 'fant-london-Oranzevyj',   title: 'Оранжевый',   collection: 'FANT', subCollection: 'London', color: '#e07030', roughness: 0.2 },
  { id: 'fant-london-Sinij',       title: 'Синий',       collection: 'FANT', subCollection: 'London', color: '#3d5a80', roughness: 0.2 },
  { id: 'fant-london-Chernyj',     title: 'Чёрный',      collection: 'FANT', subCollection: 'London', color: '#1a1a1a', roughness: 0.15, metalness: 0.05 },
  { id: 'fant-london-Shokolad',    title: 'Шоколад',     collection: 'FANT', subCollection: 'London', color: '#4a2c1a', roughness: 0.2 },
];

// ─── FANT — коллекция Soft7 ───────────────────────────────────────────────────

export const FACADE_MATERIALS_FANT_SOFT7: FacadeMaterial[] = [
  { id: 'fant-soft7-Antracit',    title: 'Антрацит',     collection: 'FANT', subCollection: 'Soft7', color: '#3c3c3c', roughness: 0.5 },
  { id: 'fant-soft7-Belyj',       title: 'Белый',        collection: 'FANT', subCollection: 'Soft7', color: '#f4f4f4', roughness: 0.45 },
  { id: 'fant-soft7-Grafit',      title: 'Графит',       collection: 'FANT', subCollection: 'Soft7', color: '#555555', roughness: 0.5 },
  { id: 'fant-soft7-Karamel',     title: 'Карамель',     collection: 'FANT', subCollection: 'Soft7', color: '#c4944a', roughness: 0.45 },
  { id: 'fant-soft7-Krem',        title: 'Крем',         collection: 'FANT', subCollection: 'Soft7', color: '#f0e8d0', roughness: 0.5 },
  { id: 'fant-soft7-Mokko',       title: 'Мокко',        collection: 'FANT', subCollection: 'Soft7', color: '#b3afa3', roughness: 0.5 },
  { id: 'fant-soft7-Pesochnyj',   title: 'Песочный',     collection: 'FANT', subCollection: 'Soft7', color: '#d4b896', roughness: 0.5 },
  { id: 'fant-soft7-Seryi',       title: 'Серый',        collection: 'FANT', subCollection: 'Soft7', color: '#9a9a9a', roughness: 0.5 },
  { id: 'fant-soft7-Chernyj',     title: 'Чёрный',       collection: 'FANT', subCollection: 'Soft7', color: '#1a1a1a', roughness: 0.5 },
];

// ─── FANT — коллекция Elegant ─────────────────────────────────────────────────

export const FACADE_MATERIALS_FANT_ELEGANT: FacadeMaterial[] = [
  { id: 'fant-elegant-Belyj',     title: 'Белый',        collection: 'FANT', subCollection: 'Elegant', color: '#f4f4f4', roughness: 0.1, metalness: 0.1 },
  { id: 'fant-elegant-Grafit',    title: 'Графит',       collection: 'FANT', subCollection: 'Elegant', color: '#555555', roughness: 0.1, metalness: 0.1 },
  { id: 'fant-elegant-Krem',      title: 'Крем',         collection: 'FANT', subCollection: 'Elegant', color: '#f0e8d0', roughness: 0.1, metalness: 0.1 },
  { id: 'fant-elegant-Seryi',     title: 'Серый',        collection: 'FANT', subCollection: 'Elegant', color: '#9a9a9a', roughness: 0.1, metalness: 0.1 },
  { id: 'fant-elegant-Chernyj',   title: 'Чёрный',       collection: 'FANT', subCollection: 'Elegant', color: '#1a1a1a', roughness: 0.08, metalness: 0.15 },
];

// ─── FANT — коллекция Volna ───────────────────────────────────────────────────

export const FACADE_MATERIALS_FANT_VOLNA: FacadeMaterial[] = [
  { id: 'fant-volna-Antracit',    title: 'Антрацит',    collection: 'FANT', subCollection: 'Volna', color: '#3c3c3c', roughness: 0.75 },
  { id: 'fant-volna-Belyj',       title: 'Белый',       collection: 'FANT', subCollection: 'Volna', color: '#f4f4f4', roughness: 0.7 },
  { id: 'fant-volna-Grafit',      title: 'Графит',      collection: 'FANT', subCollection: 'Volna', color: '#555555', roughness: 0.75 },
  { id: 'fant-volna-Krem',        title: 'Крем',        collection: 'FANT', subCollection: 'Volna', color: '#f0e8d0', roughness: 0.7 },
  { id: 'fant-volna-Chernyj',     title: 'Чёрный',      collection: 'FANT', subCollection: 'Volna', color: '#1a1a1a', roughness: 0.75 },
];

// ─── Полный реестр фасадных материалов ───────────────────────────────────────

export const ALL_FACADE_MATERIALS: FacadeMaterial[] = [
  ...FACADE_MATERIALS_DOMA,
  ...FACADE_MATERIALS_ERA,
  ...FACADE_MATERIALS_FANT_PROVANS,
  ...FACADE_MATERIALS_FANT_LONDON,
  ...FACADE_MATERIALS_FANT_SOFT7,
  ...FACADE_MATERIALS_FANT_ELEGANT,
  ...FACADE_MATERIALS_FANT_VOLNA,
];

export const FACADE_MATERIAL_MAP = new Map<string, FacadeMaterial>(
  ALL_FACADE_MATERIALS.map((m) => [m.id, m]),
);
