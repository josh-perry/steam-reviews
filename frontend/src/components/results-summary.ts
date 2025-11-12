import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import type { RoundResult } from '../store/slices/gameStatusSlice';

class ResultsSummary extends LitElement {
    @property({ type: Array })
    declare roundResults: RoundResult[] | boolean[];

    static styles = css`
        :host {
            display: block;
            margin: 1.5rem 0;
        }

        .results-grid {
            text-align: center;
            margin: 0 auto;
            font-size: 2rem;
            line-height: 1;
        }

        .summary-text {
            margin-top: 1rem;
            font-size: 0.9rem;
            color: #666;
            text-align: center;
        }
    `;

    render() {
        if (!this.roundResults) {
            return html``;
        }

        const emojiString = this.roundResults.map((r, _) => {
            if (typeof r === 'boolean') {
                return r ? '🟩' : '🟥';
            }
            
            let emoji = '⬛';
            
            if (r.played) {
                if (r.isCorrect) {
                    emoji = '🟩';
                } else {
                    emoji = '🟥';
                }
            }

            return emoji;
        }).join('');

        return html`
            <div class="results-grid">${emojiString}</div>
        `;
    }
}

customElements.define('results-summary', ResultsSummary);
