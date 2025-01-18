// Constants
const view = {
  left: 40,
  top: 40,
  right: 400,
  bottom: 400,
  radius: 80,
};

const config = {
  drawRoundRect: true,
  roundRectColor: "#f24822",
  drawFigmaSmoothCorners: true,
  figmaColor: "#1bc47d",
  figmaSmoothness: 0.6,
  drawSketchSmoothCorners: false,
  sketchColor: "#18a0fb",
  drawQuadSmoothCorners: false,
  quadColor: "#7b61ff",
  alpha: 0.8,
  outline: false,
  lineWidth: 1,
  debug: false,
};

// Utils
const hex2rgba = (hex, alpha = 1) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

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

function drawShape(paint, drawMethod, color, params) {
  const points = drawMethod(paint, ...params);
  if (config.outline) {
    ctx.strokeStyle = hex2rgba(color, config.alpha);
    ctx.stroke();
  } else {
    ctx.fillStyle = hex2rgba(color, config.alpha);
    ctx.fill();
  }
  if (config.debug) {
    drawDebugPoints(points, ctx, color);
  }
}

// Drawing methods
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;

function draw() {
  const paint = ctx;
  paint.clearRect(0, 0, canvas.width, canvas.height);
  paint.lineWidth = config.lineWidth;

  const shapes = [
    {
      enabled: config.drawRoundRect,
      method: drawRoundRect,
      color: config.roundRectColor,
      extraParams: [],
    },
    {
      enabled: config.drawFigmaSmoothCorners,
      method: drawFigmaSmoothCorners,
      color: config.figmaColor,
      extraParams: [config.figmaSmoothness],
    },
    {
      enabled: config.drawSketchSmoothCorners,
      method: drawSketchSmoothCorners,
      color: config.sketchColor,
      extraParams: [],
    },
    {
      enabled: config.drawQuadSmoothCorners,
      method: drawQuadSmoothCorners,
      color: config.quadColor,
      extraParams: [],
    },
  ].map(shape => ({
    ...shape,
    params: [...Object.values(view), ...shape.extraParams]
  }));

  shapes.forEach((shape) => {
    if (shape.enabled) {
      drawShape(paint, shape.method, shape.color, shape.params);
    }
  });
}

// GUI
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
pane.addInput(config, "figmaSmoothness", { min: 0, max: 1 });
pane.addSeparator();
pane.addInput(config, "drawSketchSmoothCorners");
pane.addInput(config, "sketchColor");
pane.addSeparator();
pane.addInput(config, "drawQuadSmoothCorners");
pane.addInput(config, "quadColor");
pane.addSeparator();
pane.addInput(config, "alpha", { min: 0, max: 1 });
pane.addInput(config, "outline");
pane.addInput(config, "lineWidth", { min: 0 });
pane.addInput(config, "debug");
pane.on("change", draw);

// Init canvas
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
