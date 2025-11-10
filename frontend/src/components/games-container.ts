import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ReduxMixin } from '../store/ReduxMixin';
import { getCurrentRoundData } from '../store/slices/gameStatusSlice';
import type { GameRound } from '../store/slices/gameStatusSlice';

class GamesContainer extends ReduxMixin(LitElement) {
	static styles = css`
		:host {
			display: flex;
			gap: 2rem;
			width: 100%;
			max-width: 1200px;
			justify-content: center;
			align-items: stretch;
		}
	`;

	render() {
		const currentRound = getCurrentRoundData(this.getState());
		
		if (!currentRound) {
			return html``;
		}

		return html`
			<steam-game .game=${currentRound.gameA}></steam-game>
			<steam-game .game=${currentRound.gameB}></steam-game>
		`;
	}
}

customElements.define('games-container', GamesContainer);