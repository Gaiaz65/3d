import { signalStore, withState } from '@ngrx/signals';

interface AppState {
  count: number;
  // other global state properties
}

const initialState: AppState = {
  count: 0
};

export const AppStore = signalStore(
  // 👇 Provide the store at the root level
  { providedIn: 'root' },
  withState(initialState)
  // Add other features like withComputed, withMethods, etc.
);
