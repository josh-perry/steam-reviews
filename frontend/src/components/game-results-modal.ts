import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';
import { getStreakInfo, getTodaysResult } from '../services/localSave';

class GameResultsModal extends ReduxMixin(LitElement) {
	static styles = css`
		:host {
			pointer-events: none;
		}

		:host(.visible) {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.6);
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 1000;
			backdrop-filter: blur(4px);
			pointer-events: auto;
			padding: 1rem;
		}

		.modal {
			background: white;
			border-radius: 16px;
			padding: 3rem 2rem;
			max-width: 500px;
			width: 90%;
			text-align: center;
			box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
			animation: modalSlideIn 0.3s ease-out;
			max-height: 90vh;
			overflow-y: auto;
		}

		@keyframes modalSlideIn {
			from {
				opacity: 0;
				transform: scale(0.9) translateY(-20px);
			}
			to {
				opacity: 1;
				transform: scale(1) translateY(0);
			}
		}

		.modal h2 {
			font-size: 2.5rem;
			color: #333;
			margin: 0 0 1rem 0;
		}

		.score-display {
			font-size: 3rem;
			font-weight: bold;
			color: #007acc;
			margin: 1rem 0;
		}

		.modal-buttons {
			display: flex;
			gap: 1rem;
			justify-content: center;
			margin-top: 2rem;
			flex-wrap: wrap;
		}

		.button {
			padding: 1rem 2rem;
			font-size: 1.1rem;
			border: none;
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.3s ease;
			min-width: 120px;
		}

		.close-button {
			background: #6c757d;
			color: white;
		}

		.close-button:hover {
			background: #5a6268;
			transform: translateY(-2px);
		}

		.share-button {
			background: #28a745;
			color: white;
		}

		.share-button:hover {
			background: #218838;
			transform: translateY(-2px);
		}

		.share-button.copied {
			background: #17a2b8;
		}

		.streak-info {
			display: flex;
			justify-content: center;
			gap: 3rem;
			margin: 1.5rem 0;
			flex-wrap: wrap;
		}

		.streak-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.25rem;
		}

		.streak-label {
			font-size: 0.9rem;
			color: #666;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		.streak-value {
			font-size: 2rem;
			font-weight: bold;
			color: #007acc;
		}

		@media (max-width: 768px) {
			:host(.visible) {
				padding: 0.5rem;
			}
			
			.modal {
				padding: 2rem 1.5rem;
				width: 95%;
				border-radius: 12px;
			}
			
			.modal h2 {
				font-size: 2rem;
			}
			
			.score-display {
				font-size: 2.5rem;
			}
			
			.modal-buttons {
				gap: 0.75rem;
				margin-top: 1.5rem;
			}
			
			.button {
				padding: 0.875rem 1.5rem;
				font-size: 1rem;
				min-width: 100px;
			}
		}

		@media (max-width: 480px) {
			.modal {
				padding: 1.5rem 1rem;
			}
			
			.modal h2 {
				font-size: 1.75rem;
			}
			
			.score-display {
				font-size: 2rem;
			}
			
			.modal-buttons {
				flex-direction: column;
				gap: 0.5rem;
			}
			
			.button {
				padding: 0.75rem 1rem;
				width: 100%;
				min-width: 0;
			}
		}
	`;

	private shareButtonText = 'Share Results';

	private async handleShare() {
		const { gameComplete, totalRounds } = this.getState().gameStatus;
        const { dailyDate } = this.getState().date;
		
		const todayResult = dailyDate ? getTodaysResult(dailyDate) : null;
		const displayScore = todayResult ? todayResult.numberCorrect : this.getState().gameStatus.score;
		const displayRoundResults = todayResult ? todayResult.roundResults : this.getState().gameStatus.roundResults;
		
		const emojiResults = displayRoundResults.map(r => {
			if (typeof r === 'boolean') {
				return r ? '🟩' : '🟥';
			}
			if (!r.played) return '⬛';
			return r.isCorrect ? '🟩' : '🟥';
		}).join('');

		const shareText = `${this.getEmojiForScore(displayScore)} ${emojiResults} ${displayScore}/${totalRounds} | ${dailyDate} | http://steam.literallyjosh.com`;

		try {
			await navigator.clipboard.writeText(shareText);
			this.shareButtonText = 'Copied!';
		}
		catch (err) {
			console.error('Failed to copy to clipboard:', err);
			console.log(shareText);

			this.shareButtonText = 'Failed to copy';
		}

		this.requestUpdate();
	}

	private getMessageForScore(score: number): string {
		if (score === 0) {
			return "Just as impressive as getting them all right, in a way!";
		} else if (score <= 4) {
			return "Not so good."
		} else if (score === 5) {
			return "Might as well have flipped a coin.";
		} else if (score <= 7) {
			return "Not bad!";
		} else if (score <= 9) {
			return "Great job!";
		} else {
			return "Perfect!";
		}
	}
	
	private getEmojiForScore(score: number): string {
		if (score < 2) {
			return "💩";
		} else if (score <= 4) {
			return "😐";
		} else if (score === 5) {
			return "🪙";
		} else if (score <= 7) {
			return "👍";
		} else if (score <= 9) {
			return "🔥";
		} else {
			return "🏆";
		}
	}

	render() {
		const { gameComplete, score, totalRounds, roundResults } = this.getState().gameStatus;
        const { dailyDate } = this.getState().date;

		const todayResult = dailyDate ? getTodaysResult(dailyDate) : null;
		const shouldShow = gameComplete || todayResult !== null;
		const { currentStreak, highestStreak } = getStreakInfo();
		
		if (shouldShow) {
			this.classList.add('visible');
		} else {
			this.classList.remove('visible');
		}

		if (!shouldShow) {
			return html``;
		}

		const displayScore = todayResult ? todayResult.numberCorrect : score;
		const displayRoundResults = todayResult ? todayResult.roundResults : roundResults;

		return html`
			<div class="modal" @click=${(e: Event) => e.stopPropagation()}>
				<h2>${dailyDate}</h2>
				<div class="score-display">${displayScore}/${totalRounds}</div>
				
				${(gameComplete || todayResult) ? html`
					<results-summary 
						.roundResults=${displayRoundResults}>
					</results-summary>
				` : ''}

				<div>
					${this.getMessageForScore(displayScore)}
					${this.getEmojiForScore(displayScore)}
				</div>

				<div class="streak-info">
						<div class="streak-item">
							<div class="streak-label">Current streak</div>
							<div class="streak-value">${currentStreak}</div>
						</div>
						<div class="streak-item">
							<div class="streak-label">Highest streak</div>
							<div class="streak-value">${highestStreak}</div>
						</div>
				</div>
				
				<div class="modal-buttons">
					<button class="button share-button ${this.shareButtonText === 'Copied!' ? 'copied' : ''}" @click=${this.handleShare}>
						${this.shareButtonText}
					</button>
				</div>
			</div>
		`;
	}
}

customElements.define('game-results-modal', GameResultsModal);
