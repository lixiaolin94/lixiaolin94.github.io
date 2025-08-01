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
  drawQuadSmoothRoundRect: false,
  quadColor: "#7b61ff",
  drawSmoothRoundRect: true,
  smoothCornersColor: "#1bc47d",
  smoothness: 0.6,
  alpha: 0.8,
  outline: false,
  lineWidth: 1,
};

let referenceImage = null;

// Utils
function hex2rgba(hex, alpha = 1) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};


function drawShape(context, drawMethod, color, params) {
  drawMethod(context, ...params);
  if (config.outline) {
    context.strokeStyle = hex2rgba(color, config.alpha);
    context.stroke();
  } else {
    context.fillStyle = hex2rgba(color, config.alpha);
    context.fill();
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
      enabled: config.drawQuadSmoothRoundRect,
      method: drawQuadSmoothRoundRect,
      color: config.quadColor,
      extraParams: [],
    },
    {
      enabled: config.drawSmoothRoundRect,
      method: drawSmoothRoundRect,
      color: config.smoothCornersColor,
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

function handleImageUpload() {
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
pane.addInput(config, "drawQuadSmoothRoundRect");
pane.addInput(config, "quadColor");
pane.addSeparator();
pane.addInput(config, "drawSmoothRoundRect");
pane.addInput(config, "smoothCornersColor");
pane.addSeparator();
pane.addInput(config, "alpha", { min: 0, max: 1 });
pane.addInput(config, "outline");
pane.addInput(config, "lineWidth", { min: 0 });
pane.addButton({
    title: "Upload Reference Image",
  })
  .on("click", handleImageUpload);
pane.on("change", draw);

window.addEventListener("resize", handleResize);

handleResize();
