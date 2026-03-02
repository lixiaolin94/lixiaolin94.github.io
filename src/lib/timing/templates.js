import { round } from '$lib/utils/math';

export const outputTemplates = [
	{
		id: 'android-springanimation',
		platform: 'Android',
		language: 'Kotlin',
		api: 'SpringAnimation',
		link: 'https://developer.android.com/reference/kotlin/androidx/dynamicanimation/animation/SpringAnimation',
		render: (s) =>
			`val anim = SpringAnimation(view, DynamicAnimation.TRANSLATION_X, 100f).apply {\n  spring.stiffness = ${round(s.stiffness)}\n  spring.dampingRatio = ${round(s.dampingRatio)}\n  setStartValue(0f)\n}`
	},
	{
		id: 'ios-spring-duration-bounce',
		platform: 'iOS',
		language: 'Swift',
		api: 'Spring(duration:bounce:)',
		link: 'https://developer.apple.com/documentation/swiftui/spring/init(duration:bounce:)',
		render: (s) =>
			`let animation = Animation.spring(duration: ${round(s.response)}, bounce: ${round(s.bounce)})`
	},
	{
		id: 'ios-spring-response-dampingRatio',
		platform: 'iOS',
		language: 'Swift',
		api: 'Spring(response:dampingRatio:)',
		link: 'https://developer.apple.com/documentation/swiftui/spring/init(response:dampingratio:)',
		render: (s) =>
			`let animation = Animation.spring(response: ${round(s.response)}, dampingRatio: ${round(s.dampingRatio)});`
	},
	{
		id: 'ios-spring-mass-stiffness-damping',
		platform: 'iOS',
		language: 'Swift',
		api: 'Spring(mass:stiffness:damping:allowOverDamping:)',
		link: 'https://developer.apple.com/documentation/swiftui/spring/init(mass:stiffness:damping:allowoverdamping:)',
		render: (s) =>
			`let animation = Animation.spring(mass: ${round(s.mass)}, stiffness: ${round(s.stiffness)}, damping: ${round(s.damping)});`
	},
	{
		id: 'ios-caspringanimation',
		platform: 'iOS',
		language: 'Swift',
		api: 'CASpringAnimation',
		link: 'https://developer.apple.com/documentation/quartzcore/caspringanimation',
		render: (s) =>
			`let springAnimation = CASpringAnimation(keyPath: "transform.translation.x")\nspringAnimation.mass = ${round(s.mass)}\nspringAnimation.stiffness = ${round(s.stiffness)}\nspringAnimation.damping = ${round(s.damping)}\nspringAnimation.fromValue = 0\nspringAnimation.toValue = 100\nspringAnimation.duration = springAnimation.settlingDuration\nspringAnimation.isRemovedOnCompletion = false\nspringAnimation.fillMode = .forwards`
	},
	{
		id: 'web-css',
		platform: 'Web',
		language: 'CSS',
		api: 'linear-easing-function',
		link: 'https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function#linear_easing_function',
		render: (s, cssLinear) =>
			`@keyframes spring-animation-keyframes {\n  from { transform: translateX(0px) }\n  to { transform: translateX(100px) }\n}\n\n.spring-animation {\n  animation-name: spring-animation-keyframes;\n  animation-duration: ${round(s.duration)}s;\n  animation-timing-function: ${cssLinear};\n  animation-fill-mode: forwards;\n}`
	},
	{
		id: 'web-framer-duration',
		platform: 'Web',
		language: 'JSX',
		api: 'framer-motion',
		link: 'https://motion.dev/docs/react-transitions#spring',
		render: (s) =>
			`import { motion } from "framer-motion"\n\nexport default function AnimatedComponent() {\n  return (\n    <motion.div\n      initial={{ x: 0 }}\n      animate={{ x: 100 }}\n      transition={{\n        type: "spring",\n        duration: ${round(s.response)},\n        bounce: ${round(s.bounce)},\n      }}\n      style={{\n        width: 100,\n        height: 100,\n        background: "blue",\n      }}\n    />\n  )\n}`
	},
	{
		id: 'web-framer-physical',
		platform: 'Web',
		language: 'JSX',
		api: 'framer-motion',
		link: 'https://motion.dev/docs/react-transitions#spring',
		render: (s) =>
			`import { motion } from "framer-motion"\n\nexport default function AnimatedComponent() {\n  return (\n    <motion.div\n      initial={{ x: 0 }}\n      animate={{ x: 100 }}\n      transition={{\n        type: "spring",\n        mass: ${round(s.mass)},\n        stiffness: ${round(s.stiffness)},\n        damping: ${round(s.damping)},\n      }}\n      style={{\n        width: 100,\n        height: 100,\n        background: "blue",\n      }}\n    />\n  )\n}`
	},
	{
		id: 'web-react-spring-friendly',
		platform: 'Web',
		language: 'JSX',
		api: '@react-spring/web',
		link: 'https://www.react-spring.dev/docs/components/use-spring',
		render: (s) =>
			`import { useSpring, animated } from '@react-spring/web'\n\nexport default function MyComponent() {\n  const springs = useSpring({\n    from: { x: 0 },\n    to: { x: 100 },\n    config: {\n      frequency: ${round(s.response)},\n      damping: ${round(s.dampingRatio)},\n    },\n  })\n\n  return (\n    <animated.div\n      style={{\n        width: 100,\n        height: 100,\n        background: 'blue',\n        ...springs,\n      }}\n    />\n  )\n}`
	},
	{
		id: 'web-react-spring-physical',
		platform: 'Web',
		language: 'JSX',
		api: '@react-spring/web',
		link: 'https://www.react-spring.dev/docs/components/use-spring',
		render: (s) =>
			`import { useSpring, animated } from '@react-spring/web'\n\nexport default function MyComponent() {\n  const springs = useSpring({\n    from: { x: 0 },\n    to: { x: 100 },\n    config: {\n      mass: ${round(s.mass)},\n      tension: ${round(s.stiffness)},\n      friction: ${round(s.damping)},\n    },\n  })\n\n  return (\n    <animated.div\n      style={{\n        width: 100,\n        height: 100,\n        background: 'blue',\n        ...springs,\n      }}\n    />\n  )\n}`
	}
];
