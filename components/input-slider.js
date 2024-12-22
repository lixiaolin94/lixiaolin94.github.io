class InputSlider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
      /* Base Styles & Variables */
      :host {
        position: relative;
        height: 2rem;
        padding: 0;
        overflow: hidden;
        box-sizing: border-box;
        font-family: var(--font-mono);
        font-size: 0.875rem;
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-large);
      }

      /* Range Input Styles */
      input[type="range"] {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
        background: none;
        appearance: none;
        -webkit-appearance: none;
        overflow: hidden;
      }

      /* Range Thumb Styles */
      input[type="range"]::-webkit-slider-thumb {
        width: 0;
        appearance: none;
        -webkit-appearance: none;
        box-shadow: -999px 0 0 999px var(--color-border);
      }

      input[type="range"]::-moz-range-thumb {
        box-shadow: -9999px 0 0 calc(9999px - 0.5rem) var(--color-border);
      }

      /* Number Input Styles */
      input[type="number"] {
        position: absolute;
        top: 50%;
        right: 0.75rem;
        transform: translateY(-50%);
        width: 4.5ch;
        font-family: var(--color-font-mono);
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: inherit;
        text-align: right;
        background: none;
        border: none;
        appearance: none;
        -moz-appearance: textfield;
      }

      /* Remove number input spinners */
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        margin: 0;
        -webkit-appearance: none;
      }

      input[type="number"]:focus {
        outline: none;
      }

      /* Label Styles */
      label {
        user-select: none;
        position: absolute;
        top: 50%;
        left: 0.75rem;
        transform: translateY(-50%);
        pointer-events: none;
      }
      </style>
      <input type="range">
      <input type="number">
      <label></label>
    `;

    this.labelElement = this.shadowRoot.querySelector("label");
    this.numberInput = this.shadowRoot.querySelector('input[type="number"]');
    this.rangeInput = this.shadowRoot.querySelector('input[type="range"]');

    this._numberInputTemp = "";

    this.rangeInput.addEventListener("input", (e) => {
      e.stopPropagation();
      this.value = this.rangeInput.value;
      this.dispatchEvent(
        new CustomEvent("input", {
          detail: this.value,
          bubbles: true,
          composed: true,
        })
      );
    });

    this.numberInput.addEventListener("input", (e) => {
      e.stopPropagation();
      this._numberInputTemp = e.target.value;
    });

    this.numberInput.addEventListener("change", (e) => {
      e.stopPropagation();
      if (this._numberInputTemp !== "" && !isNaN(this._numberInputTemp)) {
        this.value = this._numberInputTemp;
        this.dispatchEvent(
          new CustomEvent("input", {
            detail: this.value,
            bubbles: true,
            composed: true,
          })
        );
      }
      this._numberInputTemp = "";
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
