import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import type { RoundResult } from '../store/slices/gameStatusSlice';

class RoundIndicators extends LitElement {
    @property({ type: Array })
    declare roundResults: RoundResult[];

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

        const roundIndicators = this.roundResults.map((r) => {
            let className = 'round-indicator';
            
            if (r.played && r.resultVisible) {
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
