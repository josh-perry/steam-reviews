import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';
import { startGame, getCurrentRoundData } from '../store/slices/gameStatusSlice';

class App extends ReduxMixin(LitElement) {
	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			min-height: 100vh;
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		header {
			background: #1e1e1e;
			color: white;
			padding: 1rem;
			text-align: center;
			flex-shrink: 0;
		}

		header h1 {
			margin: 0;
		}

		main {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			padding: 1rem;
			min-height: 0;
		}

		.games-container {
			display: flex;
			gap: 2rem;
			width: 100%;
			max-width: 1200px;
			justify-content: center;
			align-items: stretch;
		}

		.loading {
			font-size: 1.2rem;
			color: #666;
		}

		.start-screen {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2rem;
			text-align: center;
		}

		.start-screen h2 {
			font-size: 2rem;
			color: #333;
			margin: 0;
		}

		.start-screen p {
			font-size: 1.2rem;
			color: #666;
			max-width: 600px;
			line-height: 1.6;
		}

		.start-button {
			background: #007acc;
			color: white;
			border: none;
			padding: 1rem 2rem;
			font-size: 1.2rem;
			border-radius: 8px;
			cursor: pointer;
			transition: background-color 0.3s ease;
		}

		.start-button:hover {
			background: #005a9a;
		}

		footer {
			background: #f5f5f5;
			padding: 1rem;
			text-align: center;
			border-top: 1px solid #ddd;
			flex-shrink: 0;
		}
	`;

	connectedCallback() {
		super.connectedCallback();
	}

	private handleStartGame() {
		this.dispatch(startGame());
	}

	render() {
		const { gameInProgress, gameComplete } = this.getState().gameStatus;
		const currentRound = getCurrentRoundData(this.getState());

		if (!gameInProgress && !gameComplete) {
			return html`
				<header>
					<h1>which is rated higher?</h1>
				</header>
				
				<main>
					<div class="start-screen">
						<h2>which game is rated higher: the game</h2>
						<p>pick the one with better review %</p>
						<button class="start-button" @click=${this.handleStartGame}>
							Start Game
						</button>
					</div>
				</main>

				<footer>steam review thing by josh</footer>
			`;
		}

		return html`
			<header>
				<h1>which is rated higher?</h1>
			</header>
			
			<main>
				<div class="games-container">
					<steam-game .game=${currentRound.gameA}></steam-game>
					<steam-game .game=${currentRound.gameB}></steam-game>
				</div>
			</main>

			<game-status></game-status>

			<footer>steam review thing by josh</footer>
		`;
	}
}

customElements.define('steam-app', App);
