 # Схема конфигурации: topNormal.json

**Файл:** `src/assets/configs/init/topNormal.json`
**Группа:** `topAngleUnits` — Верхние угловые шкафы (~25 unit-ов)

---

## Верхний уровень

```
Array<SectionGroup>
```

```jsonc
[
  {
    "id":      string,   // "topAngleUnits"
    "icon":    string,   // имя иконки
    "title":   string,   // "Верхние угловые"
    "sort":    number,   // порядок в меню
    "isGroup": true,
    "items":   Unit[]
  }
]
```

---

## Unit

```jsonc
{
  "uid":             string,     // уникальный ID, совпадает с catalogCode
  "catalogCode":     string,     // "shkaf-uglovoy", "VU_590" и т.д.
  "level":           "top",      // всегда "top"
  "title":           string,     // название на русском
  "image":           string,     // путь к превью
  "depthText":       string,     // "302 мм"
  "heightText":      string,     // "716 мм"
  "widthText":       string,     // "592 мм"

  // Опциональные поля
  "isSameWidthDepth"?: boolean,  // ширина = глубине (кубические угловые)
  "disableFacades"?:  string[],  // фасады, недоступные для этого unit-а
  "enableFacades"?:   string[],  // фасады, доступные только для этого unit-а

  "options": Option[]
}
```

---

## Options — порядок и состав

| Порядок | id | Обязательность | Описание |
|:-------:|----|:--------------:|----------|
| 1 | `sideType` | Опционально | Сторона открывания |
| 2 | `sizes` | Опционально | Внешние размеры (только у глубоких) |
| 3 | `corpus` | **Обязательно** | Параметры корпуса |
| 4 | `className` | **Обязательно** | CSS-класс рендерера |
| 5 | `facades` | **Обязательно** | Фасады / двери |
| 6 | `syncSideTypes` | Опционально | Синхронизация направлений |

---

## Option: sideType

```jsonc
{
  "id":           "sideType",
  "type":         "radioButton",
  "sort":         3,
  "title":        "Сторона открывания",  // или "Направление модуля"
  "defaultValue": "left",
  "items": [
    { "id": "left",  "title": "Левая"  },  // или "Фасад справа"
    { "id": "right", "title": "Правая" }   // или "Фасад слева"
  ]
}
```

---

## Option: sizes (только у глубоких unit-ов)

Присутствует только в unit-ах с нестандартной глубиной (VUG_1010, VUG_1019 — "ГЛУБОКИЙ"):

```jsonc
{
  "id":      "sizes",
  "sort":    0,
  "title":   "Размеры",
  "isGroup": true,
  "options": [
    {
      "id":    "depth",
      "type":  "hidden_number",
      "sort":  1,
      "title": "Глубина",
      "value": 650   // мм
    }
  ]
}
```

---

## Option: corpus

```jsonc
{
  "id":      "corpus",
  "sort":    0,
  "title":   "Корпус",
  "isGroup": true,
  "options": [
    CorpusField[]
  ]
}
```

### Поля corpus (все вложенные опции)

```jsonc
// Обязательные поля
{ "id": "catalogCode",   "type": "hiddenText",    "value": "VU_590" },
{ "id": "width",         "type": "hidden_number", "value": 592      },
{ "id": "height",        "type": "hidden_number", "value": 716      },
{ "id": "depth",         "type": "hidden_number", "value": 592      },
{ "id": "thickness",     "type": "hidden_number", "value": 16       },  // всегда 16
{ "id": "backThickness", "type": "hidden_number", "value": 4        },  // всегда 4

// Полки — обязательно
{ "id": "shelves", "type": "json", "value": Shelf[] },

// Опциональные
{ "id": "backSideDepth", "type": "hidden_number", "value": 4   },  // только TopUnitAngleCube
{ "id": "sideDepth",     "type": "hidden_number", "value": 300 },  // только TopUnitAngleCube
{ "id": "frontPanel",    "type": "json",          "value": { "length": number } }, // TopUnitAngleNormal
{ "id": "planks",        "type": "json",          "value": Plank[] }  // TopUnitAngleNormal
```

### Shelf (полка)

```jsonc
{
  "id":           number,       // индекс (обычно 0)
  "length":       SizeValue,    // "%100" — 100% внутренней ширины
  "depth":        SizeValue,    // "%100" или "=({%100} - 10)"
  "initPosition": {
    "y": SizeValue              // "%50", "=({%100}/3)", "=({%100}/3*2)"
  },
  "type":         "horizontal", // всегда "horizontal"
  "thickness":    16,           // всегда 16
  "fixed":        true,         // всегда true

  // Только в кубических угловых (TopUnitAngleCube)
  "rotation"?: {
    "x": 1.5707963267948966    // π/2 — поворот на 90°
  }
}
```

### Plank (угловая планка, только TopUnitAngleNormal)

```jsonc
{
  "id":       number,
  "length":   number,        // мм
  "width"?:   number,        // мм (опционально)
  "position": {
    "x":  number,
    "y"?: number             // опционально
  },
  "rotation"?: {
    "z": 1.5707963267948966  // π/2 (опционально)
  }
}
```

---

## Option: className

```jsonc
{
  "id":    "className",
  "type":  "hiddenText",
  "sort":  4,
  "title": "Класс объекта",
  "value": "TopUnitAngleCube" | "TopUnitAngleNormal"
}
```

| className | Тип корпуса | Особенности |
|-----------|-------------|-------------|
| `TopUnitAngleCube` | Кубический угловой | `backSideDepth`, `sideDepth`, полка с `rotation.x=π/2` |
| `TopUnitAngleNormal` | Угловой нормальный | `frontPanel`, `planks`, несколько фасадов |

---

## Option: facades

```jsonc
{
  "id":    "facades",
  "sort":  0,
  "type":  "json",
  "value": Facade[]
}
```

### Facade (объект фасада)

```jsonc
{
  // Идентификация
  "id":       number,        // индекс фасада (0, 1, 2...)
  "groupId"?: number,        // группа фасадов для синхронизации

  // Размеры
  "initSizes": {
    "width":  SizeValue,     // "%100" или абсолютно: "396", "350", "400"
    "height": SizeValue      // всегда "%100"
  },
  "calculateSizes"?: {       // переопределение расчётных размеров
    "width":  string,
    "height": string
  },

  // Зазоры (почти всегда {bottom:2, left:2, right:2, top:2})
  "gap": {
    "bottom": number,
    "left":   number,        // 0 у кубических угловых по оси примыкания
    "right":  number,
    "top":    number
  },

  // Геометрия
  "geometryType": "square",  // всегда "square"
  "sideType":     "left" | "right" | "default",

  // Тип и поведение
  "modelType":      ModelType,
  "functionalType": FunctionalType,
  "openType":       OpenType,
  "calculateType"?: "none",  // отключить авторасчёт размеров

  // Трансформации (для составных фасадов)
  "margin"?: {
    "x": number,
    "y": number,
    "z": number
  },
  "rotation"?: {
    "x": number,
    "y": number,             // π/2 для угловых планок
    "z": number
  },
  "isFlipY"?:             boolean,
  "reverseSideType"?:     boolean,
  "notCheckOfferModelType"?: boolean,

  // Ручка
  "handle"?: {
    "id":       number,
    "align": {
      "x": "left" | "center" | "right",
      "y": "top"  | "center" | "bottom"
    },
    "location": "horizontal" | "vertical",
    "margin": {
      "x": number,
      "y": number
    }
  },

  // Фрезеровка (только для eFrez / zFrez вариантов)
  "frezSideType"?: {
    "defaultValue": "left" | "right",
    "items": [
      { "id": "left",  "title": "левая"  },
      { "id": "right", "title": "правая" }
    ]
  }
}
```

### Перечисления

```
ModelType        = "default" | "glass" | "glass2" | "plane" | "decorLeft" | "decor3"
FunctionalType   = "pivotDoor" | "pivotDoorE" | "pivotGlassDoor" | "anglePlanks" | "verticalPivotDoor"
OpenType         = "verticalPivot" | "horizontalPivot" | "none"
```

---

## Option: syncSideTypes

```jsonc
{
  "id":    "syncSideTypes",
  "type":  "json",
  "sort":  0,
  "value": false   // всегда false в текущих конфигах
}
```

---

## SizeValue — формат значений размеров

Строка, описывающая размер относительно или абсолютно:

| Формат | Пример | Значение |
|--------|--------|----------|
| Относительный | `"%100"` | 100% от родительского размера |
| Относительный | `"%50"` | 50% от родительского размера |
| Формула | `"=({%100}/3)"` | ⅓ от родительского размера |
| Формула | `"=({%100}/3*2)"` | ⅔ от родительского размера |
| Формула | `"=({%100} - 10)"` | Полный размер − 10 мм |
| Абсолютный | `"396"`, `"302"` | Фиксированное значение в мм |
| Число (не строка) | `592`, `16` | Фиксированное значение в мм (в hidden_number) |

---

## Каталог кодов (catalogCode corpus)

| catalogCode | Ширина | Высота | Глубина | className |
|-------------|:------:|:------:|:-------:|-----------|
| `VU_590` | 592 | 716 | 592 | TopUnitAngleCube |
| `VU_599` | 592 | 920 | 592 | TopUnitAngleCube |
| `VU_690` | 690 | 716 | 302 | TopUnitAngleNormal |
| `VU_699` | 690 | 920 | 302 | TopUnitAngleNormal |
| `VU_700` | 700 | 716 | 302 | TopUnitAngleNormal |
| `VU_709` | 700 | 920 | 302 | TopUnitAngleNormal |
| `VUG_990` | 990 | 358 | 302 | TopUnitAngleNormal |
| `VUG_1000` | 1000 | 358 | 302 | TopUnitAngleNormal |
| `VUG_1009` | 1000 | 460 | 302 | TopUnitAngleNormal |
| `VUG_1010` | 1000 | 358 | 560 | TopUnitAngleNormal |
| `VUG_1019` | 1000 | 460 | 560 | TopUnitAngleNormal |
| `VUG_700` | 700 | 358 | 302 | TopUnitAngleNormal |
| `VUG_709` | 700 | 460 | 302 | TopUnitAngleNormal |

---

## Паттерны unit-ов

### TopUnitAngleCube (кубический угловой)

```
uid: shkaf-uglovoy[-visokiy][-steklo][-eFrez][-zFrez][-memfis]

corpus:
  catalogCode: VU_590 | VU_599
  width = depth (квадратный план)
  backSideDepth: 4
  sideDepth: 300
  shelves: 1 полка с rotation.x=π/2

facades:
  count: 1
  initSizes.width: фиксированно (396) или "%100" для стекла
  gap.left = gap.right = 0 (по оси примыкания)
```

### TopUnitAngleNormal (угловой нормальный)

```
uid: shkaf-uglovoy-pryamoy-[VUG_код][-visokiy][-eFrez][-steklo]

corpus:
  catalogCode: VU_690 | VU_700 | VUG_*
  frontPanel.length: 262–520 мм
  planks: 2–3 планки (вертикальные + горизонтальная)

facades:
  count: 2–3 (дверь + угловые планки)
  groupId: объединяет связанные элементы
  margin: смещение угловых элементов
  rotation.y = π/2: планки перпендикулярны корпусу
```

---

## Константы (не меняются ни в одном unit-е)

| Поле | Значение |
|------|----------|
| `corpus.thickness` | `16` мм |
| `corpus.backThickness` | `4` мм |
| `shelf.thickness` | `16` мм |
| `shelf.type` | `"horizontal"` |
| `shelf.fixed` | `true` |
| `facade.geometryType` | `"square"` |
| `level` | `"top"` |
