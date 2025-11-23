import { css, html, LitElement } from "lit";
import { Game, ReduxMixin } from "../../store";
import { property } from "lit/decorators.js";

class MiniRoundSummary extends ReduxMixin(LitElement) {
    @property({ type: Object })
    private gameA?: Game = undefined;

    @property({ type: Object })
    private gameB?: Game = undefined;

    @property({ type: Number })
    private roundIndex: number = 1;

    static styles = css`
        :host {
            margin: 0.5rem;
        }

        .bars-container {
            display: flex;
            flex-direction: row;
            height: 32px;
            width: 100%;
        }

        .bar {
            background-color: #eeeeee;
            transition: flex 0s;
            flex: 0 1 auto;
        }

        .bar-empty {
            animation: shrinkEmpty 1s ease-out forwards;
        }

        .bar-gameA {
            background-color: #007acc;
            flex: 0 0 auto;
        }

        .bar-gameB {
            background-color: #ff5733;
            flex: 0 0 auto;
        }

        .bar-gameA.animating {
            animation: fillGameA 1s ease-out forwards;
        }

        .bar-gameB.animating {
            animation: fillGameB 1s ease-out forwards;
        }

        @keyframes shrinkEmpty {
            from {
                flex: 1 1 auto;
            }
            to {
                flex: 0 1 auto;
            }
        }

        @keyframes fillGameA {
            from {
                flex: 0;
            }
            to {
                flex: var(--game-a-rating);
            }
        }

        @keyframes fillGameB {
            from {
                flex: 0;
            }
            to {
                flex: var(--game-b-rating);
            }
        }

        .round-info {
            display: flex;

            justify-content: space-between;
            font-size: 0.8rem;
            margin-bottom: 0.25rem;
            text-align: center;

            width: 100%;
            font-weight: bold;
            color: #333;
        }
    `;

    updated(changedProperties: Map<string, any>) {
        super.updated(changedProperties);
        
        if (changedProperties.has('GameA') || changedProperties.has('GameB')) {
            const barsContainer = this.shadowRoot?.querySelector('.bars-container');
            if (barsContainer) {
                const coloredBars = barsContainer.querySelectorAll('.bar-gameA, .bar-gameB');
                coloredBars.forEach((bar: Element) => {
                    const htmlBar = bar as HTMLElement;
                    
                    htmlBar.classList.remove('animating');
                    void htmlBar.offsetHeight;
                    htmlBar.classList.add('animating');
                });

                const greyBars = barsContainer.querySelectorAll('.bar-empty');
                greyBars.forEach((bar: Element) => {
                    const htmlBar = bar as HTMLElement;
                    
                    htmlBar.classList.remove('bar-empty');
                    void htmlBar.offsetHeight;
                    htmlBar.classList.add('bar-empty');
                });
            }
        }
    }

    render() {
        const gameARating = this.gameA?.rating || 0;
        const gameBRating = this.gameB?.rating || 0;

        const gameAUrl = `https://store.steampowered.com/app/${this.gameA?.appId}`;
        const gameBUrl = `https://store.steampowered.com/app/${this.gameB?.appId}`;

        return html`
            <span>Round ${this.roundIndex + 1}</span>

            <div class="round-info">
                <div>
                    ${this.gameA?.name}
                </div>

                <div>
                    ${this.gameB?.name}
                </div>
            </div>

            <div class="bars-container">
                <a href="${gameAUrl}" target="_blank" rel="noopener noreferrer">
                    <img src="${this.gameA?.iconUrl}" alt="${this.gameA?.name}" width="32" height="32"/>
                </a>

                <div class="bar bar-empty" style="--empty-a-ratio: ${100 - gameARating};"></div>
                <div class="bar bar-gameA animating" style="--game-a-rating: ${gameARating};"></div>

                <div class="bar bar-gameB animating" style="--game-b-rating: ${gameBRating};"></div>
                <div class="bar bar-empty" style="--empty-b-ratio: ${100 - gameBRating};"></div>

                <a href="${gameBUrl}" target="_blank" rel="noopener noreferrer">
                    <img src="${this.gameB?.iconUrl}" alt="${this.gameB?.name}" width="32" height="32"/>
                </a>
            </div>
        `;
    }
}

customElements.define("mini-round-summary", MiniRoundSummary);