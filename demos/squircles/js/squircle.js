/**
 * Draws a rounded rectangle with specified dimensions and radius
 * @param {CanvasRenderingContext2D} paint - Canvas context
 * @param {number} left - Left coordinate
 * @param {number} top - Top coordinate
 * @param {number} right - Right coordinate
 * @param {number} bottom - Bottom coordinate
 * @param {number} radius - Corner radius
 */
function drawRoundRect(paint, left, top, right, bottom, radius) {
  const width = right - left;
  const height = bottom - top;
  
  paint.beginPath();
  paint.roundRect(left, top, width, height, radius);
  paint.closePath();

  const debugPoints = [
    { x: left + radius, y: top },
    { x: right - radius, y: top },
    { x: right, y: top + radius },
    { x: right, y: bottom - radius },
    { x: right - radius, y: bottom },
    { x: left + radius, y: bottom },
    { x: left, y: bottom - radius },
    { x: left, y: top + radius },
  ];

  return debugPoints;
}

/**
 * Draws a smooth cornered rectangle using Figma's algorithm
 * @param {CanvasRenderingContext2D} paint - Canvas context
 * @param {number} left - Left coordinate
 * @param {number} top - Top coordinate
 * @param {number} right - Right coordinate
 * @param {number} bottom - Bottom coordinate
 * @param {number} radius - Corner radius
 * @param {number} smoothness - Corner smoothness (0-1)
 */
function drawFigmaSmoothCorners(paint, left, top, right, bottom, radius, smoothness = 0.6) {
  const DEGREES_TO_RADIANS = Math.PI / 180;

  // Basic dimension calculations
  const width = right - left;
  const height = bottom - top;
  const minDimension = Math.min(width, height);

  // Special case: when no radius or radius is too large, fallback to regular rounded rect
  if (radius === 0 || radius >= 0.5 * minDimension) {
    drawRoundRect(paint, left, top, right, bottom, radius);
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
  const startPoint = { x: left + width / 2, y: top };

  // TR corner points
  const trCurve1Start = { x: right - cornerSize, y: top };
  const trCurve1Cp1 = { x: right - (cornerSize - handleLarge), y: top };
  const trCurve1Cp2 = { x: right - (cornerSize - handleLarge - handleSmall), y: top };
  const trCurve1End = { x: right - (cornerSize - handleLarge - handleSmall - controlLength), y: top + controlHeight };

  const trArcCenter = { x: right - radius, y: top + radius };
  const trArcStart = theta + 270;
  const trArcEnd = 360 - theta;

  const trCurve2Start = { x: right - controlHeight, y: top + (cornerSize - handleLarge - handleSmall - controlLength) };
  const trCurve2Cp1 = { x: right, y: top + (cornerSize - handleLarge - handleSmall) };
  const trCurve2Cp2 = { x: right, y: top + (cornerSize - handleLarge) };
  const trCurve2End = { x: right, y: top + cornerSize };

  // BR corner points
  const brCurve1Start = { x: right, y: bottom - cornerSize };
  const brCurve1Cp1 = { x: right, y: bottom - (cornerSize - handleLarge) };
  const brCurve1Cp2 = { x: right, y: bottom - (cornerSize - handleLarge - handleSmall) };
  const brCurve1End = { x: right - controlHeight, y: bottom - (cornerSize - handleLarge - handleSmall - controlLength) };

  const brArcCenter = { x: right - radius, y: bottom - radius };
  const brArcStart = theta;
  const brArcEnd = 90 - theta;

  const brCurve2Start = { x: right - (cornerSize - handleLarge - handleSmall - controlLength), y: bottom - controlHeight };
  const brCurve2Cp1 = { x: right - (cornerSize - handleLarge - handleSmall), y: bottom };
  const brCurve2Cp2 = { x: right - (cornerSize - handleLarge), y: bottom };
  const brCurve2End = { x: right - cornerSize, y: bottom };

  // BL corner points
  const blCurve1Start = { x: left + cornerSize, y: bottom };
  const blCurve1Cp1 = { x: left + (cornerSize - handleLarge), y: bottom };
  const blCurve1Cp2 = { x: left + (cornerSize - handleLarge - handleSmall), y: bottom };
  const blCurve1End = { x: left + (cornerSize - handleLarge - handleSmall - controlLength), y: bottom - controlHeight };

  const blArcCenter = { x: left + radius, y: bottom - radius };
  const blArcStart = 90 + theta;
  const blArcEnd = 180 - theta;

  const blCurve2Start = { x: left + controlHeight, y: bottom - (cornerSize - handleLarge - handleSmall - controlLength) };
  const blCurve2Cp1 = { x: left, y: bottom - (cornerSize - handleLarge - handleSmall) };
  const blCurve2Cp2 = { x: left, y: bottom - (cornerSize - handleLarge) };
  const blCurve2End = { x: left, y: bottom - cornerSize };

  // TL corner points
  const tlCurve1Start = { x: left, y: top + cornerSize };
  const tlCurve1Cp1 = { x: left, y: top + (cornerSize - handleLarge) };
  const tlCurve1Cp2 = { x: left, y: top + (cornerSize - handleLarge - handleSmall) };
  const tlCurve1End = { x: left + controlHeight, y: top + (cornerSize - handleLarge - handleSmall - controlLength) };

  const tlArcCenter = { x: left + radius, y: top + radius };
  const tlArcStart = 180 + theta;
  const tlArcEnd = 270 - theta;

  const tlCurve2Start = { x: left + (cornerSize - handleLarge - handleSmall - controlLength), y: top + controlHeight };
  const tlCurve2Cp1 = { x: left + (cornerSize - handleLarge - handleSmall), y: top };
  const tlCurve2Cp2 = { x: left + (cornerSize - handleLarge), y: top };
  const tlCurve2End = { x: left + cornerSize, y: top };

  // Drawing with semantic variables
  paint.beginPath();

  // Starting point (center of top edge)
  paint.moveTo(startPoint.x, startPoint.y);

  // TR corner
  paint.lineTo(trCurve1Start.x, trCurve1Start.y);
  paint.bezierCurveTo(trCurve1Cp1.x, trCurve1Cp1.y, trCurve1Cp2.x, trCurve1Cp2.y, trCurve1End.x, trCurve1End.y);
  paint.arc(trArcCenter.x, trArcCenter.y, radius, trArcStart * DEGREES_TO_RADIANS, trArcEnd * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(trCurve2Cp1.x, trCurve2Cp1.y, trCurve2Cp2.x, trCurve2Cp2.y, trCurve2End.x, trCurve2End.y);

  // BR corner
  paint.lineTo(brCurve1Start.x, brCurve1Start.y);
  paint.bezierCurveTo(brCurve1Cp1.x, brCurve1Cp1.y, brCurve1Cp2.x, brCurve1Cp2.y, brCurve1End.x, brCurve1End.y);
  paint.arc(brArcCenter.x, brArcCenter.y, radius, brArcStart * DEGREES_TO_RADIANS, brArcEnd * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(brCurve2Cp1.x, brCurve2Cp1.y, brCurve2Cp2.x, brCurve2Cp2.y, brCurve2End.x, brCurve2End.y);

  // BL corner
  paint.lineTo(blCurve1Start.x, blCurve1Start.y);
  paint.bezierCurveTo(blCurve1Cp1.x, blCurve1Cp1.y, blCurve1Cp2.x, blCurve1Cp2.y, blCurve1End.x, blCurve1End.y);
  paint.arc(blArcCenter.x, blArcCenter.y, radius, blArcStart * DEGREES_TO_RADIANS, blArcEnd * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(blCurve2Cp1.x, blCurve2Cp1.y, blCurve2Cp2.x, blCurve2Cp2.y, blCurve2End.x, blCurve2End.y);

  // TL corner
  paint.lineTo(tlCurve1Start.x, tlCurve1Start.y);
  paint.bezierCurveTo(tlCurve1Cp1.x, tlCurve1Cp1.y, tlCurve1Cp2.x, tlCurve1Cp2.y, tlCurve1End.x, tlCurve1End.y);
  paint.arc(tlArcCenter.x, tlArcCenter.y, radius, tlArcStart * DEGREES_TO_RADIANS, tlArcEnd * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(tlCurve2Cp1.x, tlCurve2Cp1.y, tlCurve2Cp2.x, tlCurve2Cp2.y, tlCurve2End.x, tlCurve2End.y);

  paint.closePath();

  const debugPoints = [trCurve1Start, trCurve1End, trCurve2Start, trCurve2End, brCurve1Start, brCurve1End, brCurve2Start, brCurve2End, blCurve1Start, blCurve1End, blCurve2Start, blCurve2End, tlCurve1Start, tlCurve1End, tlCurve2Start, tlCurve2End];

  return debugPoints;
}

/**
 * Draws a smooth cornered rectangle using Sketch's algorithm
 * @param {CanvasRenderingContext2D} paint - Canvas context
 * @param {number} left - Left coordinate
 * @param {number} top - Top coordinate
 * @param {number} right - Right coordinate
 * @param {number} bottom - Bottom coordinate
 * @param {number} radius - Corner radius
 */
function drawSketchSmoothCorners(paint, left, top, right, bottom, radius) {
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
    drawRoundRect(paint, left, top, right, bottom, radius);
    return [];
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

  // Define all points with semantic names
  const startPoint = { x: left + width / 2, y: top };

  // TR corner points
  const trCurve1Start = { x: Math.max(left + width / 2, right - cornerDistance), y: top };
  const trCurve1Cp1 = { x: right - controlHandleDistance, y: top };
  const trCurve1Cp2 = { x: right - controlPoints.handleLarge, y: top + controlPoints.curveOuter };
  const trCurve1End = { x: right - controlPoints.distanceOuter, y: top + controlPoints.curveInner };

  const trCurve2Cp1 = { x: right - controlPoints.distanceInner, y: top + controlPoints.handleMedium };
  const trCurve2Cp2 = { x: right - controlPoints.handleMedium, y: top + controlPoints.distanceInner };
  const trCurve2End = { x: right - controlPoints.curveInner, y: top + controlPoints.distanceOuter };

  const trCurve3Cp1 = { x: right - controlPoints.curveOuter, y: top + controlPoints.handleLarge };
  const trCurve3Cp2 = { x: right, y: top + controlHandleDistance };
  const trCurve3End = { x: right, y: top + Math.min(height / 2, cornerDistance) };

  // BR corner points
  const brCurve1Start = { x: right, y: Math.max(top + height / 2, bottom - cornerDistance) };
  const brCurve1Cp1 = { x: right, y: bottom - controlHandleDistance };
  const brCurve1Cp2 = { x: right - controlPoints.curveOuter, y: bottom - controlPoints.handleLarge };
  const brCurve1End = { x: right - controlPoints.curveInner, y: bottom - controlPoints.distanceOuter };

  const brCurve2Cp1 = { x: right - controlPoints.handleMedium, y: bottom - controlPoints.distanceInner };
  const brCurve2Cp2 = { x: right - controlPoints.distanceInner, y: bottom - controlPoints.handleMedium };
  const brCurve2End = { x: right - controlPoints.distanceOuter, y: bottom - controlPoints.curveInner };

  const brCurve3Cp1 = { x: right - controlPoints.handleLarge, y: bottom - controlPoints.curveOuter };
  const brCurve3Cp2 = { x: right - controlHandleDistance, y: bottom };
  const brCurve3End = { x: Math.max(left + width / 2, right - cornerDistance), y: bottom };

  // BL corner points
  const blCurve1Start = { x: Math.min(left + width / 2, left + cornerDistance), y: bottom };
  const blCurve1Cp1 = { x: left + controlHandleDistance, y: bottom };
  const blCurve1Cp2 = { x: left + controlPoints.handleLarge, y: bottom - controlPoints.curveOuter };
  const blCurve1End = { x: left + controlPoints.distanceOuter, y: bottom - controlPoints.curveInner };

  const blCurve2Cp1 = { x: left + controlPoints.distanceInner, y: bottom - controlPoints.handleMedium };
  const blCurve2Cp2 = { x: left + controlPoints.handleMedium, y: bottom - controlPoints.distanceInner };
  const blCurve2End = { x: left + controlPoints.curveInner, y: bottom - controlPoints.distanceOuter };

  const blCurve3Cp1 = { x: left + controlPoints.curveOuter, y: bottom - controlPoints.handleLarge };
  const blCurve3Cp2 = { x: left, y: bottom - controlHandleDistance };
  const blCurve3End = { x: left, y: Math.max(top + height / 2, bottom - cornerDistance) };

  // TL corner points
  const tlCurve1Start = { x: left, y: Math.min(top + height / 2, top + cornerDistance) };
  const tlCurve1Cp1 = { x: left, y: top + controlHandleDistance };
  const tlCurve1Cp2 = { x: left + controlPoints.curveOuter, y: top + controlPoints.handleLarge };
  const tlCurve1End = { x: left + controlPoints.curveInner, y: top + controlPoints.distanceOuter };

  const tlCurve2Cp1 = { x: left + controlPoints.handleMedium, y: top + controlPoints.distanceInner };
  const tlCurve2Cp2 = { x: left + controlPoints.distanceInner, y: top + controlPoints.handleMedium };
  const tlCurve2End = { x: left + controlPoints.distanceOuter, y: top + controlPoints.curveInner };

  const tlCurve3Cp1 = { x: left + controlPoints.handleLarge, y: top + controlPoints.curveOuter };
  const tlCurve3Cp2 = { x: left + controlHandleDistance, y: top };
  const tlCurve3End = { x: Math.min(left + width / 2, left + cornerDistance), y: top };

  // Drawing path
  paint.beginPath();
  paint.moveTo(startPoint.x, startPoint.y);

  // TR corner
  paint.lineTo(trCurve1Start.x, trCurve1Start.y);
  paint.bezierCurveTo(trCurve1Cp1.x, trCurve1Cp1.y, trCurve1Cp2.x, trCurve1Cp2.y, trCurve1End.x, trCurve1End.y);
  paint.bezierCurveTo(trCurve2Cp1.x, trCurve2Cp1.y, trCurve2Cp2.x, trCurve2Cp2.y, trCurve2End.x, trCurve2End.y);
  paint.bezierCurveTo(trCurve3Cp1.x, trCurve3Cp1.y, trCurve3Cp2.x, trCurve3Cp2.y, trCurve3End.x, trCurve3End.y);

  // BR corner
  paint.lineTo(brCurve1Start.x, brCurve1Start.y);
  paint.bezierCurveTo(brCurve1Cp1.x, brCurve1Cp1.y, brCurve1Cp2.x, brCurve1Cp2.y, brCurve1End.x, brCurve1End.y);
  paint.bezierCurveTo(brCurve2Cp1.x, brCurve2Cp1.y, brCurve2Cp2.x, brCurve2Cp2.y, brCurve2End.x, brCurve2End.y);
  paint.bezierCurveTo(brCurve3Cp1.x, brCurve3Cp1.y, brCurve3Cp2.x, brCurve3Cp2.y, brCurve3End.x, brCurve3End.y);

  // BL corner
  paint.lineTo(blCurve1Start.x, blCurve1Start.y);
  paint.bezierCurveTo(blCurve1Cp1.x, blCurve1Cp1.y, blCurve1Cp2.x, blCurve1Cp2.y, blCurve1End.x, blCurve1End.y);
  paint.bezierCurveTo(blCurve2Cp1.x, blCurve2Cp1.y, blCurve2Cp2.x, blCurve2Cp2.y, blCurve2End.x, blCurve2End.y);
  paint.bezierCurveTo(blCurve3Cp1.x, blCurve3Cp1.y, blCurve3Cp2.x, blCurve3Cp2.y, blCurve3End.x, blCurve3End.y);

  // TL corner
  paint.lineTo(tlCurve1Start.x, tlCurve1Start.y);
  paint.bezierCurveTo(tlCurve1Cp1.x, tlCurve1Cp1.y, tlCurve1Cp2.x, tlCurve1Cp2.y, tlCurve1End.x, tlCurve1End.y);
  paint.bezierCurveTo(tlCurve2Cp1.x, tlCurve2Cp1.y, tlCurve2Cp2.x, tlCurve2Cp2.y, tlCurve2End.x, tlCurve2End.y);
  paint.bezierCurveTo(tlCurve3Cp1.x, tlCurve3Cp1.y, tlCurve3Cp2.x, tlCurve3Cp2.y, tlCurve3End.x, tlCurve3End.y);

  paint.closePath();

  // Return debug points
  const debugPoints = [trCurve1Start, trCurve1End, trCurve2End, trCurve3End, brCurve1Start, brCurve1End, brCurve2End, brCurve3End, blCurve1Start, blCurve1End, blCurve2End, blCurve3End, tlCurve1Start, tlCurve1End, tlCurve2End, tlCurve3End];

  return debugPoints;
}

/**
 * Draws a smooth cornered rectangle using quadratic curves
 * @param {CanvasRenderingContext2D} paint - Canvas context
 * @param {number} left - Left coordinate
 * @param {number} top - Top coordinate
 * @param {number} right - Right coordinate
 * @param {number} bottom - Bottom coordinate
 * @param {number} radius - Corner radius
 */
function drawQuadSmoothCorners(paint, left, top, right, bottom, radius) {
  const CORNER_CORRECTION_FACTOR = 1.175; // Correction factor to make corners more accurate

  // Basic dimension calculations
  const width = right - left;
  const height = bottom - top;
  const minDimension = Math.min(width, height);

  // Special case: when no radius or radius is too large, fallback to regular rounded rect
  if (radius === 0 || radius >= 0.375 * minDimension) {
    drawRoundRect(paint, left, top, right, bottom, radius);
    return;
  }

  // Ensure radius is within valid range
  const maxCornerSize = minDimension / 2;
  const cornerSize = Math.min(maxCornerSize, radius * CORNER_CORRECTION_FACTOR);

  const startPoint = { x: right, y: top + cornerSize };

  const brStart = { x: right, y: bottom - cornerSize };
  const brCp = { x: right, y: bottom };
  const brEnd = { x: right - cornerSize, y: bottom };

  const blStart = { x: left + cornerSize, y: bottom };
  const blCp = { x: left, y: bottom };
  const blEnd = { x: left, y: bottom - cornerSize };

  const tlStart = { x: left, y: top + cornerSize };
  const tlCp = { x: left, y: top };
  const tlEnd = { x: left + cornerSize, y: top };

  const trStart = { x: right - cornerSize, y: top };
  const trCp = { x: right, y: top };
  const trEnd = { x: right, y: top + cornerSize };

  // Start
  paint.beginPath();

  // Starting point (center of right edge)
  paint.moveTo(startPoint.x, startPoint.y);

  // BR corner
  paint.lineTo(brStart.x, brStart.y);
  paint.quadraticCurveTo(brCp.x, brCp.y, brEnd.x, brEnd.y);

  // BL corner
  paint.lineTo(blStart.x, blStart.y);
  paint.quadraticCurveTo(blCp.x, blCp.y, blEnd.x, blEnd.y);

  // TL corner
  paint.lineTo(tlStart.x, tlStart.y);
  paint.quadraticCurveTo(tlCp.x, tlCp.y, tlEnd.x, tlEnd.y);

  // TR corner
  paint.lineTo(trStart.x, trStart.y);
  paint.quadraticCurveTo(trCp.x, trCp.y, trEnd.x, trEnd.y);

  // Complete
  paint.closePath();

  const debugPoints = [brStart, brEnd, blStart, blEnd, tlStart, tlEnd, trStart, trEnd];

  return debugPoints;
}
