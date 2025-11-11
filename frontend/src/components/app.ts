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
			padding: 1rem 0;
			text-align: center;
			flex-shrink: 0;
		}

		header h1 {
			margin: 0;
			font-size: 1.8rem;
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
			padding: 1rem 0;
			text-align: center;
			border-top: 1px solid #ddd;
			flex-shrink: 0;
		}

		@media (max-width: 768px) {
			header {
				padding: 0.75rem 0;
			}
			
			header h1 {
				font-size: 1.5rem;
				padding: 0 1rem;
			}
			
			main {
				padding: 0.5rem;
			}
			
			footer {
				padding: 0.75rem 0;
				font-size: 0.9rem;
			}
		}

		@media (max-width: 480px) {
			header h1 {
				font-size: 1.3rem;
			}
			
			main {
				padding: 0.25rem;
			}
		}
	`;

	connectedCallback() {
		super.connectedCallback();
	}

	render() {
		const { gameInProgress, gameComplete } = this.getState().gameStatus;

		return html`
			<header>
				<h1>which is rated higher?</h1>
			</header>
			
			<main>
				${!gameInProgress && !gameComplete 
					? html`<start-screen></start-screen>`
					: html`<games-container></games-container>`
				}
			</main>

			${gameInProgress || gameComplete ? html`<game-status></game-status>` : ''}

			<footer>steam review thing by josh</footer>

			${gameInProgress || gameComplete ? html`<game-results-modal></game-results-modal>` : ''}
		`;
	}
}

customElements.define('steam-app', App);
