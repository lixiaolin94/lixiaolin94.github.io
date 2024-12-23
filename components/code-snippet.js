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
          color: var(--color-accent);
        }

        #header {
          height: 2.25rem;
          padding-inline-start: 1rem;
          padding-inline-end: 0.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--color-muted);
        }

        #title {
          color: var(--color-foreground);
        }

        #right-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        #language{
          user-select: none;
          padding-inline: 0.5rem;
          padding-block: 0.25rem;
          font-size: 0.75rem;
          background-color: var(--color-surface);
          border-radius: var(--radius-small);
        }

        #copy-button {
          width: 1.75rem;
          height: 1.75rem;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: color 0.1s;
        }

        #copy-button:hover {
          color: var(--color-primary);
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
        <div id="left-section">
          <span id="title"></span>
          <a id="api" target="_blank"></a>
        </div>
        <div id="right-section">
          <span id="language"></span>
          <button id="copy-button" title="Copy to clipboard">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
      </div>
      <pre id="content"><code><slot></slot></code></pre>
    `;

    this.titleElement = this.shadowRoot.querySelector("#title");
    this.apiElement = this.shadowRoot.querySelector("#api");
    this.languageElement = this.shadowRoot.querySelector("#language");
    this.copyButton = this.shadowRoot.querySelector("#copy-button");

    this.copyButton.addEventListener("click", async () => {
      const content = this.textContent;
      await navigator.clipboard.writeText(content);

      const originalIcon = this.copyButton.innerHTML;
      this.copyButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 15 2 2 4-4"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

      setTimeout(() => {
        this.copyButton.innerHTML = originalIcon;
      }, 1000);
    });
  }

  static get observedAttributes() {
    return ["title", "api", "link", "language"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    this.updateDisplay();
  }

  updateDisplay() {
    this.titleElement.textContent = this.getAttribute("title") || "";
    this.apiElement.textContent = this.getAttribute("api") || "API";
    this.apiElement.href = this.getAttribute("link") || "#";
    this.languageElement.textContent = this.getAttribute("language") || "c";
  }
}

customElements.define("code-snippet", CodeSnippet);
