import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';
import { getCurrentRoundData } from '../store/slices/gameStatusSlice';

class GamesContainer extends ReduxMixin(LitElement) {
	static styles = css`
		:host {
			display: flex;
			gap: 2rem;
			width: 100%;
			justify-content: center;
			align-items: stretch;
			box-sizing: border-box;
		}

		@media (max-width: 768px) {
			:host {
				flex-direction: column;
				gap: 1rem;
				max-width: 500px;
				flex: 1;
			}
		}

		@media (max-width: 480px) {
			:host {
				gap: 0.75rem;
			}
		}
	`;

	render() {
		const { showingResults } = this.getState().gameStatus;
		const currentRound = getCurrentRoundData(this.getState());
		
		if (!currentRound) {
			return html``;
		}

		const state = this.getState().gameStatus;
		const currentRoundResult = state.roundResults[state.currentRound - 1];
		const selectedGameId = currentRoundResult?.selectedGame?.appId;

		const gameASelected = selectedGameId === currentRound.gameA.appId;
		const gameBSelected = selectedGameId === currentRound.gameB.appId;
		const correctGameId = currentRound.correctGame.appId;

		return html`
			<steam-game 
				.game=${currentRound.gameA}
				.isSelected=${gameASelected}
				.isCorrect=${correctGameId === currentRound.gameA.appId}
				.showResult=${showingResults && currentRoundResult?.resultVisible}>
			</steam-game>
			<steam-game 
				.game=${currentRound.gameB}
				.isSelected=${gameBSelected}
				.isCorrect=${correctGameId === currentRound.gameB.appId}
				.showResult=${showingResults && currentRoundResult?.resultVisible}>
			</steam-game>
		`;
	}
}

customElements.define('games-container', GamesContainer);