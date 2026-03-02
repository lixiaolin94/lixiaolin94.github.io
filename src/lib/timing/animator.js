export class Animator {
	solver;
	frameId = null;
	startTime = 0;
	onUpdate = null;

	constructor(solver = (t) => t) {
		this.solver = solver;
	}

	start(onUpdate, threshold = 0.001) {
		this.stop();
		this.onUpdate = onUpdate;
		this.startTime = performance.now();

		const tick = () => {
			const t = (performance.now() - this.startTime) / 1000;
			const value = this.solver(t);

			this.onUpdate(value);

			const target = this.solver.target ?? 1;
			if (Math.abs(value - target) < threshold) {
				this.stop();
				this.onUpdate(target);
				return;
			}

			this.frameId = requestAnimationFrame(tick);
		};

		tick();
		return this;
	}

	stop() {
		if (this.frameId) {
			cancelAnimationFrame(this.frameId);
			this.frameId = null;
		}
		return this;
	}
}
