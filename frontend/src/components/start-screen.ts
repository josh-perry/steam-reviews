import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';
import { startGameWithData, clearError } from '../store/slices/gameStatusSlice';
import { hasPlayedToday } from '../services/localSave';

class StartScreen extends ReduxMixin(LitElement) {
	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2rem;
			text-align: center;
			padding: 1rem;
			width: 100%;
			max-width: 600px;
		}

		h2 {
			font-size: 2rem;
			color: #333;
			margin: 0;
			line-height: 1.2;
		}

		p {
			font-size: 1.2rem;
			color: #666;
			max-width: 600px;
			line-height: 1.6;
			margin: 0;
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
			min-width: 150px;
		}

		.start-button:hover:not(:disabled) {
			background: #005a9a;
		}

		.start-button:disabled {
			background: #ccc;
			cursor: not-allowed;
		}

		.error {
			color: #d32f2f;
			background: #ffebee;
			padding: 1rem;
			border-radius: 8px;
			border: 1px solid #ffcdd2;
			max-width: 500px;
			width: 100%;
		}

		.loading {
			color: #666;
			font-style: italic;
		}

		.loading-details {
			font-size: 0.9rem;
			color: #888;
			margin-top: 0.5rem;
		}

		@media (max-width: 768px) {
			:host {
				gap: 1.5rem;
				padding: 0.75rem;
			}
			
			h2 {
				font-size: 1.75rem;
			}
			
			p {
				font-size: 1.1rem;
			}
			
			.start-button {
				padding: 0.875rem 1.75rem;
				font-size: 1.1rem;
				width: 100%;
				max-width: 250px;
			}
			
			.error {
				padding: 0.875rem;
				font-size: 0.9rem;
			}
		}

		@media (max-width: 480px) {
			:host {
				gap: 1rem;
				padding: 0.5rem;
			}
			
			h2 {
				font-size: 1.5rem;
			}
			
			p {
				font-size: 1rem;
			}
			
			.start-button {
				padding: 0.75rem 1.5rem;
				font-size: 1rem;
			}
		}
	`;

	private handleStartGame() {
		this.dispatch(clearError());
		this.dispatch(startGameWithData());
	}

	render() {
		const { loading, error } = this.getState().gameStatus;
		const { dailyDate } = this.getState().date;
		const playedToday = dailyDate && hasPlayedToday(dailyDate);

		return html`
			<h2>which game is rated higher: the game</h2>
			<p>pick the one with better review %</p>
			
			${error ? html`
				<div class="error">
					Error: ${error}
					<br><small>Make sure the API server is running on port 5000</small>
				</div>
			` : ''}
			
			${loading ? html`
				<div class="loading">Loading games...</div>
			` : ''}

			<button
				class="start-button" 
				@click=${this.handleStartGame}
				?disabled=${loading || playedToday}
			>
				${loading ? 'Loading...' : 'Start Game'}
			</button>

			${playedToday ? html`
				<game-results-modal></game-results-modal>
			` : ''}
		`;
	}
}

customElements.define('start-screen', StartScreen);