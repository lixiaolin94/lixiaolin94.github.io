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
  drawSketchSmoothCorners: false,
  sketchColor: "rgba(255, 0, 0, 0.75)",
  drawQuadSmoothCorners: true,
  quadColor: "rgba(0, 255, 255, 0.75)",
  outline: false,
  debug: true,
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;

function drawDebugPoints(points, paint, color = "red") {
  paint.save();

  points.forEach((point) => {
    paint.beginPath();
    paint.arc(point.x, point.y, 2, 0, Math.PI * 2);
    paint.fillStyle = color;
    paint.fill();
  });

  paint.restore();
}

function draw() {
  const paint = ctx;
  paint.clearRect(0, 0, canvas.width, canvas.height);

  // paint.globalCompositeOperation = "difference";

  if (config.drawRoundRect) {
    const points = drawRoundRect(view.left, view.top, view.right, view.bottom, view.radius, paint);
    if (config.outline) {
      paint.strokeStyle = config.roundRectColor;
      paint.stroke();
    } else {
      paint.fillStyle = config.roundRectColor;
      paint.fill();
    }
    if (config.debug) {
      drawDebugPoints(points, paint, 'blue');
    }
  }

  if (config.drawFigmaSmoothCorners) {
    const points = drawFigmaSmoothCorners(view.left, view.top, view.right, view.bottom, view.radius, view.smoothness, paint);
    if (config.outline) {
      paint.strokeStyle = config.figmaColor;
      paint.stroke();
    } else {
      paint.fillStyle = config.figmaColor;
      paint.fill();
    }
    if (config.debug) {
      drawDebugPoints(points, paint, 'red');
    }
  }

  if (config.drawSketchSmoothCorners) {
    const points = drawSketchSmoothCorners(view.left, view.top, view.right, view.bottom, view.radius, paint);
    if (config.outline) {
      paint.strokeStyle = config.sketchColor;
      paint.stroke();
    } else {
      paint.fillStyle = config.sketchColor;
      paint.fill();
    }
    if (config.debug) {
      drawDebugPoints(points, paint, 'red');
    }
  }

  if (config.drawQuadSmoothCorners) {
    const points = drawQuadSmoothCorners(view.left, view.top, view.right, view.bottom, view.radius, paint);
    if (config.outline) {
      paint.strokeStyle = config.quadColor;
      paint.stroke();
    } else {
      paint.fillStyle = config.quadColor;
      paint.fill();
    }
    if (config.debug) {
      drawDebugPoints(points, paint, 'red');
    }
  }
}

const pane = new Tweakpane.Pane({ title: "Squircle", container: document.getElementById("pane") });
pane.addInput(view, "left");
pane.addInput(view, "top");
pane.addInput(view, "right");
pane.addInput(view, "bottom");
pane.addInput(view, "radius", { min: 0 });
pane.addSeparator();
pane.addInput(config, "drawRoundRect");
pane.addInput(config, "roundRectColor");
pane.addSeparator();
pane.addInput(config, "drawFigmaSmoothCorners");
pane.addInput(config, "figmaColor");
pane.addInput(view, "smoothness", { label: "figmaSmoothness", min: 0, max: 1 });
pane.addSeparator();
pane.addInput(config, "drawSketchSmoothCorners");
pane.addInput(config, "sketchColor");
pane.addSeparator();
pane.addInput(config, "drawQuadSmoothCorners");
pane.addInput(config, "quadColor");
pane.addSeparator();
pane.addInput(config, "outline");
pane.addInput(config, "debug");
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
