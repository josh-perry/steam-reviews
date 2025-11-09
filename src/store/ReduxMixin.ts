import { LitElement } from 'lit';
import { store } from '../store/store';
import type { RootState } from '../store/store';

export const ReduxMixin = <T extends Constructor<LitElement>>(superClass: T) => {
	class ReduxElement extends superClass {
		private _unsubscribe?: () => void;

		connectedCallback() {
			super.connectedCallback();

			this._unsubscribe = store.subscribe(() => {
				this.requestUpdate();
			});
		}

		disconnectedCallback() {
			super.disconnectedCallback();

			if (this._unsubscribe) {
				this._unsubscribe();
			}
		}

		protected getState(): RootState {
			return store.getState();
		}

		protected dispatch = store.dispatch;
	}

	return ReduxElement;
};

type Constructor<T = {}> = new (...args: any[]) => T;
