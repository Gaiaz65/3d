// ─── Стороны ─────────────────────────────────────────────────────────────────

export const SIDE_TYPE_LEFT    = 'left';
export const SIDE_TYPE_RIGHT   = 'right';
export const SIDE_TYPE_FRONT   = 'front';
export const SIDE_TYPE_BACK    = 'back';
export const SIDE_TYPE_DEFAULT = 'default';

// ─── Уровни размещения ────────────────────────────────────────────────────────

export const LEVEL_TOP    = 'top';
export const LEVEL_BOTTOM = 'bottom';
export const LEVEL_NONE   = 'none';

// ─── Ноги ────────────────────────────────────────────────────────────────────

export const LEG_NORMAL = 'LegNormal';
export const LEG_SMALL  = 'LegSmall';

export const DEFAULT_LEGS_HEIGHT = 100; // мм
export const DEFAULT_ROD_RADIUS  = 12;  // мм
export const NONE_EQUIPMENT      = 'none';
export const NONE_MATERIAL       = 'none';

// ─── Нижние тумбы (Bottom Units) ─────────────────────────────────────────────

export const CLASSNAME_BOTTOM_UNIT_NORMAL                          = 'BottomUnitNormal';
export const CLASSNAME_BOTTOM_UNIT_PILASTER                        = 'BottomUnitPilaster';
export const CLASSNAME_BOTTOM_UNIT_BAR_STAND                       = 'BottomUnitBarStand';
export const CLASSNAME_BOTTOM_UNIT_BAR_P                           = 'ThreeBottomUnitBarP';
export const CLASSNAME_BOTTOM_UNIT_BAR_RAVENNA                     = 'ThreeBottomUnitBarRavenna';
export const CLASSNAME_BOTTOM_UNIT_BAR_S                           = 'ThreeBottomUnitBarS';
export const CLASSNAME_BOTTOM_UNIT_BAR_COUNTER                     = 'ThreeBottomUnitBarCounter';
export const CLASSNAME_BOTTOM_UNIT_FULL_LENGTH_SIDEWALL            = 'BottomUnitFullLengthSidewall';
export const CLASSNAME_BOTTOM_UNIT_SINK                            = 'BottomUnitSink';
export const CLASSNAME_BOTTOM_UNIT_FULL_LENGTH_SIDEWALL_SINK       = 'BottomUnitFullLengthSidewallSink';
export const CLASSNAME_BOTTOM_UNIT_SINK_OPENED                     = 'BottomUnitSinkOpened';
export const CLASSNAME_BOTTOM_UNIT_OVEN                            = 'BottomUnitOven';
export const CLASSNAME_BOTTOM_UNIT_DISHWASHER                      = 'BottomUnitDishwasher';
export const CLASSNAME_BOTTOM_UNIT_FULL_LENGTH_SIDEWALL_OVEN       = 'BottomUnitFullLengthSidewallOven';

// ─── Торцевые нижние тумбы ────────────────────────────────────────────────────

export const CLASSNAME_BOTTOM_UNIT_END_NORMAL                          = 'BottomUnitEndNormal';
export const CLASSNAME_BOTTOM_UNIT_END_SIDE                            = 'BottomUnitEndSide';
export const CLASSNAME_BOTTOM_UNIT_END_PILASTER                        = 'BottomUnitEndPilaster';
export const CLASSNAME_BOTTOM_UNIT_END_FULL_LENGTH_SIDEWALL            = 'BottomUnitEndFullLengthSidewall';
export const CLASSNAME_BOTTOM_UNIT_END_OPENED                          = 'BottomUnitEndOpened';
export const CLASSNAME_BOTTOM_UNIT_END_OPENED_CIRCLE                   = 'BottomUnitEndOpenedCircle';
export const CLASSNAME_BOTTOM_UNIT_END_FULL_LENGTH_SIDEWALL_OPENED     = 'BottomUnitEndFullLengthSidewallOpened';
export const CLASSNAME_BOTTOM_UNIT_END_CONSOLE                         = 'BottomUnitEndConsole';
export const CLASSNAME_BOTTOM_UNIT_END_FULL_LENGTH_SIDEWALL_CONSOLE    = 'BottomUnitEndFullLengthSidewallConsole';

// ─── Угловые нижние тумбы ────────────────────────────────────────────────────

export const CLASSNAME_BOTTOM_ANGLE_UNIT_NORMAL                             = 'BottomAngleUnitNormal';
export const CLASSNAME_BOTTOM_ANGLE_UNIT_FULL_LENGTH_SIDEWALL_NORMAL_SINK   = 'BottomAngleUnitFullLengthSidewallNormalSink';
export const CLASSNAME_BOTTOM_ANGLE_UNIT_TWO_FACADES_90                     = 'BottomAngleUnitTwoFacades90';
export const CLASSNAME_BOTTOM_ANGLE_UNIT_CUBE                               = 'BottomAngleUnitCube';
export const CLASSNAME_BOTTOM_ANGLE_UNIT_FULL_LENGTH_SIDEWALL_CUBE_SINK     = 'BottomAngleUnitFullLengthSidewallCubeSink';

// ─── Верхние шкафы (Top Units) ───────────────────────────────────────────────

export const CLASSNAME_TOP_UNIT_NORMAL         = 'TopUnitNormal';
export const CLASSNAME_TOP_UNIT_PILASTER       = 'TopUnitPilaster';
export const CLASSNAME_TOP_UNIT_SHELF_FIGURED  = 'TopUnitShelfFigured';
export const CLASSNAME_TOP_UNIT_WINERY         = 'TopUnitWinery';
export const CLASSNAME_TOP_UNIT_RACK_FRAME     = 'TopUnitRackFrame';
export const CLASSNAME_TOP_UNIT_SHELF          = 'TopUnitShelf';
export const CLASSNAME_TOP_UNIT_BAR_RAVENNA    = 'ThreeTopUnitBarRavenna';

// ─── Торцевые верхние шкафы ───────────────────────────────────────────────────

export const CLASSNAME_TOP_UNIT_END_NORMAL        = 'TopUnitEndNormal';
export const CLASSNAME_TOP_UNIT_END_PILASTER      = 'TopUnitEndPilaster';
export const CLASSNAME_TOP_UNIT_END_OPENED        = 'TopUnitEndOpened';
export const CLASSNAME_TOP_UNIT_END_OPENED_CIRCLE = 'TopUnitEndOpenedCircle';
export const CLASSNAME_TOP_UNIT_END_SIDE          = 'TopUnitEndSide';

// ─── Угловые верхние шкафы ────────────────────────────────────────────────────

export const CLASSNAME_TOP_UNIT_ANGLE_NORMAL        = 'TopUnitAngleNormal';
export const CLASSNAME_TOP_UNIT_ANGLE_TWO_FACADES_90 = 'TopUnitAngleTwoFacades90';
export const CLASSNAME_TOP_UNIT_ANGLE_CUBE          = 'TopUnitAngleCube';
export const CLASSNAME_TOP_UNIT_ANGLE_DOUBLE        = 'TopUnitAngleDouble';

// ─── Пеналы (Penal Units) ─────────────────────────────────────────────────────

export const CLASSNAME_PENAL_UNIT_NORMAL               = 'PenalUnitNormal';
export const CLASSNAME_PENAL_UNIT_FULL_LENGTH_SIDEWALL = 'PenalUnitFullLengthSidewall';
export const CLASSNAME_PENAL_UNIT_TOP                  = 'PenalUnitTop';
export const CLASSNAME_PENAL_UNIT_END_CONSOLE          = 'PenalUnitEndConsole';
export const CLASSNAME_PENAL_UNIT_WARDROBE             = 'PenalUnitWardrobe';
export const CLASSNAME_PENAL_UNIT_WARDROBE_ANGLE       = 'PenalUnitWardrobeAngle';
export const CLASSNAME_PENAL_UNIT_WARDROBE_END         = 'PenalUnitWardrobeEnd';

// ─── Фасадные и декоративные элементы ────────────────────────────────────────

export const CLASSNAME_SIDE_BOTTOM_FACADE_UNIT = 'SideBottomFacadeUnit';
export const CLASSNAME_SIDE_TOP_FACADE_UNIT    = 'SideTopFacadeUnit';
export const CLASSNAME_SQUARE_FACADE_UNIT      = 'SquareFacadeUnit';
export const CLASSNAME_APRON_UNIT              = 'ApronUnit';
export const CLASSNAME_TABLETOP_UNIT           = 'TabletopUnit';
export const CLASSNAME_PLINTH_UNIT             = 'PlinthUnit';
export const CLASSNAME_CORNER_UNIT             = 'CornerUnit';
export const CLASSNAME_CORNICE_UNIT            = 'CorniceUnit';
export const CLASSNAME_CORPUS                  = 'ThreeCorpus';

// ─── Строительные элементы (Constructive) ────────────────────────────────────

export const CLASSNAME_CONSTRUCTIVE_DOOR                  = 'ConstructiveDoor';
export const CLASSNAME_CONSTRUCTIVE_DOORWAY               = 'ConstructiveDoorway';
export const CLASSNAME_CONSTRUCTIVE_WINDOW                = 'ConstructiveWindow';
export const CLASSNAME_CONSTRUCTIVE_PILLAR                = 'ConstructivePillar';
export const CLASSNAME_CONSTRUCTIVE_WALL_ISLAND           = 'ConstructiveWallIsland';
export const CLASSNAME_CONSTRUCTIVE_NONE                  = 'ConstructiveNone';
export const CLASSNAME_CONSTRUCTIVE_COOLER                = 'ConstructiveCooler';
export const CLASSNAME_CONSTRUCTIVE_GAS_BOILER            = 'ConstructiveGasBoiler';
export const CLASSNAME_CONSTRUCTIVE_GAS_METER             = 'ConstructiveGasMeter';
export const CLASSNAME_CONSTRUCTIVE_RADIATOR_SECTION      = 'ConstructiveRadiatorSection';
export const CLASSNAME_CONSTRUCTIVE_SOCKET                = 'ConstructiveSocket';
export const CLASSNAME_CONSTRUCTIVE_SWITCH                = 'ConstructiveSwitch';
export const CLASSNAME_CONSTRUCTIVE_VENTILATION           = 'ConstructiveVentilation';
export const CLASSNAME_CONSTRUCTIVE_WATER_HEATER_HORIZONTAL = 'ConstructiveWaterHeaterHorizontal';
export const CLASSNAME_CONSTRUCTIVE_WATER_HEATER_VERTICAL   = 'ConstructiveWaterHeaterVertical';
export const CLASSNAME_DOOR   = 'Door';
export const CLASSNAME_WINDOW = 'Window';