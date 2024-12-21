class CodeSnippet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          overflow: hidden;
          font-family: var(--font-mono);
          font-size: 0.875rem;
          border-radius: var(--radius-large);
          border: 1px solid var(--color-border);
          background-color: var(--color-surface);
          color: var(--color-muted-foreground);
        }
        a {
          display: inline-block;
          padding: 0.4rem 0.6rem;
          color: var(--color-accent);
        }
        #header {
          height: 2.25rem;
          padding-inline-start: 0.2rem;
          padding-inline-end: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        #content{
          margin: 0;
          padding: 1rem;
          line-height: 1.5;
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        #content::-webkit-scrollbar {
          display: none;
        }
      </style>
      <div id="header">
        <a id="api" target="_blank"></a>
        <span id="language"></span>
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
