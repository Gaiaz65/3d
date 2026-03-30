import {ItemMaterial} from '../../interfaces/item-config.interface';

/**
 * Материал корпуса — расширяет ItemMaterial идентификатором и названием.
 * textureUrl ссылается на пути из оригинального приложения j.js.
 */
export interface CorpusMaterial extends ItemMaterial {
  id: string;
  title: string;
  collection: string;
}

// ─── Коллекция DOMA ───────────────────────────────────────────────────────────

export const CORPUS_MATERIALS_DOMA: CorpusMaterial[] = [
  {
    id: 'whiteShagren',
    title: 'Белый шагрень',
    collection: 'DOMA',
    color: '#f1f1f1',
    textureUrl: '/static-files/material/gold-craft-oak/map.jpg',
    roughness: 0.8,
  },
  {
    id: 'dubCraft',
    title: 'Дуб крафт золотой',
    collection: 'DOMA',
    textureUrl: '/static-files/material/gold-craft-oak/map.jpg',
    roughness: 0.75,
  },
];

// ─── Коллекция ERA ────────────────────────────────────────────────────────────

export const CORPUS_MATERIALS_ERA: CorpusMaterial[] = [
  {
    id: 'belyjGladkij',
    title: 'Белый гладкий',
    collection: 'ERA',
    color: '#ffffff',
    roughness: 0.6,
  },
  {
    id: 'venge',
    title: 'Венге',
    collection: 'ERA',
    textureUrl: '/static-files/corpus/wenge/map.jpg',
    roughness: 0.8,
  },
];

// ─── Коллекция FANT ───────────────────────────────────────────────────────────

export const CORPUS_MATERIALS_FANT: CorpusMaterial[] = [
  {
    id: 'white',
    title: 'Белый',
    collection: 'FANT',
    color: '#ffffff',
    roughness: 0.6,
  },
  {
    id: 'mariaLuisa',
    title: 'Мария Луиза',
    collection: 'FANT',
    textureUrl: '/static-files/corpus/mariaLuisa/map.jpg',
    roughness: 0.75,
  },
  {
    id: 'yasenShimoSvetliy',
    title: 'Ясень Шимо светлый',
    collection: 'FANT',
    textureUrl: '/static-files/corpus/yasenShimoSvetliy/map.jpg',
    roughness: 0.8,
  },
];

// ─── Коллекция GERDA ──────────────────────────────────────────────────────────

export const CORPUS_MATERIALS_GERDA: CorpusMaterial[] = [
  {
    id: 'white',
    title: 'Белый',
    collection: 'GERDA',
    color: '#ffffff',
    roughness: 0.6,
  },
  {
    id: 'vengeGerda',
    title: 'Венге',
    collection: 'GERDA',
    textureUrl: '/static-files/material/venge-gerda/map.jpg',
    roughness: 0.8,
  },
  {
    id: 'yellow',
    title: 'Жёлтый',
    collection: 'GERDA',
    color: '#fcec24',
    roughness: 0.65,
  },
  {
    id: 'oakGold',
    title: 'Дуб золотой',
    collection: 'GERDA',
    textureUrl: '/static-files/material/oak-gold/map.jpg',
    roughness: 0.8,
  },
  {
    id: 'oakSonoma',
    title: 'Дуб Сонома',
    collection: 'GERDA',
    textureUrl: '/static-files/material/sonoma-oak-gerda/map.jpg',
    roughness: 0.8,
  },
  {
    id: 'betonSvetliy',
    title: 'Бетон светлый',
    collection: 'GERDA',
    textureUrl: '/static-files/material/gerda/lightConcrete/map.jpg',
    roughness: 0.9,
  },
  {
    id: 'whiteGlyanec',
    title: 'Белый глянец',
    collection: 'GERDA',
    color: '#ffffff',
    roughness: 0.1,
    metalness: 0.05,
  },
  {
    id: 'mokko',
    title: 'Мокко',
    collection: 'GERDA',
    color: '#b3afa3',
    roughness: 0.7,
  },
  {
    id: 'betonTemniy',
    title: 'Бетон тёмный',
    collection: 'GERDA',
    textureUrl: '/static-files/material/gerda/darkConcrete/map.jpg',
    roughness: 0.9,
  },
  {
    id: 'dubGray',
    title: 'Дуб серый',
    collection: 'GERDA',
    textureUrl: '/static-files/material/gerda/oakGrey/map.jpg',
    roughness: 0.8,
  },
  {
    id: 'karamel',
    title: 'Карамель',
    collection: 'GERDA',
    textureUrl: '/static-files/material/gerda/caramel/map.jpg',
    roughness: 0.75,
  },
  {
    id: 'latte',
    title: 'Латте',
    collection: 'GERDA',
    textureUrl: '/static-files/material/gerda/latte/map.jpg',
    roughness: 0.75,
  },
  {
    id: 'painWhite',
    title: 'Пейн белый',
    collection: 'GERDA',
    textureUrl: '/static-files/material/gerda/painWhite/map.jpg',
    roughness: 0.7,
  },
  {
    id: 'painExotic',
    title: 'Пейн экзотик',
    collection: 'GERDA',
    textureUrl: '/static-files/material/gerda/painExzotic/map.jpg',
    roughness: 0.75,
  },
  {
    id: 'dubBraun',
    title: 'Дуб коричневый',
    collection: 'GERDA',
    textureUrl: '/static-files/material/gerda/oakBrown/map.jpg',
    roughness: 0.8,
  },
  {
    id: 'kapri',
    title: 'Капри',
    collection: 'GERDA',
    color: '#879fbe',
    roughness: 0.65,
  },
  {
    id: 'kashemirShagren',
    title: 'Кашемир шагрень',
    collection: 'GERDA',
    color: '#c9c7c1',
    roughness: 0.85,
  },
  {
    id: 'yasenShimoSvetliy',
    title: 'Ясень Шимо светлый',
    collection: 'GERDA',
    textureUrl: '/static-files/material/gerda/yasenShimoLight/map.jpg',
    roughness: 0.8,
  },
  {
    id: 'benzin',
    title: 'Бензин',
    collection: 'GERDA',
    color: '#60807c',
    roughness: 0.65,
  },
  {
    id: 'sumerki',
    title: 'Сумерки',
    collection: 'GERDA',
    color: '#bbcfda',
    roughness: 0.65,
  },
  {
    id: 'shinshilaSeraya',
    title: 'Шиншилла серая',
    collection: 'GERDA',
    color: '#7a8080',
    roughness: 0.7,
  },
  {
    id: 'oregano',
    title: 'Орегано',
    collection: 'GERDA',
    color: '#7a8080',
    roughness: 0.7,
  },
  {
    id: 'dgara',
    title: 'Джара',
    collection: 'GERDA',
    color: '#7a8080',
    roughness: 0.7,
  },
  {
    id: 'dubDargo',
    title: 'Дуб Дарго',
    collection: 'GERDA',
    color: '#7a8080',
    roughness: 0.8,
  },
];

// ─── Все материалы корпуса сведены в один реестр ─────────────────────────────

export const ALL_CORPUS_MATERIALS: CorpusMaterial[] = [
  ...CORPUS_MATERIALS_DOMA,
  ...CORPUS_MATERIALS_ERA,
  ...CORPUS_MATERIALS_FANT,
  ...CORPUS_MATERIALS_GERDA,
];

export const CORPUS_MATERIAL_MAP = new Map<string, CorpusMaterial>(
  ALL_CORPUS_MATERIALS.map((m) => [m.id, m]),
);
