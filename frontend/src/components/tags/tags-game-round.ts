import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ReduxMixin } from '../../store/ReduxMixin';
import { submitGuess } from '../../store/slices/tagsGameSlice';
import { apiService } from '../../services/api';
import type { Game } from '../../store/slices/tagsGameSlice';
import levenshtein from 'levenshtein';

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

		.attempts-counter {
			text-align: center;
			font-size: 1rem;
			color: #666;
			font-weight: 500;
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

		.previous-guesses {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}

		.previous-guesses h4 {
			margin: 0;
			font-size: 1.1rem;
			color: #333;
		}

		.guesses-list {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			max-height: 200px;
			overflow-y: auto;
			padding: 0.5rem;
			background: #f8f9fa;
			border-radius: 8px;
		}

		.guess-item {
			padding: 0.5rem 0.75rem;
			background: white;
			border-left: 3px solid #dc3545;
			border-radius: 4px;
			font-size: 0.95rem;
			color: #333;
		}

		.guess-item.close {
			border-left-color: #ffc107;
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

		img {
			width: 100%;
			height: 100%;
			margin-top: 1rem;
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

		const { gameInProgress, currentRoundAnswered, currentGuesses } = this.getState().tagsGame;
		
		if (gameInProgress && !currentRoundAnswered) {
			const normalizedGuess = this.currentGuess.trim().toLowerCase();
			const normalizedCorrectName = this.game.name.toLowerCase();
			const isCorrect = normalizedGuess === normalizedCorrectName;
			
			this.dispatch(submitGuess({ guess: this.currentGuess, isCorrect }));
			
			this.currentGuess = '';
		}
	}

	private handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			this.handleSubmit();
		}
	}

	render() {
		const { currentRoundAnswered, showResultColors, roundResults, currentRound, currentGuesses, maxGuesses, hints } = this.getState().tagsGame;
		
		const tags = this.game.tags?.slice(0, 10 + currentGuesses.length) || [];
		const currentRoundResult = roundResults[currentRound - 1];
		const isCorrect = currentRoundResult?.isCorrect;
		const remainingGuesses = maxGuesses - currentGuesses.length;
		
		const normalizedCorrectName = this.game.name.toLowerCase();
		const incorrectGuesses = currentGuesses.filter(guess => 
			guess.trim().toLowerCase() !== normalizedCorrectName
		);

		function isCloseGuess(guess: string): boolean {
			const distance = new levenshtein(guess.toLowerCase(), normalizedCorrectName).distance;
			return distance <= normalizedCorrectName.length * 0.3;
		}

		return html`
			<div class="tags-container">
				${tags.length > 0 
					? tags.map(tag => html`<div class="tag">${tag}</div>`)
					: html`<div class="tag">No tags available</div>`
				}
			</div>

			${hints.length > 0 ? html`
			<div class="hints-container">
				<h4>Hints:</h4>
				<ul>
					${hints.map(hint => html`<li>${hint}</li>`)}
				</ul>
			</div>` : ''}

			<div class="guess-section">
				<h3>What game is this?</h3>
				${!currentRoundAnswered ? html`
					<div class="attempts-counter">
						${remainingGuesses} ${remainingGuesses === 1 ? 'guess' : 'guesses'} remaining
					</div>
				` : ''}

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
				${incorrectGuesses.length > 0 ? html`
				<div class="previous-guesses">
					<h4>Incorrect Guesses (${incorrectGuesses.length})</h4>
					<div class="guesses-list">
						${incorrectGuesses.map(guess => html`
							<div class="guess-item ${isCloseGuess(guess) ? 'close' : ''}">${guess}</div>
						`)}
					</div>
				</div>
			` : ''}

			${currentRoundAnswered && showResultColors ? html`
				<div class="result-container ${isCorrect ? 'correct' : 'incorrect'}">
					<h4>${isCorrect ? `You got it!` : 'Out of guesses!'}</h4>
					<div class="correct-answer">
						The answer was: <strong>${this.game.name}</strong>

						<img 
							src="${this.game.imgUrl}" 
							alt="${this.game.name}"
						/>
					</div>
				</div>
			` : ''}
		`;
	}
}

customElements.define('tags-game-round', TagsGameRound);
