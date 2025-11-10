import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';

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

		.loading {
			font-size: 1.2rem;
			color: #666;
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

	render() {
		const { gameInProgress, gameComplete } = this.getState().gameStatus;

		if (!gameInProgress && !gameComplete) {
			return html`
				<header>
					<h1>which is rated higher?</h1>
				</header>
				
				<main>
					<start-screen></start-screen>
				</main>

				<footer>steam review thing by josh</footer>
			`;
		}

		return html`
			<header>
				<h1>which is rated higher?</h1>
			</header>
			
			<main>
				<games-container></games-container>
			</main>

			<game-status></game-status>

			<footer>steam review thing by josh</footer>
		`;
	}
}

customElements.define('steam-app', App);
