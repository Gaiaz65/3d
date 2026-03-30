import {
  signalStore,
  withState,
  withMethods,
  patchState,
} from '@ngrx/signals';
import {IWall} from '../planner-scene/interfaces/configuration';

export type SceneItemPosition = {x: number; y: number; z: number};
export type SceneItem = {
  id: number;
  rotation: number;
  size: [number, number, number];
  position: SceneItemPosition;
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

export const ConfigurationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
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
      const newId = Math.max(...store.items().map(i => i.id)) + 1;
      patchState(store, {items: [...store.items(), {...item, id: newId, position}]});
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
      patchState(store, {facades: facade})
    },
    addItem(configuration: any, initialY?: number) {
      const ids = store.items().map(i => i.id);
      const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      patchState(store, {
        items: [...store.items(), {
          ...configuration,
          id: newId,
          rotation: 0,
          size: configuration.size,
          position: {x: 0, y: initialY ?? configuration.size.y / 2, z: 0},
        }],
      });
    },
  })),
);

export type ConfigurationStore = InstanceType<typeof ConfigurationStore>;
