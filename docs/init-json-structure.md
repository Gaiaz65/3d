# Структура init.json

**Путь:** `src/assets/configs/init/init.json`
**Размер:** ~2 MB
**Содержимое:** JSON-массив из 13 секций, ~325 unit-объектов

---

## 1. Верхний уровень

```json
[
  {
    "id": "bottomNormalUnits",
    "title": "Нижние прямые",
    "icon": "iconName",
    "sort": 0,
    "isGroup": true,
    "items": [ ...units ]
  }
]
```

### Секции (13 шт.)

| id | Кол-во units | Назначение |
|----|:---:|---|
| `bottomNormalUnits` | 68 | Нижние прямые шкафы |
| `bottomAngleUnits` | 13 | Нижние угловые шкафы |
| `bottomEndUnits` | 4 | Нижние торцевые шкафы |
| `topNormalUnits` | 90 | Верхние прямые шкафы |
| `topAngleUnits` | 23 | Верхние угловые шкафы |
| `topVitrinaUnits` | 10 | Витрины |
| `topEndUnits` | 4 | Верхние торцевые |
| `penalUnits` | 54 | Пеналы |
| `equipments` | 15 | Встраиваемая техника |
| `builtInEquipments` | 12 | Мойки / смесители |
| `facades` | 19 | Торцевые фасады |
| `dobory` | 11 | Доборы |
| `accessories` | 2 | Столешницы / стеновые панели |

---

## 2. Структура unit (item)

```json
{
  "uid": "stol-1dver",
  "catalogCode": "stol-1dver",
  "level": "bottom",
  "title": "Нижний с 1 створкой",
  "image": "/static-files/unit/...",
  "depthText": "474 мм",
  "heightText": "816 мм",
  "widthText": "990 мм",
  "options": [ ...опции ]
}
```

---

## 3. Структура options

Опция — плоский объект с полями `id`, `type`, `value`/`defaultValue`.
Опции могут объединяться в группы (`isGroup: true`).

### Типы опций

| type | Назначение |
|------|---|
| `hidden_number` | Скрытое число (размер, толщина) |
| `hiddenText` | Скрытый текст (catalogCode, className) |
| `radioButton` | Переключатель с вариантами (width, sideType) |
| `json` | JSON-значение (facades, shelves, legs, …) |
| `text` | Текстовое поле |
| `checkbox` | Флажок |
| `offers` | Предложения / конфигуратор материалов |

### Основные группы (isGroup: true)

| id группы | Встречается | Назначение |
|-----------|:---:|---|
| `corpus` | 266 | Параметры корпуса + вложенные `shelves` |
| `facades` | 284 | Фасады |
| `sizes` | 189 | Общие размеры |
| `legs` | 119 | Ножки |
| `plinths` | 126 | Цоколи |
| `tabletops` | 87 | Столешницы |
| `aprons` | 81 | Стеновые панели |
| `corners` | 81 | Соединительные уголки |
| `sideType` | 165 | Сторона открывания |
| `className` | 325 | CSS-класс (скрытый) |

---

## 4. Группа corpus

```json
{
  "id": "corpus",
  "isGroup": true,
  "options": [
    { "id": "catalogCode",    "type": "hiddenText",    "value": "N_Base" },
    { "id": "width",          "type": "radioButton",   "defaultValue": "400",
      "items": [{"id": "300"}, {"id": "400"}, {"id": "600"}] },
    { "id": "height",         "type": "hidden_number", "value": 716 },
    { "id": "depth",          "type": "hidden_number", "value": 474 },
    { "id": "thickness",      "type": "hidden_number", "value": 16 },
    { "id": "backThickness",  "type": "hidden_number", "value": 4 },
    { "id": "shelves",        "type": "json",          "value": [...] }
  ]
}
```

**Константы, почти не меняющиеся:**
- `thickness` = **16** мм (во всех unit-ах)
- `backThickness` = **4** мм (во всех unit-ах)
- `height` = **716** мм (нижние), **716** мм (верхние)
- `depth` = **474** мм (нижние)

### Специальные поля corpus (для торцевых N_ENDF / N_END)

```json
{ "id": "smallDepth", "type": "hidden_number", "value": 300 },
{ "id": "smallWidth", "type": "hidden_number", "value": 16 }
```

---

## 5. Shelves (полки внутри corpus)

```json
{
  "id": "shelves",
  "type": "json",
  "value": [
    {
      "id": 0,
      "length": "%100",
      "depth": "%100",
      "initPosition": { "y": "%50" },
      "type": "horizontal",
      "thickness": 16,
      "fixed": true
    }
  ]
}
```

### Шаблоны значений

| Поле | Значения | Смысл |
|------|----------|-------|
| `length` | `"%100"` | 100% внутренней ширины |
| `depth` | `"%100"`, `"=({%100} - 10)"` | 100% / глубина минус 10 мм |
| `initPosition.y` | `"%50"`, `350`, `700` | 50% высоты или абсолютно (мм) |
| `thickness` | `16` | Всегда 16 мм |
| `type` | `"horizontal"`, `"vertical"` | Тип полки |

### Формулы (выражения)

| Выражение | Кол-во | Результат |
|-----------|:---:|---|
| `%100` | ~979 | Полный размер родителя |
| `=({%100} - 10)` | ~219 | Полный размер − 10 мм |
| `=({%100} - 50)` | ~436 | Полный размер − 50 мм |
| `%50` | ~154 | Половина размера родителя |

---

## 6. Facades (фасады)

```json
{
  "id": "facades",
  "type": "json",
  "value": [
    {
      "id": 0,
      "initSizes": { "width": "%100", "height": "%100" },
      "gap": { "bottom": 2, "left": 2, "right": 2, "top": 2 },
      "geometryType": "square",
      "sideType": "default",
      "modelType": "default",
      "functionalType": "pivotDoor",
      "openType": "verticalPivot",
      "reverseSideType": true,
      "handle": {
        "id": 0,
        "align": { "x": "center", "y": "top" },
        "location": "horizontal",
        "margin": { "x": 0, "y": 20 }
      }
    }
  ]
}
```

**`gap` всегда `{bottom:2, left:2, right:2, top:2}`** — одинаков в 95%+ случаев.

### functionalType / openType

| functionalType | openType | Описание |
|---|---|---|
| `pivotDoor` | `verticalPivot` | Поворотная дверь |
| `pivotDoorE` | `verticalPivot` | Дверь с e-фрезеровкой |
| `glass` | `verticalPivot` | Стеклянная вставка |
| `drawer` | `drawer` | Ящик |

---

## 7. Legs (ножки)

```json
{
  "id": "legs",
  "type": "json",
  "value": [
    { "id": 0, "initPosition": { "x": "50",             "z": "50" } },
    { "id": 0, "initPosition": { "x": "=({%100}-50)",   "z": "50" } },
    { "id": 0, "initPosition": { "x": "=({%100}-50)",   "z": "=({%100}-50)" } },
    { "id": 0, "initPosition": { "x": "50",             "z": "=({%100}-50)" } }
  ]
}
```

Всегда **4 ножки** в угловых позициях ±50 мм от стенок. Структура практически не меняется.

---

## 8. Повторяющиеся паттерны и дублирование

### Дублирование corpus

- **266** corpus-групп всего
- **~120** уникальных по содержанию
- Топ-повторяемые `catalogCode`: `V` (20×), `V_H` (16×), `N_Base` (8×)

### Полностью идентичные блоки в разных unit-ах

| Блок | Процент дублирования |
|------|:---:|
| `legs` (4 ножки по углам) | ~95% |
| `gap` фасада `{2,2,2,2}` | ~95% |
| `thickness` = 16 | 100% |
| `backThickness` = 4 | 100% |
| `shelves` (1 полка 50%) | ~40% |

---

## 9. Советы по упрощению структуры

### 9.1 Вынести глобальные константы

Значения, которые почти никогда не меняются, лучше задавать в отдельном конфиг-файле (`defaults.json`), а не повторять в каждом unit-е:

```json
// defaults.json
{
  "corpus": {
    "thickness": 16,
    "backThickness": 4
  },
  "facade": {
    "gap": { "bottom": 2, "left": 2, "right": 2, "top": 2 },
    "geometryType": "square",
    "sideType": "default",
    "modelType": "default"
  },
  "handle": {
    "align": { "x": "center", "y": "top" },
    "location": "horizontal",
    "margin": { "x": 0, "y": 20 }
  }
}
```

### 9.2 Шаблоны ножек

Заменить 4-элементный массив ножек (повторяется ~95%) на флаг:

```json
// Вместо 40 строк массива legs — одна строка:
{ "id": "legs", "type": "preset", "value": "corners-50" }
```

### 9.3 Шаблоны corpus по catalogCode

Сгруппировать общие поля по `catalogCode`, чтобы в каждом unit хранить только `width` (переменное) + переопределения:

```json
// corpus-templates.json
{
  "N_Base":  { "height": 716, "depth": 474, "thickness": 16, "backThickness": 4 },
  "V":       { "height": 716, "depth": 330, "thickness": 16, "backThickness": 4 },
  "V_H":     { "height": 900, "depth": 330, "thickness": 16, "backThickness": 4 }
}

// В unit: только ширина и переопределения
{ "id": "corpus", "template": "N_Base", "width": [300, 400, 500, 600] }
```

### 9.4 Укоротить facades

```json
// Сейчас (1 дверь):
{ "initSizes": {"width": "%100", "height": "%100"}, "gap": {"bottom":2,"left":2,"right":2,"top":2},
  "geometryType": "square", "sideType": "default", "modelType": "default",
  "functionalType": "pivotDoor", "openType": "verticalPivot", "handle": {...} }

// Предлагаемое (defaults применяются автоматически):
{ "functionalType": "pivotDoor", "count": 1 }
```

### 9.5 Разбить файл на части

2 MB — тяжело для редактирования и отладки. Предлагаемая структура:

```
src/assets/configs/
├── defaults.json               ← константы и пресеты
├── corpus-templates.json       ← шаблоны corpus по catalogCode
└── init/
    ├── index.json              ← список секций (без items)
    ├── bottomNormalUnits.json  ← 68 units
    ├── bottomAngleUnits.json   ← 13 units
    ├── topNormalUnits.json     ← 90 units
    ├── penalUnits.json         ← 54 units
    └── ...
```

### 9.6 Унифицировать ширины

Вместо повторяющихся массивов `radioButton.items` — именованные пресеты:

```json
// width-presets.json
{
  "narrow":   [150, 200, 250, 300],
  "standard": [300, 400, 500, 600],
  "wide":     [600, 700, 800, 900, 1000]
}

// В unit:
{ "id": "width", "type": "radioButton", "preset": "standard", "defaultValue": "400" }
```

---

## 10. Приоритет изменений

| Приоритет | Изменение | Сокращение объёма |
|:---------:|---|:---:|
| 1 | Глобальные константы (`thickness`, `backThickness`, `gap`) | ~15% |
| 2 | Шаблоны ножек (`legs` preset) | ~8% |
| 3 | Шаблоны corpus по catalogCode | ~20% |
| 4 | Разбивка на файлы по секциям | удобство |
| 5 | Пресеты ширин (`width-presets`) | ~5% |
| 6 | Defaults для facades/handle | ~12% |

Суммарное потенциальное сокращение объёма: **~40–50%** при сохранении полной выразительности конфига.
