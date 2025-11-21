import { LitElement, html, css } from "lit";
import { ReduxMixin } from "../store";
import { property } from "lit/decorators.js";

class AutoCompleteTextbox extends ReduxMixin(LitElement) {
    @property({ type: String })
    private placeholder = "Start typing...";

    @property({ type: Array })
    private suggestions: string[] = [];

    private selectedSuggestionIndex: number | null = null;

    private matchingSuggestions: string[] = [];

    static styles = css`
		.input-container {
			display: flex;
			gap: 0.5rem;
			position: relative;
		}

        input {
			flex: 1;
			padding: 0.75rem;
			font-size: 1.1rem;
			border: 2px solid #ccc;
			border-radius: 8px;
			transition: border-color 0.3s;
		}

		input:focus {
			outline: none;
			border-color: #007acc;
		}

		input:disabled {
			background: #f5f5f5;
			cursor: not-allowed;
		}

        .suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ccc;
            border-radius: 8px;
            background: white;
            z-index: 1000;
            margin-top: 0.25rem;
        }

        .suggestion {
            padding: 0.5rem;
            cursor: pointer;
        }

        .suggestion:hover {
            background-color: #f0f0f0;
        }

        .suggestion.selected {
            background-color: #007acc;
            color: white;
        }
    `;

    handleInputChange(e: Event) {
        const input = e.target as HTMLInputElement;
        const value = input.value;

        if (value.trim() === "") {
            this.matchingSuggestions = [];
            this.selectedSuggestionIndex = null;
            this.requestUpdate();

            return;
        }

        this.matchingSuggestions = this.suggestions.filter(suggestion =>
            suggestion.toLowerCase().includes(value.toLowerCase())
        );

        this.selectedSuggestionIndex = null;
        this.requestUpdate();
    }

    submit(value: string) {
        if (!this.suggestions.includes(value)) {
            return;
        }

        this.dispatchEvent(new CustomEvent('submit', { 
            detail: { value },
            composed: true,
            bubbles: true
        }));

        const input = this.shadowRoot!.querySelector("input")!;
        input.value = "";

        this.matchingSuggestions = [];
        this.selectedSuggestionIndex = null;

        this.requestUpdate();
    }

    onKeyDown(e: KeyboardEvent) {
        const input = this.shadowRoot!.querySelector("input")!;

        if (e.key === "ArrowDown") {
            if (this.selectedSuggestionIndex === null) {
                this.selectedSuggestionIndex = 0;
            } else if (this.selectedSuggestionIndex < this.matchingSuggestions.length - 1) {
                this.selectedSuggestionIndex++;
            }

            this.requestUpdate();
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            if (this.selectedSuggestionIndex !== null && this.selectedSuggestionIndex > 0) {
                this.selectedSuggestionIndex--;
                this.requestUpdate();
            }

            e.preventDefault();
        } else if (e.key === "Enter") {
            if (this.selectedSuggestionIndex !== null) {
                const selectedSuggestion = this.matchingSuggestions[this.selectedSuggestionIndex];
                input.value = selectedSuggestion;
                this.matchingSuggestions = [];
                this.selectedSuggestionIndex = null;

                this.requestUpdate();
                e.preventDefault();
            } else {
                this.submit(input.value);
            }
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener("keydown", this.onKeyDown.bind(this));
    }

    render() {
        return html`
            <div class="input-container">
                <input type="text" placeholder="${this.placeholder}" @input=${this.handleInputChange}/>
                <div class="suggestions" ?hidden=${this.matchingSuggestions.length === 0}>
                    ${this.matchingSuggestions.map((suggestion, index) => html`
                        <div class="suggestion ${this.selectedSuggestionIndex === index ? 'selected' : ''}" @click=${() => this.submit(suggestion)}>
                            ${suggestion}
                        </div>
                    `)}
                </div>
            </div>
        `;
    }
}

customElements.define("auto-complete-textbox", AutoCompleteTextbox);