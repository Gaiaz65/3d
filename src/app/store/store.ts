import {
  signalStore,
  withState,
  withMethods,
  patchState,
} from '@ngrx/signals';

type State = {
  roomParameters: {
    size: {
      x: number,
      y: number,
      z: number,
    }
  }
};

const initialState: State = {
  roomParameters: {
    size: {
      x: 5,
      y: 2.5,
      z: 4,
    }
  }
};

export const ConfigurationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    updateRoomSize(roomParameters: any) {
      patchState(store, {roomParameters});
    },
  })),
);

export type ConfigurationStore = InstanceType<typeof ConfigurationStore>;

