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
  items: SceneItem[],
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
  items: [
    {id: 1, rotation: 0, size: [500, 500, 500], position: {x:  500, y: 250, z:  500}},
    {id: 2, rotation: 0, size: [500, 500, 500], position: {x: -500, y: 250, z: -500}},
  ],
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
  })),
);

export type ConfigurationStore = InstanceType<typeof ConfigurationStore>;
