const view = {
  left: 40,
  top: 40,
  right: 400,
  bottom: 400,
  radius: 80,
  smoothness: 0.6,
};

const config = {
  drawRoundRect: false,
  roundRectColor: "rgba(0, 0, 255, 0.75)",
  drawFigmaSmoothCorners: false,
  figmaColor: "rgba(0, 255, 0, 0.75)",
  drawSketchSmoothCorners: true,
  sketchColor: "rgba(255, 0, 0, 0.75)",
  drawQuadSmoothCorners: false,
  quadColor: "rgba(0, 255, 255, 0.75)",
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;

function draw() {
  const paint = ctx;
  paint.clearRect(0, 0, canvas.width, canvas.height);

  paint.globalCompositeOperation = "difference";

  if (config.drawRoundRect) {
    paint.fillStyle = config.roundRectColor;
    drawRoundRect(view.left, view.top, view.right, view.bottom, view.radius, paint);
    paint.fill();
  }

  if (config.drawFigmaSmoothCorners) {
    paint.fillStyle = config.figmaColor;
    drawFigmaSmoothCorners(view.left, view.top, view.right, view.bottom, view.radius, view.smoothness, paint);
    paint.fill();
  }

  if (config.drawSketchSmoothCorners) {
    paint.fillStyle = config.sketchColor;
    drawSketchSmoothCorners(view.left, view.top, view.right, view.bottom, view.radius, paint);
    paint.fill();
  }

  if (config.drawQuadSmoothCorners) {
    paint.fillStyle = config.quadColor;
    drawQuadSmoothCorners(view.left, view.top, view.right, view.bottom, view.radius, paint);
    paint.fill();
  }
}

const pane = new Tweakpane.Pane({ title: "Squircle", container: document.getElementById("pane") });
pane.addInput(view, "left");
pane.addInput(view, "top");
pane.addInput(view, "right");
pane.addInput(view, "bottom");
pane.addInput(view, "radius", { min: 0});
pane.addSeparator();
pane.addInput(config, "drawRoundRect");
pane.addInput(config, "roundRectColor");
pane.addSeparator();
pane.addInput(config, "drawFigmaSmoothCorners");
pane.addInput(config, "figmaColor");
pane.addInput(view, "smoothness", {label:"figmaSmoothness", min: 0, max: 1 });
pane.addSeparator();
pane.addInput(config, "drawSketchSmoothCorners");
pane.addInput(config, "sketchColor");
pane.addSeparator();
pane.addInput(config, "drawQuadSmoothCorners");
pane.addInput(config, "quadColor");
pane.on("change", draw);

function initCanvas() {
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.scale(dpr, dpr);

  draw();
}

window.addEventListener("resize", initCanvas);

initCanvas();
