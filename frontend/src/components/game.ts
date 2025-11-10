import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ReduxMixin } from '../store/ReduxMixin';
import { submitRoundAnswer } from '../store/slices/gameStatusSlice';
import type { Game } from '../store/slices/gameStatusSlice';

class GameComponent extends ReduxMixin(LitElement) {
	@property({ type: Object })
	declare game: Game;

	static styles = css`
		:host {
			display: flex;
			flex: 1;
			min-width: 300px;
			max-width: 500px;
			border: 2px solid #ccc;
			padding: 2rem;
			border-radius: 12px;
			cursor: pointer;
			transition: all 0.3s ease;
			background: white;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		}
		
		:host(:hover) {
			background-color: #f8f9fa;
			border-color: #007acc;
			transform: translateY(-2px);
			box-shadow: 0 4px 16px rgba(0,0,0,0.15);
		}

		:host(.disabled) {
			cursor: not-allowed;
			opacity: 0.6;
			background-color: #f5f5f5;
			border-color: #ddd;
		}

		:host(.disabled:hover) {
			background-color: #f5f5f5;
			border-color: #ddd;
			transform: none;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
			gap: 1rem;
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
		}
		
		.game-details h3 {
			margin: 0 0 1rem 0;
			font-size: 1.5rem;
			color: #333;
		}
	`;

	private handleClick() {
		const { gameInProgress, currentRoundAnswered } = this.getState().gameStatus;
		
		// Only allow clicks if game is in progress and current round hasn't been answered
		if (gameInProgress && !currentRoundAnswered) {
			this.dispatch(submitRoundAnswer({ selectedGame: this.game }));
		}
	}

	render() {
		const { gameInProgress, currentRoundAnswered } = this.getState().gameStatus;
		const isDisabled = !gameInProgress || currentRoundAnswered;
		
		// Add disabled class if buttons should be disabled
		if (isDisabled) {
			this.classList.add('disabled');
		} else {
			this.classList.remove('disabled');
		}

		const imageUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${this.game.appId}/header.jpg`;

		return html`
			<div class="game-info" @click=${this.handleClick}>
				<div class="game-image">
					<img 
						src="${imageUrl}" 
						alt="${this.game.name}"
						@error=${this.handleImageError}
					/>
				</div>
				<div class="game-details">
					<h3>${this.game.name}</h3>
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
