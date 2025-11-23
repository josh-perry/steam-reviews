import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ReduxMixin } from '../../store/ReduxMixin';
import { jumpToRound, setSelectedResultRound } from '../../store/slices/reviewsGameSlice';
import type { RoundResult } from '../../store/slices/reviewsGameSlice';
import type { TagsRoundResult } from '../../store/slices/tagsGameSlice';

class RoundIndicator extends ReduxMixin(LitElement) {
    @property({ type: Object })
    declare roundResult: RoundResult | TagsRoundResult;

    @property({ type: Number })
    declare roundIndex: number;

    @property({ type: Boolean })
    declare isClickable: boolean;

    @property({ type: Boolean })
    declare isInModal: boolean;

    static styles = css`
        :host {
            display: inline-flex;
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

        .round-indicator.current {
            background: white;
            border-color: #007acc;
            border-width: 3px;
        }

        .round-indicator.clickable {
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .round-indicator.clickable:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .round-indicator.clickable.correct:hover {
            background: #c3e6cd;
            border-color: #20c997;
        }

        .round-indicator.clickable.incorrect:hover {
            background: #f5c6cb;
            border-color: #e74c3c;
        }

        .round-indicator.non-clickable {
            cursor: not-allowed;
            opacity: 0.6;
        }

        @media (max-width: 768px) {
            .round-indicator {
                width: 28px;
                height: 28px;
                border-width: 1.5px;
            }

            .round-indicator.clickable:hover {
                transform: scale(1.1);
            }
        }

        @media (max-width: 480px) {
            .round-indicator {
                width: 24px;
                height: 24px;
                border-width: 1px;
            }

            .round-indicator.clickable:hover {
                transform: scale(1.08);
            }
        }
    `;

    render() {
        const gameState = this.getState().reviewsGame;
        const { showResultColors, currentRound, gameComplete } = gameState;
        
        const nextUnplayedRound = this.getState().reviewsGame.roundResults.findIndex(r => !r.played) + 1;
        const isCurrentRound = this.roundIndex === currentRound - 1;
        const isNextRound = this.roundIndex === nextUnplayedRound - 1;
        
        const shouldShowColors = this.roundResult.played && (
            !isCurrentRound || (this.roundResult.resultVisible && showResultColors)
        );

        let className = 'round-indicator';

        if (shouldShowColors) {
            if (this.roundResult.isCorrect) {
                className += ' correct';
            } else {
                className += ' incorrect';
            }
        } else {
            className += ' pending';
        }

        if (isNextRound && !shouldShowColors && this.roundResult.played === false) {
            className += ' current';
        }

        if (this.isClickable) {
            className += ' clickable';
        } else {
            className += ' non-clickable';
        }

        return html`
            <div 
                class="${className}"
                @click="${this.handleClick}"
            ></div>
        `;
    }

    private handleClick(): void {
        if (this.isClickable) {
            if (this.isInModal) {
                this.dispatch(setSelectedResultRound(this.roundIndex + 1));
            } else {
                this.dispatch(jumpToRound(this.roundIndex + 1));
            }
        }
    }
}

customElements.define('round-indicator', RoundIndicator);
