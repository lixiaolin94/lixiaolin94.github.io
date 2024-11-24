const springTypeSelect = document.querySelector("#spring-type-select");
const springInputFields = document.querySelector("#spring-input-fields");

let currentType;
let currentInputs = {};

function initTypeSelector() {
  const groups = Object.entries(SPRING_INPUT_TYPES).reduce((acc, [key, { group, name }]) => {
    (acc[group] = acc[group] || []).push({ key, name });
    return acc;
  }, {});

  Object.entries(groups).forEach(([label, types]) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = label;

    types.forEach(({ key, name }) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = name;
      optgroup.appendChild(option);
    });

    springTypeSelect.appendChild(optgroup);
  });
}

function createInputFields(type) {
  springInputFields.innerHTML = "";

  SPRING_INPUT_TYPES[type].params.forEach(({ label, min, max, step, defaultValue, value }) => {
    const slider = document.createElement("input-slider");
    slider.setAttribute("label", label);
    slider.setAttribute("min", min);
    slider.setAttribute("max", max);
    slider.setAttribute("step", step);
    slider.setAttribute("value", defaultValue);
    slider.dataset.param = value;

    currentInputs[value] = defaultValue;
    springInputFields.appendChild(slider);
  });
}

function updateOutputs() {
  const physicalSpring = springConverter[currentType](currentInputs);

  drawSpringGraph(physicalSpring);

  const spring = (() => {
    const { mass, stiffness, damping, initialVelocity } = physicalSpring;
    const dampingRatio = calculateDampingRatio(damping, stiffness, mass);
    const response = calculateResponse(stiffness, mass);
    const bounce = 1 - dampingRatio;

    return {
      mass: round(mass),
      stiffness: round(stiffness),
      damping: round(damping),
      initialVelocity: round(initialVelocity),
      dampingRatio: round(dampingRatio),
      response: round(response),
      bounce: round(bounce),
    };
  })();

  Object.keys(spring).forEach((key) => {
    const elements = document.querySelectorAll(`span.output-${key}`);
    elements.forEach((element) => {
      element.textContent = spring[key];
    });
  });
}

springTypeSelect.addEventListener("change", (e) => {
  currentType = e.target.value;
  createInputFields(currentType);
  updateOutputs();
});

springInputFields.addEventListener("input", (e) => {
  if (e.target.tagName.toLowerCase() === "input-slider") {
    currentInputs[e.target.dataset.param] = parseFloat(e.target.value);
    updateOutputs();
  }
});

initTypeSelector();
springTypeSelect.dispatchEvent(new Event("change"));
