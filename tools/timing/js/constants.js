const DPR = window.devicePixelRatio || 1;

const LINE_WIDTH = DPR;

const SPRING_INPUT_TYPES = {
  "origami-studio": {
    name: "Origami Studio",
    group: "Design Tool",
    params: [
      { label: "Speed", value: "speed", defaultValue: 10, min: 0, max: 100, step: 0.1 },
      { label: "Bounciness", value: "bounciness", defaultValue: 5, min: 0, max: 100, step: 0.1 },
    ],
  },
  "figma": {
    name: "Figma",
    group: "Design Tool",
    params: [
      { label: "Mass", value: "mass", defaultValue: 1, min: 0.1, max: 10, step: 0.1 },
      { label: "Stiffness", value: "stiffness", defaultValue: 100, min: 1, max: 2000, step: 1 },
      { label: "Damping", value: "damping", defaultValue: 15, min: 0, max: 100, step: 0.1 },
    ],
  },
  "principle": {
    name: "Principle",
    group: "Design Tool",
    params: [
      { label: "Tension", value: "stiffness", defaultValue: 100, min: 1, max: 2000, step: 1 },
      { label: "Friction", value: "damping", defaultValue: 10, min: 0, max: 100, step: 0.1 },
    ],
  },
  "protopie": {
    name: "ProtoPie",
    group: "Design Tool",
    params: [
      { label: "Tension", value: "stiffness", defaultValue: 100, min: 1, max: 2000, step: 1 },
      { label: "Friction", value: "damping", defaultValue: 10, min: 0, max: 100, step: 0.1 },
    ],
  },
  "framer-time": {
    name: "Framer [Time]",
    group: "Design Tool",
    params: [
      { label: "Time", value: "response", defaultValue: 0.8, min: 0, max: 5, step: 0.1 },
      { label: "Bounce", value: "bounce", defaultValue: 0.25, min: -1, max: 1, step: 0.01 },
    ],
  },
  "framer-physical": {
    name: "Framer [Physical]",
    group: "Design Tool",
    params: [
      { label: "Mass", value: "mass", defaultValue: 1, min: 0.1, max: 10, step: 0.1 },
      { label: "Stiffness", value: "stiffness", defaultValue: 100, min: 1, max: 2000, step: 1 },
      { label: "Damping", value: "damping", defaultValue: 10, min: 0, max: 100, step: 0.1 },
    ],
  },
  "react-spring-friendly": {
    name: "React Spring [Friendly]",
    group: "API",
    params: [
      { label: "friction", value: "response", defaultValue: 0.5, min: 0, max: 5, step: 0.1 },
      { label: "damping", value: "dampingRatio", defaultValue: 1, min: 0, max: 2, step: 0.01 },
    ],
  },
  "react-spring-physical": {
    name: "React Spring [Physical]",
    group: "API",
    params: [
      { label: "Mass", value: "mass", defaultValue: 1, min: 0.1, max: 10, step: 0.1 },
      { label: "Stiffness", value: "stiffness", defaultValue: 100, min: 1, max: 2000, step: 1 },
      { label: "Damping", value: "damping", defaultValue: 10, min: 0, max: 100, step: 0.1 },
    ],
  },
  "android-springanimation": {
    name: "Android [SpringAnimation]",
    group: "API",
    params: [
      { label: "stiffness", value: "stiffness", defaultValue: 100, min: 1, max: 2000, step: 1 },
      { label: "dampingRatio", value: "dampingRatio", defaultValue: 1, min: 0, max: 2, step: 0.01 },
    ],
  },
  "ios-spring-duration-bounce": {
    name: "iOS [Spring(duration:bounce:)]",
    group: "API",
    params: [
      { label: "duration", value: "response", defaultValue: 0.5, min: 0, max: 5, step: 0.1 },
      { label: "bounce", value: "bounce", defaultValue: 0, min: -1, max: 1, step: 0.01 },
    ],
  },
  "ios-spring-response-dampingratio": {
    name: "iOS [Spring(response:dampingRatio)]",
    group: "API",
    params: [
      { label: "response", value: "response", defaultValue: 0.5, min: 0, max: 5, step: 0.1 },
      { label: "dampingRatio", value: "dampingRatio", defaultValue: 1, min: 0, max: 2, step: 0.01 },
    ],
  },
  "ios-spring-mass-stiffness-damping": {
    name: "iOS [Spring(mass:stiffness:damping:)]",
    group: "API",
    params: [
      { label: "mass", value: "mass", defaultValue: 1, min: 0.1, max: 10, step: 0.1 },
      { label: "stiffness", value: "stiffness", defaultValue: 100, min: 1, max: 2000, step: 1 },
      { label: "damping", value: "damping", defaultValue: 10, min: 0, max: 100, step: 0.1 },
    ],
  },
};
