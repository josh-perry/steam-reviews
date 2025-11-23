import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import type { RoundResult } from '../../store/slices/gameStatusSlice';
import './round-indicator';

class ResultsSummary extends LitElement {
    @property({ type: Array })
    declare roundResults: RoundResult[] | boolean[];

    private selectedRoundIndex: number | null = null;

    static styles = css`
        :host {
            display: block;
            margin: 1.5rem 0;
        }

        .results-grid {
            text-align: center;
            margin: 0 auto;
            display: flex;
            gap: 0.5rem;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
        }

        .summary-text {
            margin-top: 1rem;
            font-size: 0.9rem;
            color: #666;
            text-align: center;
        }

        @media (max-width: 768px) {
            .results-grid {
                gap: 0.375rem;
            }
        }

        @media (max-width: 480px) {
            .results-grid {
                gap: 0.25rem;
            }
        }
    `;

    render() {
        if (!this.roundResults) {
            return html``;
        }

        const convertedResults = this.roundResults.map((r) => {
            if (typeof r === 'boolean') {
                return {
                    played: true,
                    isCorrect: r,
                    resultVisible: true,
                    gameA: { appId: 0, name: '', id: 0, rating: 0, reviewCount: 0, imgUrl: '' },
                    gameB: { appId: 0, name: '', id: 0, rating: 0, reviewCount: 0, imgUrl: '' },
                    selectedGame: null,
                    correctGame: { appId: 0, name: '', id: 0, rating: 0, reviewCount: 0, imgUrl: '' }
                } as unknown as RoundResult;
            }
            return r as unknown as RoundResult;
        });

        return html`
            <div class="results-grid">
                ${convertedResults.map((r, index) => html`
                    <round-indicator
                        .roundResult=${r}
                        .roundIndex=${index}
                        .isClickable=${true}
                        .isInModal=${true}>
                    </round-indicator>
                `)}
            </div>
        `;
    }
}

customElements.define('results-summary', ResultsSummary);
