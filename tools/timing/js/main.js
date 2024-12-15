const springTypeSelect = document.querySelector("#spring-type-select");
const springInputFields = document.querySelector("#spring-input-fields");

let spring;
let animator = new Animator(SpringSolver(1, 100, 10, 0));
let currentType;
let currentInputs = {};

function updateURLParams() {
  const urlParams = new URLSearchParams();

  urlParams.set("type", currentType);

  SPRING_INPUT_TYPES[currentType].params.forEach(({ value: paramKey }) => {
    if (currentInputs[paramKey] !== undefined) {
      urlParams.set(paramKey, currentInputs[paramKey]);
    }
  });

  const newURL = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.pushState({ path: newURL }, "", newURL);
}

function loadFromURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get("type");
  if (type && SPRING_INPUT_TYPES[type]) {
    currentType = type;
    springTypeSelect.value = type;
    createInputFields(type);

    SPRING_INPUT_TYPES[type].params.forEach(({ value: paramKey }) => {
      const paramValue = urlParams.get(paramKey);
      if (paramValue !== null) {
        currentInputs[paramKey] = parseFloat(paramValue);
        const slider = springInputFields.querySelector(`input-slider[data-param="${paramKey}"]`);
        if (slider) {
          slider.value = paramValue;
        }
      }
    });

    updateOutputs();
  }
}

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

  const springSolver = SpringSolver(physicalSpring.mass, physicalSpring.stiffness, physicalSpring.damping, physicalSpring.initialVelocity);

  animator.solver = springSolver;

  spring = (() => {
    const { mass, stiffness, damping, initialVelocity } = physicalSpring;
    const dampingRatio = calculateDampingRatio(mass, stiffness, damping);
    const response = convertStiffnessToResponse(stiffness, mass);
    const bounce = convertDampingRatioToBounce(dampingRatio);

    let duration = estimateSpringAnimationDuration(stiffness, dampingRatio, initialVelocity, 1, 0.001);
    duration = Math.min(duration, 99.999);

    let peakTime = calculatePeakTime(mass, stiffness, damping);
    let peakValue = springSolver(peakTime);

    if (dampingRatio >= 1) {
      peakTime = duration;
      peakValue = 1;
    }

    return {
      mass,
      stiffness,
      damping,
      initialVelocity,
      dampingRatio,
      response,
      bounce,
      duration,
      peak: {
        time: peakTime,
        value: peakValue,
      },
    };
  })();

  Object.keys(spring).forEach((key) => {
    const elements = document.querySelectorAll(`span.output-${key}`);
    elements.forEach((element) => {
      element.textContent = spring[key].round();
    });
  });

  drawSpringGraph(springSolver, spring.peak);

  const cssLinear = generateLinearTiming(springSolver, spring.duration * 1000, 0.001);
  document.getElementById("output-css-linear").innerHTML = cssLinear;
}

springTypeSelect.addEventListener("change", (e) => {
  currentType = e.target.value;
  createInputFields(currentType);
  updateOutputs();
  updateURLParams();
});

springInputFields.addEventListener("input", (e) => {
  if (e.target.tagName.toLowerCase() === "input-slider") {
    currentInputs[e.target.dataset.param] = parseFloat(e.target.value);
    updateOutputs();
    updateURLParams();
  }
});

springInputFields.addEventListener("mouseup", (e) => {
  if (e.target.tagName.toLowerCase() === "input-slider") {
    animator.start((value) => {
      previewAnimation(value);
    });
  }
});

springInputFields.addEventListener("mousedown", (e) => {
  if (e.target.tagName.toLowerCase() === "input-slider") {
    animator.stop();
    resetPreviewAnimation();
  }
});

graphContainer.addEventListener("click", () => {
  animator.stop();
  resetPreviewAnimation();
  animator.start((value) => {
    previewAnimation(value);
  });
});

window.addEventListener("popstate", () => {
  loadFromURLParams();
});

initTypeSelector();
if (window.location.search) {
  loadFromURLParams();
} else {
  springTypeSelect.dispatchEvent(new Event("change"));
}
