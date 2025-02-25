const PARAMS = {
  vertices: 4,
  radius: 256,
  cornerRadius: 80,
  smoothing: 0.6,
  rotation: 45,
  color: "#CCCCCC",
  outline: false,
  debug: false,
};

const canvas = document.getElementById("canvas");
const dpr = window.devicePixelRatio || 1;
const ctx = canvas.getContext("2d");

function handleResize() {
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
  render();
}

window.addEventListener("resize", handleResize);

handleResize();

function render() {
  const centerX = (canvas.width / dpr) * 0.5;
  const centerY = (canvas.height / dpr) * 0.5;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 创建圆角
  const rounding = new CornerRounding(PARAMS.cornerRadius, PARAMS.smoothing);
  const baseVertices = verticesFromNumVerts(PARAMS.vertices, PARAMS.radius, 0, 0);

  // 旋转
  const rotationRadians = (PARAMS.rotation * Math.PI) / 180;
  const rotatedVertices = new Array(baseVertices.length);
  for (let i = 0; i < baseVertices.length; i += 2) {
    const x = baseVertices[i];
    const y = baseVertices[i + 1];
    rotatedVertices[i] = x * Math.cos(rotationRadians) - y * Math.sin(rotationRadians) + centerX;
    rotatedVertices[i + 1] = x * Math.sin(rotationRadians) + y * Math.cos(rotationRadians) + centerY;
  }

  // 创建多边形
  const polygon = RoundedPolygon.fromVertices(rotatedVertices, rounding, null, centerX, centerY);

  // 绘制
  ctx.beginPath();

  const cubics = polygon.cubics;
  if (cubics.length > 0) {
    ctx.moveTo(cubics[0].anchor0X, cubics[0].anchor0Y);

    for (const cubic of cubics) {
      ctx.bezierCurveTo(cubic.control0X, cubic.control0Y, cubic.control1X, cubic.control1Y, cubic.anchor1X, cubic.anchor1Y);
    }
  }

  ctx.closePath();

  if (PARAMS.outline) {
    ctx.strokeStyle = PARAMS.color;
    ctx.lineWidth = 0.5 * dpr;
    ctx.stroke();
  } else {
    ctx.fillStyle = PARAMS.color;
    ctx.fill();
  }
  
  // 绘制控制点和手柄
  if (PARAMS.debug) {
    const LINE_WIDTH = 0.5 * dpr;
    const POINT_RADIUS = 1.5 * dpr;
    for (const cubic of cubics) {
      // 绘制控制线
      ctx.strokeStyle = "green";
      ctx.lineWidth = LINE_WIDTH;

      ctx.beginPath();
      ctx.moveTo(cubic.anchor0X, cubic.anchor0Y);
      ctx.lineTo(cubic.control0X, cubic.control0Y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cubic.anchor1X, cubic.anchor1Y);
      ctx.lineTo(cubic.control1X, cubic.control1Y);
      ctx.stroke();

      // 绘制锚点
      ctx.fillStyle = "red";
      drawPoint(cubic.anchor0X, cubic.anchor0Y, POINT_RADIUS);
      drawPoint(cubic.anchor1X, cubic.anchor1Y, POINT_RADIUS);

      // 绘制控制点
      ctx.fillStyle = "green";
      drawPoint(cubic.control0X, cubic.control0Y, POINT_RADIUS);
      drawPoint(cubic.control1X, cubic.control1Y, POINT_RADIUS);
    }
  }
}

function drawPoint(x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

render();

const pane = new Tweakpane.Pane();

pane.addInput(PARAMS, "vertices", { min: 3, step: 1 });
pane.addInput(PARAMS, "radius", { min: 0 });
pane.addInput(PARAMS, "cornerRadius", { min: 0 });
pane.addInput(PARAMS, "smoothing", { min: 0, max: 1 });
pane.addInput(PARAMS, "rotation");
pane.addInput(PARAMS, "color");
pane.addInput(PARAMS, "outline");
pane.addInput(PARAMS, "debug");

pane.on("change", render);
