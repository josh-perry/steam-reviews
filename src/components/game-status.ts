import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ReduxMixin } from '../store/ReduxMixin';

class GameStatus extends ReduxMixin(LitElement) {
    @property({ type: Object })
    declare gameStatus: any;

    static styles = css`
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1rem;
        }

        .status-container {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 16px;
            padding: 1.5rem 2rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            text-align: center;
            min-width: 300px;
        }

        .score-info {
            margin-top: 1rem;
            font-size: 1rem;
            color: #666;
        }

        .current-round {
            font-weight: bold;
            color: #007acc;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.gameStatus = this.getState().gameStatus;
    }

    updated() {
        this.gameStatus = this.getState().gameStatus;
    }

    render() {
        const state = this.getState();
        const gameStatus = state.gameStatus;

        if (!gameStatus || !gameStatus.gameInProgress) {
            return html``;
        }

        return html`
            <div class="status-container">
                <round-indicators 
                    .roundResults=${gameStatus.roundResults}>
                </round-indicators>
                <div class="score-info">
                    <span class="current-round">Round ${gameStatus.currentRound}/${gameStatus.totalRounds}</span>
                </div>
            </div>
        `;
    }
}

customElements.define('game-status', GameStatus);
