import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ReduxMixin } from '../../store/ReduxMixin';
import type { RoundResult } from '../../store/slices/reviewsGameSlice';
import type { TagsRoundResult } from '../../store/slices/tagsGameSlice';
import './round-indicator';

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

        @media (max-width: 768px) {
            .rounds-display {
                gap: 0.375rem;
            }
        }

        @media (max-width: 480px) {
            .rounds-display {
                gap: 0.25rem;
            }
        }
    `;

    render() {
        if (!this.roundResults) {
            return html``;
        }

        return html`
            <div class="rounds-display">
                ${this.roundResults.map((r, index) => html`
                    <round-indicator
                        .roundResult=${r}
                        .roundIndex=${index}
                    </round-indicator>
                `)}
            </div>
        `;
    }
}

customElements.define('round-indicators', RoundIndicators);
