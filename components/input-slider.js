class InputSlider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        /********** Input Range **********/
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
          outline: none;
          overflow: hidden;
          border-radius: 9999px;
        }

        /* track */
        input[type="range"]::-webkit-slider-runnable-track {
          height: 100%;
          border-radius: 9999px;
          background-color: hsl(var(--primary) / 0.2);
        }

        input[type="range"]::-moz-range-track {
          height: 100%;
          border-radius: 9999px;
          background-color: hsl(var(--primary) / 0.2);
        }

        /* thumb */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;

          width: 1rem;
          height: 1rem;
          border: 1px solid hsl(var(--primary) / 0.5);
          border-radius: 50%;
          background-color: hsl(var(--background));
          box-shadow: -999px 0 0 calc(999px - 0.5rem) hsl(var(--primary));
        }

        input[type="range"]::-moz-range-thumb {
          width: 1rem;
          height: 1rem;
          border: 1px solid hsl(var(--primary) / 0.5);
          border-radius: 50%;
          background-color: hsl(var(--background));

          box-shadow: -9999px 0 0 calc(9999px - 0.5rem) hsl(var(--primary));
        }

        /********** Input Number **********/

        input[type="number"] {
          appearance: none;

          width: 6rem;
          font-family: var(--font-mono);
          border: 1px solid hsl(var(--input));
          border-radius: var(--radius);

          padding-block: 0.5rem;
          padding-inline: 0.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          color: inherit;
        }

        input[type="number"]:focus {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 1px;
        }

        /********** Layout **********/

        :host {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        #wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      </style>
      <div id="wrapper">
        <label></label>
        <input type="number">
      </div>
      <input type="range">
    `;

    this.labelElement = this.shadowRoot.querySelector("label");
    this.numberInput = this.shadowRoot.querySelector('input[type="number"]');
    this.rangeInput = this.shadowRoot.querySelector('input[type="range"]');

    this.rangeInput.addEventListener("input", () => {
      this.value = this.rangeInput.value;
    });

    this.numberInput.addEventListener("change", () => {
      this.value = this.numberInput.value;
    });
  }

  static get observedAttributes() {
    return ["label", "value", "min", "max", "step"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    this.updateView();
  }

  updateView() {
    this.labelElement.textContent = this.getAttribute("label") || "";
    this.value = this.getAttribute("value") || "0";
    this.min = this.getAttribute("min") || "0";
    this.max = this.getAttribute("max") || "100";
    this.step = this.getAttribute("step") || "1";

    this.numberInput.value = this.value;
    this.rangeInput.value = this.value;
    this.numberInput.min = this.min;
    this.numberInput.max = this.max;
    this.numberInput.step = this.step;
    this.rangeInput.min = this.min;
    this.rangeInput.max = this.max;
    this.rangeInput.step = this.step;
  }

  get value() {
    return this.getAttribute("value");
  }

  set value(val) {
    this.setAttribute("value", val);
    this.numberInput.value = val;
    this.rangeInput.value = val;
    this.dispatchEvent(new CustomEvent("change", { detail: val }));
  }

  get min() {
    return this.getAttribute("min");
  }

  set min(val) {
    this.setAttribute("min", val);
  }

  get max() {
    return this.getAttribute("max");
  }

  set max(val) {
    this.setAttribute("max", val);
  }

  get step() {
    return this.getAttribute("step");
  }

  set step(val) {
    this.setAttribute("step", val);
  }
}

customElements.define("input-slider", InputSlider);
