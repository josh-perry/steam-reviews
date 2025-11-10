import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../store/ReduxMixin';
import { getCurrentRoundData, proceedToNextRound, showRoundResult } from '../store/slices/gameStatusSlice';
import { ImagePreloader } from '../services/imagePreloader';

class ReviewResults extends ReduxMixin(LitElement) {
	private gameAPercentage = 0;
	private gameBPercentage = 0;
	private animationDuration = 1500;
	private animationComplete = false;

	static styles = css`
		:host {
			display: flex;
			gap: 2rem;
			width: 100%;
			max-width: 1200px;
			justify-content: center;
			align-items: stretch;
		}

		.game-result {
			display: flex;
			flex: 1;
			min-width: 300px;
			max-width: 500px;
			border: 2px solid #ccc;
			padding: 2rem;
			border-radius: 12px;
			background: white;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
			flex-direction: column;
			align-items: center;
			text-align: center;
			gap: 1rem;
		}

		.game-result.correct {
			border-color: #28a745;
			background-color: #d4edda;
		}

		.game-result.incorrect {
			border-color: #dc3545;
			background-color: #f8d7da;
		}

		.game-result.not-selected {
			opacity: 0.7;
		}

		.game-image {
			width: 100%;
			height: 200px;
			border-radius: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 2px 8px rgba(0,0,0,0.2);
			flex-shrink: 0;
			overflow: hidden;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
			min-height: 140px; /* Reserve space for title + rating info + result indicator */
			display: flex;
			flex-direction: column;
		}

		.game-details h3 {
			margin: 0 0 1rem 0;
			font-size: 1.5rem;
			color: #333;
		}

		.rating-display {
			font-size: 2rem;
			font-weight: bold;
			color: #007acc;
			margin: 0.5rem 0;
		}

		.rating-label {
			font-size: 1rem;
			color: #666;
			margin-bottom: 0.5rem;
		}

		.result-indicator {
			font-size: 1.2rem;
			font-weight: bold;
			margin-top: 0.5rem;
		}

		.result-indicator.correct {
			color: #28a745;
		}

		.result-indicator.incorrect {
			color: #dc3545;
		}
	`;

	connectedCallback() {
		super.connectedCallback();

		this.startPercentageAnimations();
		this.preloadNextRoundImages();

		setTimeout(() => {
			this.dispatch(proceedToNextRound());
		}, 3000);
	}

	private async preloadNextRoundImages() {
		const state = this.getState().gameStatus;
		const nextRoundIndex = state.currentRound;
		
		if (nextRoundIndex < state.preGeneratedRounds.length) {
			const nextRound = state.preGeneratedRounds[nextRoundIndex];
			const imagePreloader = ImagePreloader.getInstance();
			
			await imagePreloader.preloadNextRoundImages([
				nextRound.gameA.appId,
				nextRound.gameB.appId
			]);
		}
	}

	private startPercentageAnimations() {
		const state = this.getState().gameStatus;
		const currentRound = getCurrentRoundData(this.getState());
		
		if (!currentRound) return;

		const targetGameA = currentRound.gameA.rating;
		const targetGameB = currentRound.gameB.rating;

		const startTime = performance.now();

		const animate = (currentTime: number) => {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / this.animationDuration, 1);

			const easeOut = 1 - Math.pow(1 - progress, 3);

			this.gameAPercentage = parseFloat((targetGameA * easeOut).toFixed(2));
			this.gameBPercentage = parseFloat((targetGameB * easeOut).toFixed(2));

			this.requestUpdate();

			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				this.animationComplete = true;
				this.dispatch(showRoundResult());
				this.requestUpdate();
			}
		};

		requestAnimationFrame(animate);
	}

	private handleImageError(e: Event, gameName: string) {
		const img = e.target as HTMLImageElement;
		const placeholder = document.createElement('div');
		placeholder.className = 'game-image-placeholder';
		placeholder.textContent = gameName.split(' ')[0];
		img.parentNode?.replaceChild(placeholder, img);
	}

	render() {
		const state = this.getState().gameStatus;
		const currentRound = getCurrentRoundData(this.getState());
		
		if (!currentRound || !state.showingResults) {
			return html``;
		}

		const currentRoundResult = state.roundResults[state.currentRound - 1];
		const selectedGameId = currentRoundResult?.selectedGame?.appId;

		const gameASelected = selectedGameId === currentRound.gameA.appId;
		const gameBSelected = selectedGameId === currentRound.gameB.appId;
		const correctGameId = currentRound.correctGame.appId;

		let gameAClass = 'game-result';
		let gameBClass = 'game-result';

		if (this.animationComplete) {
			if (gameASelected) {
				gameAClass += correctGameId === currentRound.gameA.appId ? ' correct' : ' incorrect';
			} else {
				gameAClass += ' not-selected';
			}

			if (gameBSelected) {
				gameBClass += correctGameId === currentRound.gameB.appId ? ' correct' : ' incorrect';
			} else {
				gameBClass += ' not-selected';
			}
		}

		return html`
			<div class="${gameAClass}">
				<div class="game-image">
					<img 
						src="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${currentRound.gameA.appId}/header.jpg" 
						alt="${currentRound.gameA.name}"
						@error=${(e: Event) => this.handleImageError(e, currentRound.gameA.name)}
					/>
				</div>
				<div class="game-details">
					<h3>${currentRound.gameA.name}</h3>
					<div class="rating-display">${this.gameAPercentage.toFixed(2)}%</div>
				</div>
			</div>

			<div class="${gameBClass}">
				<div class="game-image">
					<img 
						src="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${currentRound.gameB.appId}/header.jpg" 
						alt="${currentRound.gameB.name}"
						@error=${(e: Event) => this.handleImageError(e, currentRound.gameB.name)}
					/>
				</div>
				<div class="game-details">
					<h3>${currentRound.gameB.name}</h3>
					<div class="rating-display">${this.gameBPercentage.toFixed(2)}%</div>
				</div>
			</div>
		`;
	}
}

customElements.define('review-results', ReviewResults);