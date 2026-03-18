import {
  signalStore,
  withState,
  withMethods,
  patchState,
} from '@ngrx/signals';
import {IWall} from '../planner-scene/interfaces/configuration';

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
};

const initialState: State = {
  roomParameters: {
    size: {
      x: 5,
      y: 2.5,
      z: 4,
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
  })),
);

export type ConfigurationStore = InstanceType<typeof ConfigurationStore>;

