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

        .status-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 1rem;
        }

        .rounds-display {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
        }

        .round-indicator {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            border-radius: 50%;
            border: 2px solid #e0e0e0;
            background: #f9f9f9;
        }

        .round-indicator.correct {
            background: #d4edda;
            border-color: #28a745;
        }

        .round-indicator.incorrect {
            background: #f8d7da;
            border-color: #dc3545;
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

        const roundIndicators = gameStatus.roundResults.map((r) => {
            let className = 'round-indicator';
            
            if (r.played) {
                if (r.isCorrect) {
                    className += ' correct';
                } else {
                    className += ' incorrect';
                }
            }

            return html`<div class="${className}"></div>`;
        });

        return html`
            <div class="status-container">
                <div class="rounds-display">
                    ${roundIndicators}
                </div>
                <div class="score-info">
                    <span class="current-round">Round ${gameStatus.currentRound}/${gameStatus.totalRounds}</span>
                </div>
            </div>
        `;
    }
}

customElements.define('game-status', GameStatus);
