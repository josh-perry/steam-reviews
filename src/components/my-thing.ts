import { LitElement, html } from 'lit-element';

class MyThing extends LitElement {
	render() {
		return html`
		<div>hello there gamers</div>
		`;
	}
}

customElements.define('my-thing', MyThing);
