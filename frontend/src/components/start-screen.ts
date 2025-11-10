import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';
import { startGameWithData, clearError } from '../store/slices/gameStatusSlice';

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
		}

		.loading {
			color: #666;
			font-style: italic;
		}
	`;

	private handleStartGame() {
		this.dispatch(clearError());
		this.dispatch(startGameWithData());
	}

	render() {
		const { loading, error } = this.getState().gameStatus;

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
				<div class="loading">Loading games data...</div>
			` : ''}
			
			<button 
				class="start-button" 
				@click=${this.handleStartGame}
				?disabled=${loading}
			>
				${loading ? 'Loading...' : 'Start Game'}
			</button>
		`;
	}
}

customElements.define('start-screen', StartScreen);