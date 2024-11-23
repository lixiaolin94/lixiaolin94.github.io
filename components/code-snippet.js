class CodeSnippet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          overflow: hidden;
          font-family: var(--font-mono);
          font-size: 0.875rem;
        }
        a {
          color: inherit;
        }
        #header {
          height: 2.25rem;
          padding-inline: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: hsl(var(--secondary));
          border-bottom: 1px solid hsl(var(--border));
        }
        #content{
          margin: 1rem;
          line-height: 1.5;
          overflow-x: auto;
        }
      </style>
      <div id="header">
        <span id="language"></span>
        <a id="api" target="_blank"></a>
      </div>
      <pre id="content"><code><slot></slot></code></pre>
    `;

    this.languageElement = this.shadowRoot.querySelector("#language");
    this.apiElement = this.shadowRoot.querySelector("#api");
  }

  static get observedAttributes() {
    return ["language", "api", "link"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    this.updateDisplay();
  }

  updateDisplay() {
    this.languageElement.textContent = this.getAttribute("language") || "c";
    this.apiElement.textContent = this.getAttribute("api") || "API";
    this.apiElement.href = this.getAttribute("link") || "#";
  }
}

customElements.define("code-snippet", CodeSnippet);
