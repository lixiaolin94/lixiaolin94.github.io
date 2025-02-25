// 数学常量和工具函数
const FloatPi = Math.PI;
const DistanceEpsilon = 1e-5;

function square(x) {
  return x * x;
}

function distance(dx, dy) {
  return Math.sqrt(dx * dx + dy * dy);
}

function distanceSquared(dx, dy) {
  return dx * dx + dy * dy;
}

function interpolate(p1, p2, t) {
  return new Point(p1.x * (1 - t) + p2.x * t, p1.y * (1 - t) + p2.y * t);
}

function directionVector(dx, dy) {
  const dist = distance(dx, dy);
  if (dist < DistanceEpsilon) return new Point(0, 0);
  return new Point(dx / dist, dy / dist);
}

function radialToCartesian(radius, angle) {
  return new Point(radius * Math.cos(angle), radius * Math.sin(angle));
}

function convex(p0, p1, p2) {
  return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x) >= 0;
}

// Point 类
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
    if (Math.abs(scalar) < DistanceEpsilon) return new Point(0, 0);
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
    if (dist < DistanceEpsilon) return new Point(0, 0);
    return this.divide(dist);
  }

  rotate90() {
    return new Point(-this.y, this.x);
  }

  transformed(transformer) {
    const result = transformer(this.x, this.y);
    return new Point(result.x, result.y);
  }
}

// Cubic 类（三次贝塞尔曲线）
class Cubic {
  constructor(...args) {
    if (args.length === 1 && Array.isArray(args[0])) {
      this.points = args[0].slice(0);
    } else if (args.length === 8) {
      this.points = args.slice(0);
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
    return Math.abs(this.anchor0X - this.anchor1X) < DistanceEpsilon && Math.abs(this.anchor0Y - this.anchor1Y) < DistanceEpsilon;
  }

  pointOnCurve(t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return new Point(mt3 * this.anchor0X + 3 * mt2 * t * this.control0X + 3 * mt * t2 * this.control1X + t3 * this.anchor1X, mt3 * this.anchor0Y + 3 * mt2 * t * this.control0Y + 3 * mt * t2 * this.control1Y + t3 * this.anchor1Y);
  }

  reverse() {
    return new Cubic(this.anchor1X, this.anchor1Y, this.control1X, this.control1Y, this.control0X, this.control0Y, this.anchor0X, this.anchor0Y);
  }

  split(t) {
    const mt = 1 - t;

    const p0x = this.anchor0X;
    const p0y = this.anchor0Y;
    const p1x = this.control0X;
    const p1y = this.control0Y;
    const p2x = this.control1X;
    const p2y = this.control1Y;
    const p3x = this.anchor1X;
    const p3y = this.anchor1Y;

    const q0x = p0x;
    const q0y = p0y;
    const q1x = mt * p0x + t * p1x;
    const q1y = mt * p0y + t * p1y;
    const q2x = mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x;
    const q2y = mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y;
    const q3x = mt * mt * mt * p0x + 3 * mt * mt * t * p1x + 3 * mt * t * t * p2x + t * t * t * p3x;
    const q3y = mt * mt * mt * p0y + 3 * mt * mt * t * p1y + 3 * mt * t * t * p2y + t * t * t * p3y;

    const r0x = q3x;
    const r0y = q3y;
    const r1x = mt * mt * p1x + 2 * mt * t * p2x + t * t * p3x;
    const r1y = mt * mt * p1y + 2 * mt * t * p2y + t * t * p3y;
    const r2x = mt * p2x + t * p3x;
    const r2y = mt * p2y + t * p3y;
    const r3x = p3x;
    const r3y = p3y;

    return [new Cubic(q0x, q0y, q1x, q1y, q2x, q2y, q3x, q3y), new Cubic(r0x, r0y, r1x, r1y, r2x, r2y, r3x, r3y)];
  }

  calculateBounds(bounds = new Array(4), approximate = true) {
    if (approximate) {
      bounds[0] = Math.min(this.anchor0X, this.control0X, this.control1X, this.anchor1X);
      bounds[1] = Math.min(this.anchor0Y, this.control0Y, this.control1Y, this.anchor1Y);
      bounds[2] = Math.max(this.anchor0X, this.control0X, this.control1X, this.anchor1X);
      bounds[3] = Math.max(this.anchor0Y, this.control0Y, this.control1Y, this.anchor1Y);
      return bounds;
    }
    return this.calculateBounds(bounds, true);
  }

  static straightLine(x0, y0, x1, y1) {
    return new Cubic(x0, y0, x0, y0, x1, y1, x1, y1);
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
    if (angleDiff < 0) angleDiff += 2 * Math.PI;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

    const handleLength = ((radius * 4) / 3) * Math.tan(angleDiff / 4);

    const c0x = startX - handleLength * Math.sin(angle0);
    const c0y = startY + handleLength * Math.cos(angle0);
    const c1x = endX + handleLength * Math.sin(angle1);
    const c1y = endY - handleLength * Math.cos(angle1);

    return new Cubic(startX, startY, c0x, c0y, c1x, c1y, endX, endY);
  }
}

// CornerRounding 类
class CornerRounding {
  constructor(radius = 0, smoothing = 0) {
    this.radius = radius;
    this.smoothing = smoothing;
  }

  static get Unrounded() {
    return new CornerRounding(0, 0);
  }
}

// Feature 类
class Feature {
  constructor(cubics) {
    this.cubics = cubics;
  }

  transformed(transformer) {
    return new Feature(
      this.cubics.map((cubic) => {
        const newPoints = new Array(8);
        for (let i = 0; i < 8; i += 2) {
          const result = transformer(cubic.points[i], cubic.points[i + 1]);
          newPoints[i] = result.x;
          newPoints[i + 1] = result.y;
        }
        return new Cubic(newPoints);
      })
    );
  }

  static Corner(cubics, convex = true) {
    const corner = new Feature(cubics);
    corner.type = "Corner";
    corner.convex = convex;
    return corner;
  }

  static Edge(cubics) {
    const edge = new Feature(cubics);
    edge.type = "Edge";
    return edge;
  }
}

// MutableFloatList 类
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

// TransformResult 类
class TransformResult {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// RoundedCorner 类
class RoundedCorner {
  constructor(p0, p1, p2, rounding = null) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.rounding = rounding;
    this.center = new Point(0, 0);

    const v01 = p0.subtract(p1);
    const v21 = p2.subtract(p1);
    const d01 = v01.getDistance();
    const d21 = v21.getDistance();

    if (d01 > 0 && d21 > 0) {
      this.d1 = v01.divide(d01);
      this.d2 = v21.divide(d21);
      this.cornerRadius = rounding ? rounding.radius : 0;
      this.smoothing = rounding ? rounding.smoothing : 0;

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

    if (this.expectedRoundCut < DistanceEpsilon || allowedCut < DistanceEpsilon || this.cornerRadius < DistanceEpsilon) {
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

    return new Cubic(curveStart.x, curveStart.y, anchorStart.x, anchorStart.y, anchorEnd.x, anchorEnd.y, curveEnd.x, curveEnd.y);
  }

  lineIntersection(p0, d0, p1, d1) {
    const rotatedD1 = d1.rotate90();
    const den = d0.dotProduct(rotatedD1);

    if (Math.abs(den) < DistanceEpsilon) return null;

    const num = p1.subtract(p0).dotProduct(rotatedD1);

    if (Math.abs(den) < DistanceEpsilon * Math.abs(num)) return null;

    const k = num / den;
    return p0.add(d0.multiply(k));
  }
}

// RoundedPolygon 类
class RoundedPolygon {
  constructor(features, center) {
    this.features = features;
    this.center = center;

    // Build cubics
    this.cubics = this._buildCubics();

    // Verify continuity
    this._verifyContinuity();
  }

  get centerX() {
    return this.center.x;
  }

  get centerY() {
    return this.center.y;
  }

  _buildCubics() {
    const result = [];
    let firstCubic = null;
    let lastCubic = null;
    let firstFeatureSplitStart = null;
    let firstFeatureSplitEnd = null;

    if (this.features.length > 0 && this.features[0].cubics.length === 3) {
      const centerCubic = this.features[0].cubics[1];
      const [start, end] = centerCubic.split(0.5);
      firstFeatureSplitStart = [this.features[0].cubics[0], start];
      firstFeatureSplitEnd = [end, this.features[0].cubics[2]];
    }

    for (let i = 0; i <= this.features.length; i++) {
      let featureCubics;
      if (i === 0 && firstFeatureSplitEnd) {
        featureCubics = firstFeatureSplitEnd;
      } else if (i === this.features.length) {
        if (firstFeatureSplitStart) {
          featureCubics = firstFeatureSplitStart;
        } else {
          break;
        }
      } else {
        featureCubics = this.features[i].cubics;
      }

      for (let j = 0; j < featureCubics.length; j++) {
        const cubic = featureCubics[j];
        if (!cubic.zeroLength()) {
          if (lastCubic) result.push(lastCubic);
          lastCubic = cubic;
          if (!firstCubic) firstCubic = cubic;
        } else {
          if (lastCubic) {
            lastCubic = new Cubic(lastCubic.points.slice());
            lastCubic.points[6] = cubic.anchor1X;
            lastCubic.points[7] = cubic.anchor1Y;
          }
        }
      }
    }

    if (lastCubic && firstCubic) {
      result.push(new Cubic(lastCubic.anchor0X, lastCubic.anchor0Y, lastCubic.control0X, lastCubic.control0Y, lastCubic.control1X, lastCubic.control1Y, firstCubic.anchor0X, firstCubic.anchor0Y));
    } else {
      result.push(new Cubic(this.centerX, this.centerY, this.centerX, this.centerY, this.centerX, this.centerY, this.centerX, this.centerY));
    }

    return result;
  }

  _verifyContinuity() {
    let prevCubic = this.cubics[this.cubics.length - 1];

    for (let index = 0; index < this.cubics.length; index++) {
      const cubic = this.cubics[index];

      if (Math.abs(cubic.anchor0X - prevCubic.anchor1X) > DistanceEpsilon || Math.abs(cubic.anchor0Y - prevCubic.anchor1Y) > DistanceEpsilon) {
        throw new Error("RoundedPolygon must be contiguous, with the anchor points of all curves " + "matching the anchor points of the preceding and succeeding cubics");
      }

      prevCubic = cubic;
    }
  }

  calculateBounds(bounds = new Array(4), approximate = true) {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    const tempBounds = new Array(4);
    for (let i = 0; i < this.cubics.length; i++) {
      const cubic = this.cubics[i];
      cubic.calculateBounds(tempBounds, approximate);
      minX = Math.min(minX, tempBounds[0]);
      minY = Math.min(minY, tempBounds[1]);
      maxX = Math.max(maxX, tempBounds[2]);
      maxY = Math.max(maxY, tempBounds[3]);
    }

    bounds[0] = minX;
    bounds[1] = minY;
    bounds[2] = maxX;
    bounds[3] = maxY;

    return bounds;
  }

  static create(numVertices, radius = 1, centerX = 0, centerY = 0, rounding = CornerRounding.Unrounded, perVertexRounding = null) {
    const vertices = verticesFromNumVerts(numVertices, radius, centerX, centerY);
    return RoundedPolygon.fromVertices(vertices, rounding, perVertexRounding, centerX, centerY);
  }

  static fromVertices(vertices, rounding = CornerRounding.Unrounded, perVertexRounding = null, centerX = Number.MIN_VALUE, centerY = Number.MIN_VALUE) {
    if (vertices.length < 6) {
      throw new Error("Polygons must have at least 3 vertices");
    }
    if (vertices.length % 2 === 1) {
      throw new Error("The vertices array should have even size");
    }
    if (perVertexRounding && perVertexRounding.length * 2 !== vertices.length) {
      throw new Error("perVertexRounding list should be either null or " + "the same size as the number of vertices (vertices.length / 2)");
    }

    const corners = [];
    const n = vertices.length / 2;
    const roundedCorners = [];

    for (let i = 0; i < n; i++) {
      const vtxRounding = perVertexRounding ? perVertexRounding[i] : rounding;
      const prevIndex = ((i + n - 1) % n) * 2;
      const nextIndex = ((i + 1) % n) * 2;

      roundedCorners.push(new RoundedCorner(new Point(vertices[prevIndex], vertices[prevIndex + 1]), new Point(vertices[i * 2], vertices[i * 2 + 1]), new Point(vertices[nextIndex], vertices[nextIndex + 1]), vtxRounding));
    }

    const cutAdjusts = Array(n);
    for (let ix = 0; ix < n; ix++) {
      const expectedRoundCut = roundedCorners[ix].expectedRoundCut + roundedCorners[(ix + 1) % n].expectedRoundCut;
      const expectedCut = roundedCorners[ix].expectedCut + roundedCorners[(ix + 1) % n].expectedCut;
      const vtxX = vertices[ix * 2];
      const vtxY = vertices[ix * 2 + 1];
      const nextVtxX = vertices[((ix + 1) % n) * 2];
      const nextVtxY = vertices[((ix + 1) % n) * 2 + 1];
      const sideSize = distance(vtxX - nextVtxX, vtxY - nextVtxY);

      if (expectedRoundCut > sideSize) {
        cutAdjusts[ix] = [sideSize / expectedRoundCut, 0];
      } else if (expectedCut > sideSize) {
        cutAdjusts[ix] = [1, (sideSize - expectedRoundCut) / (expectedCut - expectedRoundCut)];
      } else {
        cutAdjusts[ix] = [1, 1];
      }
    }

    for (let i = 0; i < n; i++) {
      const allowedCuts = new MutableFloatList(2);
      for (let delta = 0; delta <= 1; delta++) {
        const [roundCutRatio, cutRatio] = cutAdjusts[(i + n - 1 + delta) % n];
        allowedCuts.add(roundedCorners[i].expectedRoundCut * roundCutRatio + (roundedCorners[i].expectedCut - roundedCorners[i].expectedRoundCut) * cutRatio);
      }

      corners.push(roundedCorners[i].getCubics(allowedCuts.get(0), allowedCuts.get(1)));
    }

    const tempFeatures = [];
    for (let i = 0; i < n; i++) {
      const prevVtxIndex = (i + n - 1) % n;
      const nextVtxIndex = (i + 1) % n;
      const currVertex = new Point(vertices[i * 2], vertices[i * 2 + 1]);
      const prevVertex = new Point(vertices[prevVtxIndex * 2], vertices[prevVtxIndex * 2 + 1]);
      const nextVertex = new Point(vertices[nextVtxIndex * 2], vertices[nextVtxIndex * 2 + 1]);
      const isConvex = convex(prevVertex, currVertex, nextVertex);

      tempFeatures.push(Feature.Corner(corners[i], isConvex));
      tempFeatures.push(Feature.Edge([Cubic.straightLine(corners[i][corners[i].length - 1].anchor1X, corners[i][corners[i].length - 1].anchor1Y, corners[(i + 1) % n][0].anchor0X, corners[(i + 1) % n][0].anchor0Y)]));
    }

    const center = calculateCenter(vertices);
    const cx = centerX === Number.MIN_VALUE ? center.x : centerX;
    const cy = centerY === Number.MIN_VALUE ? center.y : centerY;

    return new RoundedPolygon(tempFeatures, new Point(cx, cy));
  }
}

function calculateCenter(vertices) {
  let cumulativeX = 0;
  let cumulativeY = 0;
  let index = 0;

  while (index < vertices.length) {
    cumulativeX += vertices[index++];
    cumulativeY += vertices[index++];
  }

  return new Point(cumulativeX / (vertices.length / 2), cumulativeY / (vertices.length / 2));
}

function verticesFromNumVerts(numVertices, radius, centerX, centerY) {
  const result = new Array(numVertices * 2);
  let arrayIndex = 0;

  for (let i = 0; i < numVertices; i++) {
    const vertex = radialToCartesian(radius, (Math.PI / numVertices) * 2 * i).add(new Point(centerX, centerY));

    result[arrayIndex++] = vertex.x;
    result[arrayIndex++] = vertex.y;
  }

  return result;
}
