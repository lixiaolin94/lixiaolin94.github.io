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
    name: "Framer [Duration]",
    group: "API",
    params: [
      { label: "Duration", value: "response", defaultValue: 0.8, min: 0, max: 5, step: 0.1 },
      { label: "Bounce", value: "bounce", defaultValue: 0.25, min: -1, max: 1, step: 0.01 },
    ],
  },
  "framer-physical": {
    name: "Framer [Physical]",
    group: "API",
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

document.getElementById("spring-output-android-springanimation").innerHTML = `val anim = SpringAnimation(view, DynamicAnimation.TRANSLATION_X, 100f).apply {
  spring.stiffness = <span class="output-args output-stiffness"></span>
  spring.dampingRatio = <span class="output-args output-dampingRatio"></span>
  setStartValue(0f)
}`;

document.getElementById("spring-output-ios-spring-duration-bounce").innerHTML = `let animation = Animation.spring(duration: <span class="output-args output-response"></span>, bounce: <span class="output-args output-bounce"></span>)`;

document.getElementById("spring-output-ios-spring-response-dampingRatio").innerHTML = `let animation = Animation.spring(response: <span class="output-args output-response"></span>, dampingRatio: <span class="output-args output-dampingRatio"></span>);`;

document.getElementById("spring-output-ios-spring-mass-stiffness-damping").innerHTML = `let animation = Animation.spring(mass: <span class="output-args output-mass"></span>, stiffness: <span class="output-args output-stiffness"></span>, damping: <span class="output-args output-damping"></span>);`;

document.getElementById("spring-output-ios-caspringanimation").innerHTML = `let springAnimation = CASpringAnimation(keyPath: "transform.translation.x")
springAnimation.mass = <span class="output-args output-mass"></span>
springAnimation.stiffness = <span class="output-args output-stiffness"></span>
springAnimation.damping = <span class="output-args output-damping"></span>
springAnimation.fromValue = 0
springAnimation.toValue = 100
springAnimation.duration = springAnimation.settlingDuration
springAnimation.isRemovedOnCompletion = false
springAnimation.fillMode = .forwards`;

// document.getElementById("spring-output-web-css").innerHTML = `@keyframes spring-animation-keyframes {
//   from { transform: translateX(0px) }
//   to { transform: translateX(100px) }
// }

// .spring-animation {
//   animation-name: spring-animation-keyframes;
//   animation-duration: <span class="output-args"><span class="output-response"></span>s</span>;
//   animation-timing-function: linear(0 0%, 0.5 50%, 1 100%);
//   animation-fill-mode: forwards;
// }`;

document.getElementById("spring-output-web-framer-duration").innerHTML = `import { motion } from "framer-motion"

export default function AnimatedComponent() {
  return (
    &lt;motion.div
      initial={{ x: 0 }}
      animate={{ x: 100 }}
      transition={{
        type: "spring",
        duration: <span class="output-args output-response"></span>,
        bounce: <span class="output-args output-bounce"></span>,
      }}
      style={{
        width: 100,
        height: 100,
        background: "blue",
      }}
    /&gt;
  )
}`;

document.getElementById("spring-output-web-framer-physical").innerHTML = `import { motion } from "framer-motion"

export default function AnimatedComponent() {
  return (
    &lt;motion.div
      initial={{ x: 0 }}
      animate={{ x: 100 }}
      transition={{
        type: "spring",
        mass: <span class="output-args output-mass"></span>,
        stiffness: <span class="output-args output-stiffness"></span>,
        damping: <span class="output-args output-damping"></span>,
      }}
      style={{
        width: 100,
        height: 100,
        background: "blue",
      }}
    /&gt;
  )
}`;

document.getElementById("spring-output-web-react-spring-friendly").innerHTML = document.getElementById("spring-output-web-react-spring-physical").innerHTML = `import { useSpring, animated } from '@react-spring/web'

export default function MyComponent() {
  const springs = useSpring({
    from: { x: 0 },
    to: { x: 100 },
    config: {
      mass: <span class="output-args output-mass"></span>,
      tension: <span class="output-args output-stiffness"></span>,
      friction: <span class="output-args output-damping"></span>,
    },
  })

  return (
    &lt;animated.div
      style={{
        width: 100,
        height: 100,
        background: 'blue',
        ...springs,
      }}
    /&gt
  )
}`;

document.getElementById("spring-output-web-react-spring-physical").innerHTML = document.getElementById("spring-output-web-react-spring-physical").innerHTML = `import { useSpring, animated } from '@react-spring/web'

export default function MyComponent() {
  const springs = useSpring({
    from: { x: 0 },
    to: { x: 100 },
    config: {
      frequency: <span class="output-args output-response"></span>,
      damping: <span class="output-args output-dampingRatio"></span>,
    },
  })

  return (
    &lt;animated.div
      style={{
        width: 100,
        height: 100,
        background: 'blue',
        ...springs,
      }}
    /&gt
  )
}`;
