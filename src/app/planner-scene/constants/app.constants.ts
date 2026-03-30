import {UnitConfig} from '../interfaces/unit-config.models';
import {
  CLASSNAME_BOTTOM_UNIT_NORMAL,
  LEVEL_BOTTOM,
  SIDE_TYPE_BACK, SIDE_TYPE_DEFAULT, SIDE_TYPE_FRONT,
  SIDE_TYPE_LEFT,
  SIDE_TYPE_RIGHT
} from './furniture.constants';
import {
  FACADE_OPEN_TYPE_BOX,
  OPTION_TYPE_HIDDEN_NUMBER,
  OPTION_TYPE_HIDDEN_TEXT,
  OPTION_TYPE_JSON,
  OPTION_TYPE_RADIOBUTTON
} from './option-types.constants';
import {ALIGN_BOTTOM, ALIGN_CENTER, ALIGN_TOP, GEOMETRY_TYPE_SQUARE} from './geometry.constants';
import {FACADE_MODEL_TYPE_PLANE, HANDLE_TYPE_HORIZONTAL} from './facade.constants';

// ─── Язык ────────────────────────────────────────────────────────────────────

export const LANGUAGE_RU = 'ru';
export const LANGUAGE_EN = 'en';
export const DEFAULT_LANGUAGE = LANGUAGE_RU;

// ─── Статусы приложения ───────────────────────────────────────────────────────

export const APP_CONFIG_STATUS_LOADING     = 'loading';
export const APP_CONFIG_STATUS_OK          = 'ok';
export const APP_CONFIG_STATUS_NOT_BILLING = 'notBilling';
export const APP_CONFIG_STATUS_NOT_LOAD    = 'notLoad';
export const APP_CONFIG_ID_DEMO            = 'demo';

// ─── Роли пользователей ───────────────────────────────────────────────────────

export const ROLE_GUEST               = 'guest';
export const ROLE_USER                = 'user';
export const ROLE_MANAGER             = 'manager';
export const ROLE_MANAGER_PRICES      = 'managerPrices';
export const ROLE_MANAGER_PERMISSIONS = 'managerPermissions';
export const ROLE_MANAGER_PROJECTS    = 'managerProjects';
export const ROLE_MANAGER_DEALERS     = 'managerDealers';
export const ROLE_MANAGER_LOCATIONS   = 'managerLocations';
export const ROLE_ADMIN               = 'admin';

// ─── Дефолтные ID ────────────────────────────────────────────────────────────

export const DEFAULT_ROOM_ID    = 'new';
export const DEFAULT_PROJECT_ID = 'new';
export const DEFAULT_ORDER_ID   = 'new';
export const DEFAULT_HANDLE_ID  = 'default';

// ─── Сохранение проектов ─────────────────────────────────────────────────────

export const SAVE_PROJECT_TYPE_DEFAULT  = 'default';
export const SAVE_PROJECT_TYPE_TEMPLATE = 'template';
export const LOCAL_STORAGE_PROJECT_NAME = 'project3d';
export const AUTO_SAVE_NONE             = 'none';
export const AUTO_SAVE_SERVER           = 'server';
export const AUTO_SAVE_LOCAL            = 'local';

// ─── Статусы записей ─────────────────────────────────────────────────────────

export const STATUS_ID_NEW    = 'new';
export const STATUS_ID_DELETE = 'delete';

// ─── Сообщения ───────────────────────────────────────────────────────────────

export const MESSAGE_TYPE_ERROR   = 'error';
export const MESSAGE_TYPE_WARNING = 'warning';
export const MESSAGE_TYPE_SUCCESS = 'success';
export const MESSAGE_TYPE_INFO    = 'info';

// ─── Интеграция ───────────────────────────────────────────────────────────────

export const INTEGRATION_TYPE_NONE        = 'none';
export const INTEGRATION_TYPE_POSTMESSAGE = 'postMessage';
export const INTEGRATION_TYPE_API         = 'api';

// ─── Прочее ──────────────────────────────────────────────────────────────────

export const CURRENCY_RUB      = 'RUB';
export const CURRENCY_RUB_SIGN = '₽';
export const SORT_ASC          = 'asc';
export const SORT_DESC         = 'desc';
export const MODEL_EXTENSION_GLB = 'glb';
export const SCREEN_WIDTH      = 600;
export const SCREEN_HEIGHT     = 600;
