Стек технологий

- Angular 21 — standalone компоненты, zoneless change detection
- Three.js + angular-three — 3D рендеринг
- NgRx Signals — управление состоянием
- PrimeNG — UI компоненты
- cannon-es — физика и коллизии
- TypeScript 5.9.3

Структура

src/app/                                                               
├── layout/               — корневой layout                            
├── planner-scene/        — 3D сцена                                   
│   ├── scene-graph.ts    — граф сцены (освещение, камера, гизмо)      
│   ├── scene/            — canvas wrapper                             
│   ├── room/             — комната (стены, пол, потолок, объекты)     
│   ├── components/                                                    
│   │   ├── three-item.ts   — перетаскиваемые 3D предметы              
│   │   └── size-lines.ts   — линии размеров                           
│   ├── directives/                                                    
│   │   ├── draggable.directive.ts      — drag & drop для объектов     
│   │   ├── wall-opacity.directive.ts   — прозрачность стен            
│   │   └── size-lines.directive.ts     — размеры на стенах            
│   └── services/
│       ├── collision.service.ts        — определение коллизий         
│       └── surface.service.ts          — распознавание поверхностей
│                                                                      
├── planner-configuration/  — панель настроек
│   ├── configuration-form/ — размеры комнаты (1000–10000мм)           
│   ├── configuration-floor/ — выбор текстуры пола (6 вариантов)       
│   └── configuration-walls/ — выбор текстуры стен (5 вариантов)       
│                                                                      
└── store/store.ts          — NgRx Signals стор (размеры комнаты,      
текстуры)

Функциональность

1. Комната — 4 стены, пол, прозрачный потолок; настраиваемые размеры и
   текстуры
2. Drag & Drop — объекты можно перетаскивать, они прилипают к стенам и
   не выходят за границы
3. Линии размеров — показывают X/Y/Z габариты объектов в миллиметрах
4. Прозрачность стен — стены автоматически становятся полупрозрачными,
   когда камера смотрит на них изнутри
5. Управление камерой — orbit controls + viewcube гизмо

Состояние разработки

Активная разработка (5 feature-коммитов). Много файлов в               
staged/unstaged состоянии — идёт рефакторинг компонентов и директив.
