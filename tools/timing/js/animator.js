class Animator {
  constructor(solver = (t) => t) {
    this.solver = solver;
    this.frameId = null;
    this.startTime = 0;
    this.onUpdate = null;
  }

  start(onUpdate, threshold = 0.001) {
    this.stop();
    this.onUpdate = onUpdate;
    this.startTime = performance.now();

    const tick = () => {
      const t = (performance.now() - this.startTime) / 1000;
      const value = this.solver(t);

      this.onUpdate(value);

      if (Math.abs(value - this.solver.target) < threshold) {
        this.stop();
        this.onUpdate(this.solver.target);
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
