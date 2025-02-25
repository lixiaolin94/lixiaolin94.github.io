// 常量定义
const DISTANCE_EPSILON = 1e-5;
const TWO_PI = Math.PI * 2;

// 工具函数
const square = (x) => x * x;
const distance = (dx, dy) => Math.sqrt(dx * dx + dy * dy);
const interpolate = (p1, p2, t) => new Point(p1.x * (1 - t) + p2.x * t, p1.y * (1 - t) + p2.y * t);
const directionVector = (dx, dy) => {
  const dist = distance(dx, dy);
  if (dist < DISTANCE_EPSILON) return new Point(0, 0);
  return new Point(dx / dist, dy / dist);
};

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  subtract(other) {
    return new Point(this.x - other.x, this.y - other.y);
  }

  add(other) {
    return new Point(this.x + other.x, this.y + other.y);
  }

  multiply(scalar) {
    return new Point(this.x * scalar, this.y * scalar);
  }

  divide(scalar) {
    if (Math.abs(scalar) < DISTANCE_EPSILON) return new Point(0, 0);
    return new Point(this.x / scalar, this.y / scalar);
  }

  dotProduct(other) {
    return this.x * other.x + this.y * other.y;
  }

  getDistance() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  getDirection() {
    const dist = this.getDistance();
    if (dist < DISTANCE_EPSILON) return new Point(0, 0);
    return this.divide(dist);
  }

  rotate90() {
    return new Point(-this.y, this.x);
  }
}

class Cubic {
  constructor(...args) {
    if (args.length === 1 && Array.isArray(args[0])) {
      this.points = [...args[0]];
    } else if (args.length === 8) {
      this.points = [...args];
    } else {
      this.points = new Array(8).fill(0);
    }
  }

  get anchor0X() {
    return this.points[0];
  }
  get anchor0Y() {
    return this.points[1];
  }
  get control0X() {
    return this.points[2];
  }
  get control0Y() {
    return this.points[3];
  }
  get control1X() {
    return this.points[4];
  }
  get control1Y() {
    return this.points[5];
  }
  get anchor1X() {
    return this.points[6];
  }
  get anchor1Y() {
    return this.points[7];
  }

  zeroLength() {
    return Math.abs(this.anchor0X - this.anchor1X) < DISTANCE_EPSILON && Math.abs(this.anchor0Y - this.anchor1Y) < DISTANCE_EPSILON;
  }

  reverse() {
    return new Cubic([this.anchor1X, this.anchor1Y, this.control1X, this.control1Y, this.control0X, this.control0Y, this.anchor0X, this.anchor0Y]);
  }

  static straightLine(x0, y0, x1, y1) {
    return new Cubic([x0, y0, x0, y0, x1, y1, x1, y1]);
  }

  static circularArc(centerX, centerY, startX, startY, endX, endY) {
    const p0 = new Point(startX, startY);
    const p1 = new Point(endX, endY);
    const center = new Point(centerX, centerY);

    const v0 = p0.subtract(center);
    const v1 = p1.subtract(center);

    const r0 = v0.getDistance();
    const r1 = v1.getDistance();
    const radius = (r0 + r1) / 2;

    const angle0 = Math.atan2(v0.y, v0.x);
    const angle1 = Math.atan2(v1.y, v1.x);

    let angleDiff = angle1 - angle0;
    if (angleDiff < 0) angleDiff += TWO_PI;
    if (angleDiff > Math.PI) angleDiff -= TWO_PI;

    const handleLength = ((radius * 4) / 3) * Math.tan(angleDiff / 4);

    const c0x = startX - handleLength * Math.sin(angle0);
    const c0y = startY + handleLength * Math.cos(angle0);
    const c1x = endX + handleLength * Math.sin(angle1);
    const c1y = endY - handleLength * Math.cos(angle1);

    return new Cubic([startX, startY, c0x, c0y, c1x, c1y, endX, endY]);
  }
}

class CornerRounding {
  constructor(radius = 0, smoothing = 0) {
    this.radius = radius;
    this.smoothing = smoothing;
  }
}

class MutableFloatList {
  constructor(capacity = 0) {
    this.items = [];
    this.length = 0;
  }

  add(value) {
    this.items[this.length++] = value;
  }

  get(index) {
    return this.items[index];
  }
}

class RoundedCorner {
  constructor(p0, p1, p2, rounding = null) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.rounding = rounding || new CornerRounding();
    this.center = new Point(0, 0);

    const v01 = p0.subtract(p1);
    const v21 = p2.subtract(p1);
    const d01 = v01.getDistance();
    const d21 = v21.getDistance();

    if (d01 > 0 && d21 > 0) {
      this.d1 = v01.divide(d01);
      this.d2 = v21.divide(d21);
      this.cornerRadius = this.rounding.radius;
      this.smoothing = this.rounding.smoothing;

      this.cosAngle = this.d1.dotProduct(this.d2);
      this.sinAngle = Math.sqrt(1 - square(this.cosAngle));

      this.expectedRoundCut = this.sinAngle > 1e-3 ? (this.cornerRadius * (this.cosAngle + 1)) / this.sinAngle : 0;
    } else {
      this.d1 = new Point(0, 0);
      this.d2 = new Point(0, 0);
      this.cornerRadius = 0;
      this.smoothing = 0;
      this.cosAngle = 0;
      this.sinAngle = 0;
      this.expectedRoundCut = 0;
    }
  }

  get expectedCut() {
    return (1 + this.smoothing) * this.expectedRoundCut;
  }

  getCubics(allowedCut0, allowedCut1 = allowedCut0) {
    const allowedCut = Math.min(allowedCut0, allowedCut1);

    if (this.expectedRoundCut < DISTANCE_EPSILON || allowedCut < DISTANCE_EPSILON || this.cornerRadius < DISTANCE_EPSILON) {
      this.center = this.p1;
      return [Cubic.straightLine(this.p1.x, this.p1.y, this.p1.x, this.p1.y)];
    }

    const actualRoundCut = Math.min(allowedCut, this.expectedRoundCut);
    const actualSmoothing0 = this.calculateActualSmoothingValue(allowedCut0);
    const actualSmoothing1 = this.calculateActualSmoothingValue(allowedCut1);

    const actualR = (this.cornerRadius * actualRoundCut) / this.expectedRoundCut;
    const centerDistance = Math.sqrt(square(actualR) + square(actualRoundCut));

    this.center = this.p1.add(this.d1.add(this.d2).divide(2).getDirection().multiply(centerDistance));

    const circleIntersection0 = this.p1.add(this.d1.multiply(actualRoundCut));
    const circleIntersection2 = this.p1.add(this.d2.multiply(actualRoundCut));

    const flanking0 = this.computeFlankingCurve(actualRoundCut, actualSmoothing0, this.p1, this.p0, circleIntersection0, circleIntersection2, this.center, actualR);

    const flanking2 = this.computeFlankingCurve(actualRoundCut, actualSmoothing1, this.p1, this.p2, circleIntersection2, circleIntersection0, this.center, actualR).reverse();

    return [flanking0, Cubic.circularArc(this.center.x, this.center.y, flanking0.anchor1X, flanking0.anchor1Y, flanking2.anchor0X, flanking2.anchor0Y), flanking2];
  }

  calculateActualSmoothingValue(allowedCut) {
    if (allowedCut > this.expectedCut) {
      return this.smoothing;
    } else if (allowedCut > this.expectedRoundCut) {
      return (this.smoothing * (allowedCut - this.expectedRoundCut)) / (this.expectedCut - this.expectedRoundCut);
    } else {
      return 0;
    }
  }

  computeFlankingCurve(actualRoundCut, actualSmoothingValues, corner, sideStart, circleSegmentIntersection, otherCircleSegmentIntersection, circleCenter, actualR) {
    const sideDirection = sideStart.subtract(corner).getDirection();
    const curveStart = corner.add(sideDirection.multiply(actualRoundCut * (1 + actualSmoothingValues)));

    const p = interpolate(circleSegmentIntersection, circleSegmentIntersection.add(otherCircleSegmentIntersection).divide(2), actualSmoothingValues);

    const curveEnd = circleCenter.add(directionVector(p.x - circleCenter.x, p.y - circleCenter.y).multiply(actualR));

    const circleTangent = curveEnd.subtract(circleCenter).rotate90();
    const anchorEnd = this.lineIntersection(sideStart, sideDirection, curveEnd, circleTangent) || circleSegmentIntersection;

    const anchorStart = curveStart.add(anchorEnd.multiply(2)).divide(3);

    return new Cubic([curveStart.x, curveStart.y, anchorStart.x, anchorStart.y, anchorEnd.x, anchorEnd.y, curveEnd.x, curveEnd.y]);
  }

  lineIntersection(p0, d0, p1, d1) {
    const rotatedD1 = d1.rotate90();
    const den = d0.dotProduct(rotatedD1);

    if (Math.abs(den) < DISTANCE_EPSILON) return null;

    const num = p1.subtract(p0).dotProduct(rotatedD1);
    if (Math.abs(den) < DISTANCE_EPSILON * Math.abs(num)) return null;

    const k = num / den;
    return p0.add(d0.multiply(k));
  }
}

function drawSmoothCorners(paint, left, top, right, bottom, radius, smoothness = 0.6) {
  // 确保坐标顺序正确，使用解构赋值简化交换
  if (right < left) [left, right] = [right, left];
  if (bottom < top) [top, bottom] = [bottom, top];

  const width = right - left;
  const height = bottom - top;
  const rounding = new CornerRounding(radius, smoothness);

  // 创建角点
  const topLeft = new Point(left, top);
  const topRight = new Point(right, top);
  const bottomRight = new Point(right, bottom);
  const bottomLeft = new Point(left, bottom);

  // 创建圆角
  const corners = [new RoundedCorner(bottomLeft, topLeft, topRight, rounding), new RoundedCorner(topLeft, topRight, bottomRight, rounding), new RoundedCorner(topRight, bottomRight, bottomLeft, rounding), new RoundedCorner(bottomRight, bottomLeft, topLeft, rounding)];

  // 计算每个角的切割调整
  const cutAdjusts = [];
  for (let i = 0; i < 4; i++) {
    const nextI = (i + 1) % 4;
    const expectedRoundCut = corners[i].expectedRoundCut + corners[nextI].expectedRoundCut;
    const expectedCut = corners[i].expectedCut + corners[nextI].expectedCut;
    const sideSize = i % 2 === 0 ? width : height;

    if (expectedRoundCut > sideSize) {
      cutAdjusts.push([sideSize / expectedRoundCut, 0]);
    } else if (expectedCut > sideSize) {
      cutAdjusts.push([1, (sideSize - expectedRoundCut) / (expectedCut - expectedRoundCut)]);
    } else {
      cutAdjusts.push([1, 1]);
    }
  }

  // 生成每个角的贝塞尔曲线
  const cornerCubics = [];
  for (let i = 0; i < 4; i++) {
    const allowedCuts = new MutableFloatList(2);
    for (let delta = 0; delta <= 1; delta++) {
      const [roundCutRatio, cutRatio] = cutAdjusts[(i + 3 + delta) % 4];
      allowedCuts.add(corners[i].expectedRoundCut * roundCutRatio + (corners[i].expectedCut - corners[i].expectedRoundCut) * cutRatio);
    }
    cornerCubics.push(corners[i].getCubics(allowedCuts.get(0), allowedCuts.get(1)));
  }

  // 绘制路径
  paint.beginPath();

  if (cornerCubics[0].length > 0) {
    paint.moveTo(cornerCubics[0][0].anchor0X, cornerCubics[0][0].anchor0Y);
  }

  for (let i = 0; i < 4; i++) {
    const corner = cornerCubics[i];

    for (const cubic of corner) {
      paint.bezierCurveTo(cubic.control0X, cubic.control0Y, cubic.control1X, cubic.control1Y, cubic.anchor1X, cubic.anchor1Y);
    }

    const nextCorner = cornerCubics[(i + 1) % 4];
    if (nextCorner.length > 0) {
      const lastCubic = corner[corner.length - 1];
      const nextFirstCubic = nextCorner[0];

      if (Math.abs(lastCubic.anchor1X - nextFirstCubic.anchor0X) > DISTANCE_EPSILON || Math.abs(lastCubic.anchor1Y - nextFirstCubic.anchor0Y) > DISTANCE_EPSILON) {
        paint.lineTo(nextFirstCubic.anchor0X, nextFirstCubic.anchor0Y);
      }
    }
  }

  paint.closePath();
}

// ────────────── Draw ──────────────
const PARAMS = {
  left: 40,
  top: 40,
  right: 400,
  bottom: 400,
  radius: 88,
  smoothness: 0.6,
  color: "#000000",
  outline: false,
};

const canvas = document.getElementById("canvas");
const dpr = window.devicePixelRatio || 1;
const ctx = canvas.getContext("2d");

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSmoothCorners(ctx, PARAMS.left, PARAMS.top, PARAMS.right, PARAMS.bottom, PARAMS.radius, PARAMS.smoothness);
  if (PARAMS.outline) {
    ctx.strokeStyle = PARAMS.color;
    ctx.lineWidth = 0.5 * dpr;
    ctx.stroke();
  } else {
    ctx.fillStyle = PARAMS.color;
    ctx.fill();
  }
}

function resize() {
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.scale(dpr, dpr);
  render();
}

const pane = new Tweakpane.Pane();
pane.addInput(PARAMS, "left");
pane.addInput(PARAMS, "top");
pane.addInput(PARAMS, "right");
pane.addInput(PARAMS, "bottom");
pane.addInput(PARAMS, "radius", { min: 0 });
pane.addInput(PARAMS, "smoothness", { min: 0, max: 1 });
pane.addInput(PARAMS, "color");
pane.addInput(PARAMS, "outline");
pane.on("change", render);

window.addEventListener("resize", resize);

resize();
