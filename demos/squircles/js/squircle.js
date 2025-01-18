/**
 * 绘制调试点
 * @param {Array<{x: number, y: number, label?: string}>} points - 点的数组
 * @param {CanvasRenderingContext2D} paint - Canvas context
 * @param {string} color - 点的颜色
 * @param {number} size - 点的大小
 */
function drawDebugPoints(points, paint, color = "red", size = 2) {
  paint.save();

  points.forEach((point) => {
    paint.beginPath();
    paint.arc(point.x, point.y, size, 0, Math.PI * 2);
    paint.fillStyle = color;
    paint.fill();
  });

  paint.restore();
}

/**
 * Draws a rounded rectangle with specified dimensions and radius
 * @param {number} left - Left coordinate
 * @param {number} top - Top coordinate
 * @param {number} right - Right coordinate
 * @param {number} bottom - Bottom coordinate
 * @param {number} radius - Corner radius
 * @param {CanvasRenderingContext2D} paint - Canvas context
 */
function drawRoundRect(left, top, right, bottom, radius, paint) {
  const width = right - left;
  const height = bottom - top;
  paint.beginPath();
  paint.roundRect(left, top, width, height, radius);
  paint.closePath();
}

/**
 * Draws a smooth cornered rectangle using Figma's algorithm
 * @param {number} left - Left coordinate
 * @param {number} top - Top coordinate
 * @param {number} right - Right coordinate
 * @param {number} bottom - Bottom coordinate
 * @param {number} radius - Corner radius
 * @param {number} smoothness - Corner smoothness (0-1)
 * @param {CanvasRenderingContext2D} paint - Canvas context
 */
function drawFigmaSmoothCorners(left, top, right, bottom, radius, smoothness = 0.6, paint, debug = false) {
  const DEGREES_TO_RADIANS = Math.PI / 180;

  // Basic dimension calculations
  const width = right - left;
  const height = bottom - top;
  const minDimension = Math.min(width, height);

  // Special case: when no radius or radius is too large, fallback to regular rounded rect
  if (radius === 0 || radius >= 0.5 * minDimension) {
    drawRoundRect(left, top, right, bottom, radius, paint);
    return;
  }

  // Calculate maximum corner size
  const maxCornerSize = minDimension / 2;
  const cornerSize = Math.min(maxCornerSize, (1 + smoothness) * radius);

  // Calculate smooth angles
  let smoothAngle, cornerAngle;
  const quarterSize = minDimension / 4;

  if (radius > quarterSize) {
    const adaptiveRatio = (radius - quarterSize) / quarterSize;
    cornerAngle = 90 * (1 - smoothness * (1 - adaptiveRatio));
    smoothAngle = 45 * smoothness * (1 - adaptiveRatio);
  } else {
    cornerAngle = 90 * (1 - smoothness);
    smoothAngle = 45 * smoothness;
  }

  // Calculate control point
  const theta = (90 - cornerAngle) / 2;
  const controlRatio = Math.tan(smoothAngle * DEGREES_TO_RADIANS);
  const handleLength = radius * Math.tan((theta / 2) * DEGREES_TO_RADIANS);

  const arcLength = Math.sin((cornerAngle / 2) * DEGREES_TO_RADIANS) * radius * Math.sqrt(2);
  const controlLength = handleLength * Math.cos(smoothAngle * DEGREES_TO_RADIANS);
  const controlHeight = controlLength * controlRatio;

  const handleSmall = (cornerSize - arcLength - (1 + controlRatio) * controlLength) / 3;
  const handleLarge = 2 * handleSmall;

  // Define all points with semantic names
  const center = { x: left + width / 2, y: top };

  // Top Right (TR) corner
  const trStart = { x: right - cornerSize, y: top };
  // First curve
  const trCurve1Cp1 = { x: right - (cornerSize - handleLarge), y: top };
  const trCurve1Cp2 = { x: right - (cornerSize - handleLarge - handleSmall), y: top };
  const trCurve1End = { x: right - (cornerSize - handleLarge - handleSmall - controlLength), y: top + controlHeight };
  // Arc
  const trArcCenter = { x: right - radius, y: top + radius };
  const trArcStart = theta + 270;
  const trArcEnd = 360 - theta;
  // Second curve
  const trCurve2Cp1 = { x: right, y: top + (cornerSize - handleLarge - handleSmall) };
  const trCurve2Cp2 = { x: right, y: top + (cornerSize - handleLarge) };
  const trCurve2End = { x: right, y: top + cornerSize };

  // Bottom Right (BR) corner
  const brStart = { x: right, y: bottom - cornerSize };
  // First curve
  const brCurve1Cp1 = { x: right, y: bottom - (cornerSize - handleLarge) };
  const brCurve1Cp2 = { x: right, y: bottom - (cornerSize - handleLarge - handleSmall) };
  const brCurve1End = { x: right - controlHeight, y: bottom - (cornerSize - handleLarge - handleSmall - controlLength) };
  // Arc
  const brArcCenter = { x: right - radius, y: bottom - radius };
  const brArcStart = theta;
  const brArcEnd = 90 - theta;
  // Second curve
  const brCurve2Cp1 = { x: right - (cornerSize - handleLarge - handleSmall), y: bottom };
  const brCurve2Cp2 = { x: right - (cornerSize - handleLarge), y: bottom };
  const brCurve2End = { x: right - cornerSize, y: bottom };

  // Bottom Left (BL) corner
  const blStart = { x: left + cornerSize, y: bottom };
  // First curve
  const blCurve1Cp1 = { x: left + (cornerSize - handleLarge), y: bottom };
  const blCurve1Cp2 = { x: left + (cornerSize - handleLarge - handleSmall), y: bottom };
  const blCurve1End = { x: left + (cornerSize - handleLarge - handleSmall - controlLength), y: bottom - controlHeight };
  // Arc
  const blArcCenter = { x: left + radius, y: bottom - radius };
  const blArcStart = 90 + theta;
  const blArcEnd = 180 - theta;
  // Second curve
  const blCurve2Cp1 = { x: left, y: bottom - (cornerSize - handleLarge - handleSmall) };
  const blCurve2Cp2 = { x: left, y: bottom - (cornerSize - handleLarge) };
  const blCurve2End = { x: left, y: bottom - cornerSize };

  // Top Left (TL) corner
  const tlStart = { x: left, y: top + cornerSize };
  // First curve
  const tlCurve1Cp1 = { x: left, y: top + (cornerSize - handleLarge) };
  const tlCurve1Cp2 = { x: left, y: top + (cornerSize - handleLarge - handleSmall) };
  const tlCurve1End = { x: left + controlHeight, y: top + (cornerSize - handleLarge - handleSmall - controlLength) };
  // Arc
  const tlArcCenter = { x: left + radius, y: top + radius };
  const tlArcStart = 180 + theta;
  const tlArcEnd = 270 - theta;
  // Second curve
  const tlCurve2Cp1 = { x: left + (cornerSize - handleLarge - handleSmall), y: top };
  const tlCurve2Cp2 = { x: left + (cornerSize - handleLarge), y: top };
  const tlCurve2End = { x: left + cornerSize, y: top };

  // Drawing with semantic variables
  paint.beginPath();

  // Starting point (center of top edge)
  paint.moveTo(center.x, center.y);

  // TR corner
  paint.lineTo(trStart.x, trStart.y);
  paint.bezierCurveTo(trCurve1Cp1.x, trCurve1Cp1.y, trCurve1Cp2.x, trCurve1Cp2.y, trCurve1End.x, trCurve1End.y);
  paint.arc(trArcCenter.x, trArcCenter.y, radius, trArcStart * DEGREES_TO_RADIANS, trArcEnd * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(trCurve2Cp1.x, trCurve2Cp1.y, trCurve2Cp2.x, trCurve2Cp2.y, trCurve2End.x, trCurve2End.y);

  // BR corner
  paint.lineTo(brStart.x, brStart.y);
  paint.bezierCurveTo(brCurve1Cp1.x, brCurve1Cp1.y, brCurve1Cp2.x, brCurve1Cp2.y, brCurve1End.x, brCurve1End.y);
  paint.arc(brArcCenter.x, brArcCenter.y, radius, brArcStart * DEGREES_TO_RADIANS, brArcEnd * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(brCurve2Cp1.x, brCurve2Cp1.y, brCurve2Cp2.x, brCurve2Cp2.y, brCurve2End.x, brCurve2End.y);

  // BL corner
  paint.lineTo(blStart.x, blStart.y);
  paint.bezierCurveTo(blCurve1Cp1.x, blCurve1Cp1.y, blCurve1Cp2.x, blCurve1Cp2.y, blCurve1End.x, blCurve1End.y);
  paint.arc(blArcCenter.x, blArcCenter.y, radius, blArcStart * DEGREES_TO_RADIANS, blArcEnd * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(blCurve2Cp1.x, blCurve2Cp1.y, blCurve2Cp2.x, blCurve2Cp2.y, blCurve2End.x, blCurve2End.y);

  // TL corner
  paint.lineTo(tlStart.x, tlStart.y);
  paint.bezierCurveTo(tlCurve1Cp1.x, tlCurve1Cp1.y, tlCurve1Cp2.x, tlCurve1Cp2.y, tlCurve1End.x, tlCurve1End.y);
  paint.arc(tlArcCenter.x, tlArcCenter.y, radius, tlArcStart * DEGREES_TO_RADIANS, tlArcEnd * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(tlCurve2Cp1.x, tlCurve2Cp1.y, tlCurve2Cp2.x, tlCurve2Cp2.y, tlCurve2End.x, tlCurve2End.y);

  paint.closePath();
  paint.fill();

  if (debug) {
    const points = [
      { x: trStart.x, y: trStart.y },
      { x: trCurve1End.x, y: trCurve1End.y },
      { x: trCurve2End.x, y: trCurve2End.y },
      { x: brStart.x, y: brStart.y },
      { x: brCurve1End.x, y: brCurve1End.y },
      { x: brCurve2End.x, y: brCurve2End.y },
      { x: blStart.x, y: blStart.y },
      { x: blCurve1End.x, y: blCurve1End.y },
      { x: blCurve2End.x, y: blCurve2End.y },
      { x: tlStart.x, y: tlStart.y },
      { x: tlCurve1End.x, y: tlCurve1End.y },
      { x: tlCurve2End.x, y: tlCurve2End.y },
    ];

    drawDebugPoints(points, paint, "red", 2);
  }
}

/**
 * Draws a smooth cornered rectangle using Sketch's algorithm
 * @param {number} left - Left coordinate
 * @param {number} top - Top coordinate
 * @param {number} right - Right coordinate
 * @param {number} bottom - Bottom coordinate
 * @param {number} radius - Corner radius
 * @param {CanvasRenderingContext2D} paint - Canvas context
 */
function drawSketchSmoothCorners(left, top, right, bottom, radius, paint) {
  // Base constants
  const CORNER_MAX_RATIO = 128.19;
  const CONTROL_HANDLE_RATIO = 83.62;
  const CONTROL_POINTS_RATIO = {
    handleLarge: 67.45,
    distanceOuter: 51.16,
    distanceInner: 34.86,
    handleMedium: 22.07,
    curveInner: 13.36,
    curveOuter: 4.64,
  };

  // Basic dimension calculations
  const width = right - left;
  const height = bottom - top;
  const minDimension = Math.min(width, height) / 2;
  const radiusRatio = radius / minDimension;

  // Special case: when no radius or radius is too large, fallback to regular rounded rect
  if (radius === 0 || radius >= 0.5 * minDimension) {
    drawRoundRect(left, top, right, bottom, radius, paint);
    return;
  }

  // Calculate endpoint ratio
  let endpointRatio = 1;
  if (radiusRatio > 0.5) {
    const percentage = (radiusRatio - 0.5) / 0.4;
    const clampedPercentage = Math.min(1, percentage);
    endpointRatio = 1 - (1 - 1.104 / 1.2819) * clampedPercentage;
  }

  // Calculate control point ratio
  let controlRatio = 1;
  if (radiusRatio > 0.6) {
    const percentage = (radiusRatio - 0.6) / 0.3;
    const clampedPercentage = Math.min(1, percentage);
    controlRatio = 1 + (0.8717 / 0.8362 - 1) * clampedPercentage;
  }

  // Pre-calculate all radius-related values
  const radiusUnit = radius / 100;
  const cornerDistance = radiusUnit * CORNER_MAX_RATIO * endpointRatio;
  const controlHandleDistance = radiusUnit * CONTROL_HANDLE_RATIO * controlRatio;
  const controlPoints = {
    handleLarge: radiusUnit * CONTROL_POINTS_RATIO.handleLarge,
    distanceOuter: radiusUnit * CONTROL_POINTS_RATIO.distanceOuter,
    distanceInner: radiusUnit * CONTROL_POINTS_RATIO.distanceInner,
    handleMedium: radiusUnit * CONTROL_POINTS_RATIO.handleMedium,
    curveInner: radiusUnit * CONTROL_POINTS_RATIO.curveInner,
    curveOuter: radiusUnit * CONTROL_POINTS_RATIO.curveOuter,
  };

  // Start
  paint.beginPath();

  // Starting point (center of top)
  paint.moveTo(left + width / 2, top);

  // TR corner
  const cornerEndX = Math.max(left + width / 2, right - cornerDistance);
  paint.lineTo(cornerEndX, top);

  paint.bezierCurveTo(right - controlHandleDistance, top, right - controlPoints.handleLarge, top + controlPoints.curveOuter, right - controlPoints.distanceOuter, top + controlPoints.curveInner);
  paint.bezierCurveTo(right - controlPoints.distanceInner, top + controlPoints.handleMedium, right - controlPoints.handleMedium, top + controlPoints.distanceInner, right - controlPoints.curveInner, top + controlPoints.distanceOuter);
  paint.bezierCurveTo(right - controlPoints.curveOuter, top + controlPoints.handleLarge, right, top + controlHandleDistance, right, top + Math.min(height / 2, cornerDistance));

  // BR corner
  const cornerStartY = Math.max(top + height / 2, bottom - cornerDistance);
  paint.lineTo(right, cornerStartY);

  paint.bezierCurveTo(right, bottom - controlHandleDistance, right - controlPoints.curveOuter, bottom - controlPoints.handleLarge, right - controlPoints.curveInner, bottom - controlPoints.distanceOuter);
  paint.bezierCurveTo(right - controlPoints.handleMedium, bottom - controlPoints.distanceInner, right - controlPoints.distanceInner, bottom - controlPoints.handleMedium, right - controlPoints.distanceOuter, bottom - controlPoints.curveInner);
  paint.bezierCurveTo(right - controlPoints.handleLarge, bottom - controlPoints.curveOuter, right - controlHandleDistance, bottom, Math.max(left + width / 2, right - cornerDistance), bottom);

  // BL corner
  const cornerEndX2 = Math.min(left + width / 2, left + cornerDistance);
  paint.lineTo(cornerEndX2, bottom);

  paint.bezierCurveTo(left + controlHandleDistance, bottom, left + controlPoints.handleLarge, bottom - controlPoints.curveOuter, left + controlPoints.distanceOuter, bottom - controlPoints.curveInner);
  paint.bezierCurveTo(left + controlPoints.distanceInner, bottom - controlPoints.handleMedium, left + controlPoints.handleMedium, bottom - controlPoints.distanceInner, left + controlPoints.curveInner, bottom - controlPoints.distanceOuter);
  paint.bezierCurveTo(left + controlPoints.curveOuter, bottom - controlPoints.handleLarge, left, bottom - controlHandleDistance, left, Math.max(top + height / 2, bottom - cornerDistance));

  // TL corner
  const cornerEndY2 = Math.min(top + height / 2, top + cornerDistance);
  paint.lineTo(left, cornerEndY2);

  paint.bezierCurveTo(left, top + controlHandleDistance, left + controlPoints.curveOuter, top + controlPoints.handleLarge, left + controlPoints.curveInner, top + controlPoints.distanceOuter);
  paint.bezierCurveTo(left + controlPoints.handleMedium, top + controlPoints.distanceInner, left + controlPoints.distanceInner, top + controlPoints.handleMedium, left + controlPoints.distanceOuter, top + controlPoints.curveInner);
  paint.bezierCurveTo(left + controlPoints.handleLarge, top + controlPoints.curveOuter, left + controlHandleDistance, top, Math.min(left + width / 2, left + cornerDistance), top);

  // Complete
  paint.closePath();
}

/**
 * Draws a smooth cornered rectangle using quadratic curves
 * @param {number} left - Left coordinate
 * @param {number} top - Top coordinate
 * @param {number} right - Right coordinate
 * @param {number} bottom - Bottom coordinate
 * @param {number} radius - Corner radius
 * @param {CanvasRenderingContext2D} paint - Canvas context
 */
function drawQuadSmoothCorners(left, top, right, bottom, radius, paint) {
  const CORNER_CORRECTION_FACTOR = 1.175; // Correction factor to make corners more accurate

  // Basic dimension calculations
  const width = right - left;
  const height = bottom - top;
  const minDimension = Math.min(width, height);

  // Special case: when no radius or radius is too large, fallback to regular rounded rect
  if (radius === 0 || radius >= 0.375 * minDimension) {
    drawRoundRect(left, top, right, bottom, radius, paint);
    return;
  }

  // Ensure radius is within valid range
  const maxCornerSize = minDimension / 2;
  const cornerSize = Math.min(maxCornerSize, radius * CORNER_CORRECTION_FACTOR);

  // Start
  paint.beginPath();

  // Starting point (center of right edge)
  paint.moveTo(right, top + cornerSize);

  // Right edge (going down)
  paint.lineTo(right, bottom - cornerSize);

  // BR corner
  paint.quadraticCurveTo(right, bottom, right - cornerSize, bottom);

  // Bottom edge
  paint.lineTo(left + cornerSize, bottom);

  // BL corner
  paint.quadraticCurveTo(left, bottom, left, bottom - cornerSize);

  // Left edge
  paint.lineTo(left, top + cornerSize);

  // TL corner
  paint.quadraticCurveTo(left, top, left + cornerSize, top);

  // Top edge
  paint.lineTo(right - cornerSize, top);

  // TR corner
  paint.quadraticCurveTo(right, top, right, top + cornerSize);

  // Complete
  paint.closePath();
}
