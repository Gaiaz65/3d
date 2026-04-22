import {inject} from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  patchState,
} from '@ngrx/signals';
import {IWall} from '../planner-scene/interfaces/configuration';
import {ResolvedUnit} from '../planner-scene/interfaces/unit-config.models';
import {UnitBuilderService} from '../planner-scene/services/unit-builder.service';

export type SceneItemPosition = {x: number; y: number; z: number};
export type SceneItem = {
  id: number;
  rotation: number;
  position: SceneItemPosition;
  config: any;
  resolvedUnit: ResolvedUnit;
};

type State = {
  roomParameters: {
    size: {
      x: number,
      y: number,
      z: number,
    }
  },
  currentWall: IWall,
  currentFloor: IWall,
  showSizeLines: boolean,
  items: any[],
  facades: Record<string, any>,
};

const initialState: State = {
  roomParameters: {
    size: {
      x: 5000,
      y: 2500,
      z: 4000,
    }
  },
  currentWall: {
    id: 2,
    url: 'assets/walls/greenWall.jpg',
    title: 'Зеленые обои',
  },
  currentFloor: {
    id: 3,
    url: 'assets/floor/whiteFloor.png',
    title: 'Белое дерево',
  },
  showSizeLines: true,
  items: [],
  facades: {},
};

/**
 * Позиции в сторе — в мм (совпадают с мировыми координатами Three.js).
 * resolvedUnit.size — в метрах (геометрия внутри group со scale 1000x).
 * Поэтому все размеры объектов умножаем на 1000 перед сравнением с позициями.
 */
function findFreePosition(
  items: SceneItem[],
  newUnit: ResolvedUnit,
  roomSize: { x: number; y: number; z: number },
): SceneItemPosition {
  const roomHalfX = roomSize.x / 2;            // мм
  const newHalfW  = newUnit.size.x * 1000 / 2; // метры → мм
  const newHalfD  = newUnit.size.z * 1000 / 2; // метры → мм
  const y = newUnit.level === 'bottom' ? 0 : roomSize.y / 2;
  // левый верхний угол
  const z = -(roomSize.z  / 2 - (newUnit.corpusSize.z * 1000));

  // X-интервалы элементов, перекрывающихся по Z с новым объектом
  const occupied = items
    .filter(item => {
      const itemHalfD = item.resolvedUnit.size.z * 1000 / 2;
      return Math.abs(item.position.z - z) < newHalfD + itemHalfD;
    })
    .map(item => {
      const halfW = item.resolvedUnit.size.x * 1000 / 2;
      return [item.position.x - halfW, item.position.x + halfW] as [number, number];
    })
    .sort((a, b) => a[0] - b[0]);

  // Сканируем слева направо, ищем первый зазор
  let cx = -roomHalfX + newHalfW;

  for (const [lo, hi] of occupied) {
    if (cx + newHalfW <= lo) break;
    if (hi + newHalfW > cx) cx = hi + newHalfW;
  }

  return cx + newHalfW <= roomHalfX
    ? { x: cx, y, z }
    : { x: 0, y, z }; // fallback: центр комнаты
}

export const ConfigurationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const builder = inject(UnitBuilderService);

    const nextId = () => {
      const ids = store.items().map(i => i.id);
      return ids.length > 0 ? Math.max(...ids) + 1 : 1;
    };

    return {
      updateRoomSize(roomParameters: any) {
        patchState(store, {roomParameters});
      },
      setCurrentWall(wall: IWall) {
        patchState(store, {currentWall: wall});
      },
      setCurrentFloor(floor: IWall) {
        patchState(store, {currentFloor: floor});
      },
      toggleSizeLines(flag: boolean) {
        patchState(store, {showSizeLines: flag});
      },
      clearItems() {
        patchState(store, {items: []});
      },
      copyItem(id: number, position: SceneItemPosition) {
        const item = store.items().find(i => i.id === id);
        if (!item) return;
        patchState(store, {items: [...store.items(), {...item, id: nextId(), position}]});
      },
      removeItem(id: number) {
        patchState(store, {items: store.items().filter(i => i.id !== id)});
      },
      setItemRotation(id: number, rotation: number) {
        patchState(store, {items: store.items().map(i => i.id === id ? {...i, rotation} : i)});
      },
      setItemPosition(id: number, position: SceneItemPosition) {
        patchState(store, {items: store.items().map(i => i.id === id ? {...i, position} : i)});
      },
      setFacadeStyle(facade: any) {
        patchState(store, {facades: facade});
      },
      addItem(config: any) {
        const resolvedUnit = builder.build(config);
        const position = findFreePosition(store.items(), resolvedUnit, store.roomParameters().size);
        patchState(store, {
          items: [...store.items(), {id: nextId(), rotation: 0, position, config, resolvedUnit}],
        });
      },
      updateItemConfig(id: number, config: any) {
        const resolvedUnit = builder.build(config);
        patchState(store, {
          items: store.items().map(i => i.id === id ? {...i, config, resolvedUnit} : i),
        });
      },
    };
  }),
);

export type ConfigurationStore = InstanceType<typeof ConfigurationStore>;
