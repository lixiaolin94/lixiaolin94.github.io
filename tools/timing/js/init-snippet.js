document.getElementById("spring-output-android-springanimation").innerHTML = `val anim = SpringAnimation(view, DynamicAnimation.TRANSLATION_X, 0f).apply {
  spring.stiffness = <span class="output-args output-stiffness"></span>
  spring.dampingRatio = <span class="output-args output-dampingRatio"></span>
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

document.getElementById("spring-output-web-css").innerHTML = `@keyframes spring-animation-keyframes {
  from { transform: translateX(0px) }
  to { transform: translateX(100px) }
}

.spring-animation {
  animation-name: spring-animation-keyframes;
  animation-duration: <span class="output-args"><span class="output-response"></span>s</span>;
  animation-timing-function: linear(0 0%, 0.5 50%, 1 100%);
  animation-fill-mode: forwards;
}`;

document.getElementById("spring-output-web-framer-time").innerHTML = `import { motion } from "framer-motion"

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
