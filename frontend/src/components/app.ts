import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';
import { fetchDailyDate } from '../store/slices/dateSlice';

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
			display: flex;
			justify-content: space-between;
			align-items: center;
			flex-shrink: 0;
		}

		header h1, header .current-day {
			margin: 0;
			font-size: 1.8rem;
		}

		header h1 a {
			text-decoration: none;
			color: white;
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
				padding: 0.75rem;
			}
			
			header h1, header .current-day {
				font-size: 1.5rem;
			}

			main {
				justify-content: flex-start;
				padding: 0.75rem 0.5rem;
			}
			
			footer {
				padding: 0.75rem 0;
				font-size: 0.9rem;
			}
		}

		@media (max-width: 480px) {
			header h1, header .current-day {
				font-size: 1.3rem;
			}

			main {
				padding: 0.5rem 0.25rem;
			}
		}
	`;

	async connectedCallback() {
		super.connectedCallback();
		await this.dispatch(fetchDailyDate());
	}

	render() {
		const { currentMode } = this.getState().gameMode;
		const reviewsGame = this.getState().reviewsGame;
		const tagsGame = this.getState().tagsGame;
		
		const gameInProgress = currentMode === 'reviews' ? reviewsGame.gameInProgress : tagsGame.gameInProgress;
		const gameComplete = currentMode === 'reviews' ? reviewsGame.gameComplete : tagsGame.gameComplete;
		
		const { dailyDate } = this.getState().date;

		return html`
			<header>
				<h1>
					<a href="/">which is rated higher?</a>
				</h1>

				<div class="current-day">${dailyDate}</div>
			</header>
			
			<main>
				${gameInProgress || gameComplete
					? currentMode === 'tags'
						? html`<tags-game-container></tags-game-container>`
						: html`<games-container></games-container>`
					: html`<start-screen></start-screen>`
				}
			</main>

			${gameInProgress && currentMode === 'reviews' ? html`<game-status></game-status>` : ''}

			<footer>steam review thing by josh</footer>

			${gameComplete && currentMode === 'reviews' ? html`<game-results-modal></game-results-modal>` : ''}
		`;
	}
}

customElements.define('steam-app', App);
