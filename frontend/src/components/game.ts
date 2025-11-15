import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ReduxMixin } from '../store/ReduxMixin';
import { submitRoundAnswer, getCurrentRoundData } from '../store/slices/gameStatusSlice';
import type { Game } from '../store/slices/gameStatusSlice';

class GameComponent extends ReduxMixin(LitElement) {
	@property({ type: Object })
	declare game: Game;

	@property({ type: Boolean })
	declare isSelected: boolean;

	@property({ type: Boolean })
	declare isCorrect: boolean;

	@property({ type: Boolean })
	declare showResult: boolean;

	private animatedRating = 0;
	private animationFrameId: number | null = null;

	static styles = css`
		:host {
			display: flex;
			flex: 1;
			min-width: 0;
			min-height: 0;
			border: 2px solid #ccc;
			padding: 2rem;
			border-radius: 12px;
			cursor: pointer;
			transition: all 0.3s ease;
			background: white;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
			box-sizing: border-box;
		}
		
		:host(:hover) {
			background-color: #f8f9fa;
			border-color: #007acc;
			transform: translateY(-2px);
			box-shadow: 0 4px 16px rgba(0,0,0,0.15);
		}

		:host(.disabled) {
			cursor: not-allowed;
		}

		:host(.disabled:hover) {
			background-color: white;
			border-color: #ccc;
			transform: none;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		}

		:host(.correct) {
			border-color: #28a745;
			background-color: #d4edda;
		}

		:host(.incorrect) {
			border-color: #dc3545;
			background-color: #f8d7da;
		}

		:host(.not-selected) {
			opacity: 0.7;
		}

		:host(.selected) {
			border-color: #007acc;
			background-color: #e6f3ff;
		}
		
		.game-info {
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
			width: 100%;
			height: 100%;
			box-sizing: border-box;
		}
		
		.game-image {
			width: 100%;
			flex: 1;
			border-radius: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 2px 8px rgba(0,0,0,0.2);
			overflow: hidden;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 0;
		}

		.game-image img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			border-radius: 12px;
		}

		.game-image-placeholder {
			color: white;
			font-size: 18px;
			font-weight: bold;
			text-shadow: 0 1px 2px rgba(0,0,0,0.3);
		}
		
		.game-details {
			width: 100%;
			height: 140px;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			padding-top: 1rem;
			box-sizing: border-box;
			flex-shrink: 0;
		}
		
		.game-details h3 {
			margin: 0 0 0.5rem 0;
			font-size: 1.5rem;
			color: #333;
			line-height: 1.2;
		}

		.rating-placeholder {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			min-height: 60px;
		}

		.rating-display {
			font-size: 2rem;
			font-weight: bold;
			color: #007acc;
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 60px;
		}

		@media (max-width: 768px) {
			:host {
				padding: 1.5rem;
				flex: 1;
				min-height: 0;
			}
			
			.game-details {
				height: 130px;
			}
			
			.game-details h3 {
				font-size: 1.3rem;
			}

			.rating-display {
				font-size: 1.8rem;
			}
		}

		@media (max-width: 480px) {
			:host {
				padding: 1rem;
				flex: 1;
				min-height: 0;
			}
			
			.game-details {
				height: 120px;
			}
			
			.rating-display, .rating-placeholder {
				font-size: 1.6rem;
				min-height: 50px;
			}
		}
	`;

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
		}
	}

	updated(changedProperties: Map<string, any>) {
		super.updated(changedProperties);
		
		if (changedProperties.has('showResult') && this.showResult) {
			this.startRatingAnimation();
		}
	}

	private startRatingAnimation() {
		const targetRating = this.game.rating;
		const duration = 750;
		const startTime = performance.now();

		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const easeOut = 1 - Math.pow(1 - progress, 3);

			this.animatedRating = parseFloat((targetRating * easeOut).toFixed(2));
			this.requestUpdate();

			if (progress < 1) {
				this.animationFrameId = requestAnimationFrame(animate);
			} else {
				this.animationFrameId = null;
			}
		};

		this.animationFrameId = requestAnimationFrame(animate);
	}

	private handleClick() {
		const { gameInProgress, currentRoundAnswered } = this.getState().gameStatus;
		
		if (gameInProgress && !currentRoundAnswered) {
			this.dispatch(submitRoundAnswer({ selectedGame: this.game }));
		}
	}

	private updateHostClasses() {
		const { currentRoundAnswered } = this.getState().gameStatus;
		
		// Remove all state classes
		this.classList.remove('disabled', 'correct', 'incorrect', 'not-selected', 'selected');

		if (currentRoundAnswered && this.showResult) {
			if (this.isSelected) {
				this.classList.add(this.isCorrect ? 'correct' : 'incorrect');
			} else {
				this.classList.add('not-selected');
			}
		} else if (currentRoundAnswered) {
			this.classList.add('disabled');
		}
	}

	render() {
		this.updateHostClasses();

		return html`
			<div class="game-info" @click=${this.handleClick}>
				<div class="game-image">
					<img 
						src="${this.game.imgUrl}" 
						alt="${this.game.name}"
						@error=${this.handleImageError}
					/>
				</div>
				<div class="game-details">
					<h3>${this.game.name}</h3>
					${this.showResult ? html`
						<div class="rating-display">${this.animatedRating.toFixed(2)}%</div>
					` : html`
						<div class="rating-placeholder"></div>
					`}
				</div>
			</div>
		`;
	}

	private handleImageError(e: Event) {
		const img = e.target as HTMLImageElement;
		const placeholder = document.createElement('div');
		placeholder.className = 'game-image-placeholder';
		placeholder.textContent = this.game.name.split(' ')[0];
		img.parentNode?.replaceChild(placeholder, img);
	}
}

customElements.define('steam-game', GameComponent);
