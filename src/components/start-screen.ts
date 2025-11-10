import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';
import { startGame } from '../store/slices/gameStatusSlice';

class StartScreen extends ReduxMixin(LitElement) {
	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2rem;
			text-align: center;
		}

		h2 {
			font-size: 2rem;
			color: #333;
			margin: 0;
		}

		p {
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
	`;

	private handleStartGame() {
		this.dispatch(startGame());
	}

	render() {
		return html`
			<h2>which game is rated higher: the game</h2>
			<p>pick the one with better review %</p>
			<button class="start-button" @click=${this.handleStartGame}>
				Start Game
			</button>
		`;
	}
}

customElements.define('start-screen', StartScreen);