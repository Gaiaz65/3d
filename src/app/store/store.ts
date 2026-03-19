import {
  signalStore,
  withState,
  withMethods,
  patchState,
} from '@ngrx/signals';
import {IWall} from '../planner-scene/interfaces/configuration';

export type SceneItem = { id: number };

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
  items: [{id: 1}, {id: 2}],
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
  })),
);

export type ConfigurationStore = InstanceType<typeof ConfigurationStore>;

