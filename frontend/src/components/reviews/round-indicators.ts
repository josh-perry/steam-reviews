import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ReduxMixin } from '../../store/ReduxMixin';
import type { RoundResult } from '../../store/slices/reviewsGameSlice';
import type { TagsRoundResult } from '../../store/slices/tagsGameSlice';

class RoundIndicators extends ReduxMixin(LitElement) {
    @property({ type: Array })
    declare roundResults: RoundResult[] | TagsRoundResult[];

    static styles = css`
        :host {
            display: block;
        }

        .rounds-display {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
        }

        .round-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: 2px solid #e0e0e0;
            background: #f9f9f9;
            transition: all 0.2s ease;
            width: 32px;
            height: 32px;
        }

        .round-indicator.correct {
            background: #d4edda;
            border-color: #28a745;
        }

        .round-indicator.incorrect {
            background: #f8d7da;
            border-color: #dc3545;
        }

        .round-indicator.pending {
            background: #f9f9f9;
            border-color: #e0e0e0;
        }

        @media (max-width: 768px) {
            .rounds-display {
                gap: 0.375rem;
            }
            
            .round-indicator {
                width: 28px;
                height: 28px;
                border-width: 1.5px;
            }
        }

        @media (max-width: 480px) {
            .rounds-display {
                gap: 0.25rem;
            }
            
            .round-indicator {
                width: 24px;
                height: 24px;
                border-width: 1px;
            }
        }
    `;

    render() {
        if (!this.roundResults) {
            return html``;
        }

        const { currentMode } = this.getState().gameMode;
        const gameState = this.getState().reviewsGame;
        
        const { showResultColors, currentRound } = gameState;

        const roundIndicators = this.roundResults.map((r, index) => {
            let className = 'round-indicator';
            
            const isCurrentRound = index === currentRound - 1;
            const shouldShowColors = r.played && r.resultVisible && (isCurrentRound ? showResultColors : true);
            
            if (shouldShowColors) {
                if (r.isCorrect) {
                    className += ' correct';
                } else {
                    className += ' incorrect';
                }
            } else {
                className += ' pending';
            }

            return html`<div class="${className}"></div>`;
        });

        return html`
            <div class="rounds-display">
                ${roundIndicators}
            </div>
        `;
    }
}

customElements.define('round-indicators', RoundIndicators);
