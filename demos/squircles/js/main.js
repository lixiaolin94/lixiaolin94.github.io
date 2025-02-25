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
  roundRectColor: "#000000",
  drawQuadSmoothCorners: false,
  quadColor: "#7b61ff",
  drawSketchSmoothCorners: false,
  sketchColor: "#FF5C00",
  drawFigmaSmoothCorners: false,
  figmaColor: "#18A0FB",
  drawAndroidSmoothCorners: true,
  androidColor: "#1bc47d",
  smoothness: 0.6,
  alpha: 0.8,
  outline: false,
  lineWidth: 1,
  debug: false,
};

let referenceImage = null;

// Utils
function hex2rgba(hex, alpha = 1) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

function drawDebugPoints(points, context, color = "red") {
  context.save();

  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 2, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  });

  context.restore();
}

function drawShape(context, drawMethod, color, params) {
  const points = drawMethod(context, ...params);
  if (config.outline) {
    context.strokeStyle = hex2rgba(color, config.alpha);
    context.stroke();
  } else {
    context.fillStyle = hex2rgba(color, config.alpha);
    context.fill();
  }
  if (config.debug) {
    drawDebugPoints(points, context, color);
  }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (referenceImage) {
    ctx.save();
    ctx.drawImage(referenceImage, view.left, view.top);
    ctx.restore();
  }

  ctx.lineWidth = config.lineWidth;

  const shapes = [
    {
      enabled: config.drawRoundRect,
      method: drawRoundRect,
      color: config.roundRectColor,
      extraParams: [],
    },
    {
      enabled: config.drawQuadSmoothCorners,
      method: drawQuadSmoothCorners,
      color: config.quadColor,
      extraParams: [],
    },
    {
      enabled: config.drawSketchSmoothCorners,
      method: drawSketchSmoothCorners,
      color: config.sketchColor,
      extraParams: [],
    },
    {
      enabled: config.drawFigmaSmoothCorners,
      method: drawFigmaSmoothCorners,
      color: config.figmaColor,
      extraParams: [config.smoothness],
    },
    {
      enabled: config.drawAndroidSmoothCorners,
      method: drawSmoothCorners,
      color: config.androidColor,
      extraParams: [config.smoothness],
    }
  ].map((shape) => ({
    ...shape,
    params: [...Object.values(view), ...shape.extraParams],
  }));

  shapes.forEach((shape) => {
    if (shape.enabled) {
      drawShape(ctx, shape.method, shape.color, shape.params);
    }
  });
}

// Init canvas
function handleResize() {
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.scale(dpr, dpr);

  draw();
}

function handleImageUpload(e) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          referenceImage = img;
          draw();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  input.click();
}

// main
const pane = new Tweakpane.Pane({ title: "Squircle", container: document.getElementById("pane") });
pane.addInput(view, "left");
pane.addInput(view, "top");
pane.addInput(view, "right");
pane.addInput(view, "bottom");
pane.addInput(view, "radius", { min: 0 });
pane.addInput(config, "smoothness", { min: 0, max: 1 });
pane.addSeparator();
pane.addInput(config, "drawRoundRect");
pane.addInput(config, "roundRectColor");
pane.addSeparator();
pane.addInput(config, "drawQuadSmoothCorners");
pane.addInput(config, "quadColor");
pane.addSeparator();
pane.addInput(config, "drawSketchSmoothCorners");
pane.addInput(config, "sketchColor");
pane.addSeparator();
pane.addInput(config, "drawFigmaSmoothCorners");
pane.addInput(config, "figmaColor");
pane.addSeparator();
pane.addInput(config, "drawAndroidSmoothCorners");
pane.addInput(config, "androidColor");
pane.addSeparator();
pane.addInput(config, "alpha", { min: 0, max: 1 });
pane.addInput(config, "outline");
pane.addInput(config, "lineWidth", { min: 0 });
pane.addInput(config, "debug");
pane.addButton({
    title: "Upload Reference Image",
  })
  .on("click", handleImageUpload);
pane.on("change", draw);

window.addEventListener("resize", handleResize);

handleResize();
