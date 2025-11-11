import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';
import { getCurrentRoundData } from '../store/slices/gameStatusSlice';

class GamesContainer extends ReduxMixin(LitElement) {
	static styles = css`
		:host {
			display: flex;
			gap: 2rem;
			width: 100%;
			max-width: 1200px;
			justify-content: center;
			align-items: stretch;
			padding: 0 1rem;
			box-sizing: border-box;
		}

		@media (max-width: 768px) {
			:host {
				flex-direction: column;
				gap: 1.5rem;
				max-width: 500px;
				padding: 0 1rem;
			}
		}

		@media (max-width: 480px) {
			:host {
				gap: 1rem;
				padding: 0 0.75rem;
			}
		}
	`;

	render() {
		const { showingResults } = this.getState().gameStatus;
		const currentRound = getCurrentRoundData(this.getState());
		
		if (!currentRound) {
			return html``;
		}

		if (showingResults) {
			return html`<review-results></review-results>`;
		}

		return html`
			<steam-game .game=${currentRound.gameA}></steam-game>
			<steam-game .game=${currentRound.gameB}></steam-game>
		`;
	}
}

customElements.define('games-container', GamesContainer);