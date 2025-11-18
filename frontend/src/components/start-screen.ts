import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { ReduxMixin } from '../store/ReduxMixin';
import { setGameMode } from '../store/slices/gameModeSlice';
import { startReviewsGame, fetchRounds, restoreProgress, showCompletedGame } from '../store/slices/reviewsGameSlice';
import { startTagsGame, fetchTagGame, restoreProgress as restoreTagsProgress, showCompletedGame as showTagsCompletedGame } from '../store/slices/tagsGameSlice';
import type { GameMode } from '../store/slices/gameModeSlice';
import { hasPlayedToday as hasPlayedTodayReviews, loadCurrentProgress as loadReviewsProgress } from '../services/reviews/localSave';
import { hasPlayedToday as hasPlayedTodayTags, loadCurrentProgress as loadTagsProgress } from '../services/tags/localSave';

class StartScreen extends ReduxMixin(LitElement) {
	@state()
	private buttonText = 'Start Game';

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

		.mode-selector {
			display: flex;
			gap: 1rem;
			width: 100%;
			max-width: 500px;
		}

		.mode-button {
			flex: 1;
			padding: 1.5rem;
			border: 2px solid #ccc;
			background: white;
			border-radius: 12px;
			cursor: pointer;
			transition: all 0.3s ease;
			font-size: 1rem;
		}

		.mode-button:hover:not(.selected) {
			border-color: #007acc;
			background: #f8f9fa;
		}

		.mode-button.selected {
			border-color: #007acc;
			background: #e6f3ff;
		}

		.mode-button h3 {
			margin: 0 0 0.5rem 0;
			font-size: 1.3rem;
			color: #333;
		}

		.mode-button p {
			margin: 0;
			font-size: 0.9rem;
			color: #666;
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

			.mode-selector {
				flex-direction: column;
				gap: 0.75rem;
			}

			.mode-button {
				padding: 1.25rem;
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

			.mode-button {
				padding: 1rem;
			}

			.start-button {
				padding: 0.75rem 1.5rem;
				font-size: 1rem;
			}
		}
	`;

	private handleModeSelect(mode: GameMode) {
		this.dispatch(setGameMode(mode));
		this.updateButtonText();
	}

	private updateButtonText() {
		const { currentMode } = this.getState().gameMode;
		const { dailyDate } = this.getState().date;

		const playedToday = currentMode === 'reviews' 
			? dailyDate && hasPlayedTodayReviews(dailyDate)
			: dailyDate && hasPlayedTodayTags(dailyDate);
		const hasProgress = currentMode === 'reviews'
			? dailyDate && loadReviewsProgress(dailyDate) !== null
			: dailyDate && loadTagsProgress(dailyDate) !== null;

		this.buttonText = 'Start Game';

		if (currentMode === 'reviews') {
			if (playedToday) {
				this.buttonText = 'Show Results';
			} else if (hasProgress) {
				this.buttonText = 'Resume Game';
			}
		} else if (currentMode === 'tags') {
			if (playedToday) {
				this.buttonText = 'Show Results';
			} else if (hasProgress) {
				this.buttonText = 'Resume Game';
			}
		}
	}

	connectedCallback() {
		super.connectedCallback();
		this.updateButtonText();
	}

	private async handleStartGame() {
		const { currentMode } = this.getState().gameMode;
		const { dailyDate } = this.getState().date;

		if (dailyDate) {
			const playedToday = currentMode === 'reviews' 
				? hasPlayedTodayReviews(dailyDate)
				: hasPlayedTodayTags(dailyDate);

			if (playedToday) {
				if (currentMode === 'reviews') {
					const result = await this.dispatch(fetchRounds());

					if (fetchRounds.fulfilled.match(result)) {
						this.dispatch(showCompletedGame());
					}
				} else {
					const result = await this.dispatch(fetchTagGame());

					if (fetchTagGame.fulfilled.match(result)) {
						this.dispatch(showTagsCompletedGame());
					}
				}
				return;
			}

			if (currentMode === 'reviews') {
				const savedProgress = loadReviewsProgress(dailyDate);
				
				if (savedProgress) {
					const result = await this.dispatch(fetchRounds());

					if (fetchRounds.fulfilled.match(result)) {
						this.dispatch(restoreProgress({
							score: savedProgress.score,
							currentRound: savedProgress.currentRound,
							roundResults: savedProgress.roundResults
						}));
					}
					return;
				}
			}

			if (currentMode === 'tags') {
				const savedProgress = loadTagsProgress(dailyDate);
				
				if (savedProgress) {
					const result = await this.dispatch(fetchTagGame());

					if (fetchTagGame.fulfilled.match(result)) {
						this.dispatch(restoreTagsProgress({
							score: savedProgress.score,
							currentRound: savedProgress.currentRound,
							roundResults: savedProgress.roundResults,
							currentGuesses: savedProgress.currentGuesses ?? [],
							hints: savedProgress.hints ?? []
						}));
					}
					return;
				}
			}
		}

		if (currentMode === 'reviews') {
			this.dispatch(startReviewsGame());
		} else {
			this.dispatch(startTagsGame());
		}
	}

	render() {
		const { currentMode } = this.getState().gameMode;

		this.updateButtonText();

		return html`
			<h2>which game is rated higher: the game</h2>
			<p>Choose a game mode:</p>

			<div class="mode-selector">
				<div
					class="mode-button ${currentMode === 'reviews' ? 'selected' : ''}"
					@click=${() => this.handleModeSelect('reviews')}
				>
					<h3>Reviews</h3>
					<p>Pick which game has the higher review %</p>
				</div>
				<div
					class="mode-button ${currentMode === 'tags' ? 'selected' : ''}"
					@click=${() => this.handleModeSelect('tags')}
				>
					<h3>Tags</h3>
					<p>Guess the game from its Steam tags</p>
				</div>
			</div>

			<button
				class="start-button"
				@click=${this.handleStartGame}
			>
				${this.buttonText}
			</button>
		`;
	}
}

customElements.define('start-screen', StartScreen);