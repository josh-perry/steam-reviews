import { store } from './store';
import type { RootState, AppDispatch } from './store';

export const getState = (): RootState => store.getState();
export const dispatch: AppDispatch = store.dispatch;

export const subscribeToStore = (callback: () => void) => {
	return store.subscribe(callback);
};

export const selectFromStore = <T>(selector: (state: RootState) => T): T => {
	return selector(store.getState());
};
