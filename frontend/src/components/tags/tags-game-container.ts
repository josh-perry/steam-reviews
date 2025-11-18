import { LitElement, html, css } from 'lit';
import { ReduxMixin } from '../../store/ReduxMixin';
import { getCurrentGame } from '../../store/slices/tagsGameSlice';
import './tags-game-results-modal';

class TagsGameContainer extends ReduxMixin(LitElement) {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 600px;
            gap: 2rem;
            padding: 1rem;
            box-sizing: border-box;
        }

        @media (max-width: 768px) {
            :host {
                gap: 1.5rem;
                padding: 0.75rem;
            }
        }

        @media (max-width: 480px) {
            :host {
                gap: 1rem;
                padding: 0.5rem;
            }
        }
        `;

    render() {
        const currentGame = getCurrentGame(this.getState());

        if (!currentGame) {
            return html``;
        }

        return html`
            <tags-game-round
            .game=${currentGame}>
            </tags-game-round>
            <tags-game-results-modal></tags-game-results-modal>
        `;
    }
}

customElements.define('tags-game-container', TagsGameContainer);
