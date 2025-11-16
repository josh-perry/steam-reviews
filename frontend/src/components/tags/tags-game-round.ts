import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ReduxMixin } from '../../store/ReduxMixin';
import { submitGuess } from '../../store/slices/tagsGameSlice';
import { apiService } from '../../services/api';
import type { Game } from '../../store/slices/tagsGameSlice';

class TagsGameRound extends ReduxMixin(LitElement) {
	@property({ type: Object })
	declare game: Game;

	@state()
	private currentGuess = '';

	@state()
	private gameNames: string[] = [];

	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			gap: 2rem;
			width: 100%;
			padding: 2rem;
			background: white;
			border-radius: 12px;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		}

		.tags-container {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			justify-content: center;
			padding: 1rem;
			background: #f8f9fa;
			border-radius: 8px;
		}

		.tag {
			background: #007acc;
			color: white;
			padding: 0.5rem 1rem;
			border-radius: 20px;
			font-size: 1rem;
			font-weight: 500;
		}

		.guess-section {
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}

		.guess-section h3 {
			margin: 0;
			font-size: 1.5rem;
			color: #333;
			text-align: center;
		}

		.input-container {
			display: flex;
			gap: 0.5rem;
		}

		input {
			flex: 1;
			padding: 0.75rem;
			font-size: 1.1rem;
			border: 2px solid #ccc;
			border-radius: 8px;
			transition: border-color 0.3s;
		}

		input:focus {
			outline: none;
			border-color: #007acc;
		}

		input:disabled {
			background: #f5f5f5;
			cursor: not-allowed;
		}

		button {
			padding: 0.75rem 1.5rem;
			font-size: 1.1rem;
			background: #007acc;
			color: white;
			border: none;
			border-radius: 8px;
			cursor: pointer;
			transition: background 0.3s;
			min-width: 120px;
		}

		button:hover:not(:disabled) {
			background: #005a9a;
		}

		button:disabled {
			background: #ccc;
			cursor: not-allowed;
		}

		.result-container {
			padding: 1rem;
			border-radius: 8px;
			text-align: center;
		}

		.result-container.correct {
			background: #d4edda;
			color: #155724;
			border: 2px solid #28a745;
		}

		.result-container.incorrect {
			background: #f8d7da;
			color: #721c24;
			border: 2px solid #dc3545;
		}

		.result-container h4 {
			margin: 0 0 0.5rem 0;
			font-size: 1.3rem;
		}

		.result-container .correct-answer {
			font-size: 1.1rem;
			font-weight: bold;
		}

		@media (max-width: 768px) {
			:host {
				padding: 1.5rem;
				gap: 1.5rem;
			}

			.tag {
				padding: 0.4rem 0.8rem;
				font-size: 0.9rem;
			}

			.guess-section h3 {
				font-size: 1.3rem;
			}

			input, button {
				font-size: 1rem;
				padding: 0.6rem;
			}
		}

		@media (max-width: 480px) {
			:host {
				padding: 1rem;
				gap: 1rem;
			}

			.input-container {
				flex-direction: column;
			}

			button {
				width: 100%;
			}
		}
	`;

	async connectedCallback() {
		super.connectedCallback();

		const response = await apiService.getGameNames();
		if (response.data) {
			this.gameNames = response.data;
		}
	}

	private handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		this.currentGuess = input.value;
	}

	private handleSubmit() {
		if (!this.currentGuess.trim()) return;

		const { gameInProgress, currentRoundAnswered } = this.getState().tagsGame;
		
		if (gameInProgress && !currentRoundAnswered) {
			const normalizedGuess = this.currentGuess.trim().toLowerCase();
			const normalizedCorrectName = this.game.name.toLowerCase();
			const isCorrect = normalizedGuess === normalizedCorrectName;
			
			this.dispatch(submitGuess({ guess: this.currentGuess, isCorrect }));
		}
	}

	private handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			this.handleSubmit();
		}
	}

	render() {
		const { currentRoundAnswered, showResultColors, roundResults, currentRound } = this.getState().tagsGame;
		
		const tags = this.game.tags || [];
		const currentRoundResult = roundResults[currentRound - 1];
		const isCorrect = currentRoundResult?.isCorrect;

		return html`
			<div class="tags-container">
				${tags.length > 0 
					? tags.map(tag => html`<div class="tag">${tag}</div>`)
					: html`<div class="tag">No tags available</div>`
				}
			</div>

			<div class="guess-section">
				<h3>What game is this?</h3>
				<div class="input-container">
					<input
						type="text"
						placeholder="Enter game name..."
						.value=${this.currentGuess}
						@input=${this.handleInput}
						@keydown=${this.handleKeyDown}
						?disabled=${currentRoundAnswered}
						list="game-names-list"
					/>
					<datalist id="game-names-list">
						${this.gameNames.map(name => html`<option value="${name}"></option>`)}
					</datalist>
					<button
						@click=${this.handleSubmit}
						?disabled=${currentRoundAnswered || !this.currentGuess.trim()}
					>
						Submit
					</button>
				</div>
			</div>

			${currentRoundAnswered && showResultColors ? html`
				<div class="result-container ${isCorrect ? 'correct' : 'incorrect'}">
					<h4>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</h4>
					<div class="correct-answer">
						The answer was: <strong>${this.game.name}</strong>
					</div>
				</div>
			` : ''}
		`;
	}
}

customElements.define('tags-game-round', TagsGameRound);
