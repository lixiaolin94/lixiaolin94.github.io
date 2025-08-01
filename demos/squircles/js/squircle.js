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
function drawQuadSmoothRoundRect(paint, left, top, right, bottom, radius) {
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

  paint.beginPath();
  paint.moveTo(right, top + cornerSize);

  // BR corner
  paint.lineTo(right, bottom - cornerSize);
  paint.quadraticCurveTo(right, bottom, right - cornerSize, bottom);

  // BL corner
  paint.lineTo(left + cornerSize, bottom);
  paint.quadraticCurveTo(left, bottom, left, bottom - cornerSize);

  // TL corner
  paint.lineTo(left, top + cornerSize);
  paint.quadraticCurveTo(left, top, left + cornerSize, top);

  // TR corner
  paint.lineTo(right - cornerSize, top);
  paint.quadraticCurveTo(right, top, right, top + cornerSize);

  paint.closePath();
}

/**
 * Draws a smooth cornered rectangle based on Android's implementation
 * @param {CanvasRenderingContext2D} paint - Canvas context
 * @param {number} left - Left coordinate
 * @param {number} top - Top coordinate
 * @param {number} right - Right coordinate
 * @param {number} bottom - Bottom coordinate
 * @param {number} radius - Corner radius (applied to all corners)
 * @param {number} smoothness - Corner smoothness (0-1)
 */
function drawSmoothRoundRect(paint, left, top, right, bottom, radius, smoothness = 0.6) {
  // Bezier constants for smooth corners
  const BEZIER_RADIANS = Math.PI / 4;
  const SIN_VALUE = Math.sin(BEZIER_RADIANS);
  const COS_VALUE = Math.cos(BEZIER_RADIANS);
  const BEZIER_A = 1 - SIN_VALUE / (1 + COS_VALUE);
  const BEZIER_D = 1.5 * SIN_VALUE / (1 + COS_VALUE) / (1 + COS_VALUE);
  const BEZIER_AD = BEZIER_A + BEZIER_D;
  const BEZIER_OFFSET = 1 - SIN_VALUE;

  const width = right - left;
  const height = bottom - top;
  const centerX = width / 2;
  const centerY = height / 2;

  // Clamp radius to valid bounds
  const clampedRadius = Math.max(0, Math.min(radius, Math.min(centerX, centerY)));

  // If radius is zero, draw simple rectangle
  if (clampedRadius <= 0) {
    paint.beginPath();
    paint.rect(left, top, width, height);
    paint.closePath();
    return;
  }

  // Calculate extensions for smooth transitions
  const calculateExtension = (r, centerDistance, s) => {
    const extension = r * s;
    const maxExtension = centerDistance - r;
    return Math.min(extension, maxExtension);
  };

  const dx = calculateExtension(clampedRadius, centerX, smoothness);
  const dy = calculateExtension(clampedRadius, centerY, smoothness);

  paint.beginPath();

  // Start from right edge, moving upward
  paint.moveTo(right, bottom - clampedRadius - dy);
  paint.lineTo(right, top + clampedRadius + dy);

  // Top right corner
  if (clampedRadius > 0) {
    paint.bezierCurveTo(
      right,
      top + clampedRadius * BEZIER_AD,
      right,
      top + clampedRadius * BEZIER_A,
      right - clampedRadius * BEZIER_OFFSET,
      top + clampedRadius * BEZIER_OFFSET
    );
    paint.bezierCurveTo(
      right - clampedRadius * BEZIER_A,
      top,
      right - clampedRadius * BEZIER_AD,
      top,
      right - clampedRadius - dx,
      top
    );
  } else {
    paint.lineTo(right, top);
  }

  paint.lineTo(left + clampedRadius + dx, top);

  // Top left corner
  if (clampedRadius > 0) {
    paint.bezierCurveTo(
      left + clampedRadius * BEZIER_AD,
      top,
      left + clampedRadius * BEZIER_A,
      top,
      left + clampedRadius * BEZIER_OFFSET,
      top + clampedRadius * BEZIER_OFFSET
    );
    paint.bezierCurveTo(
      left,
      top + clampedRadius * BEZIER_A,
      left,
      top + clampedRadius * BEZIER_AD,
      left,
      top + clampedRadius + dy
    );
  } else {
    paint.lineTo(left, top);
  }

  paint.lineTo(left, bottom - clampedRadius - dy);

  // Bottom left corner
  if (clampedRadius > 0) {
    paint.bezierCurveTo(
      left,
      bottom - clampedRadius * BEZIER_AD,
      left,
      bottom - clampedRadius * BEZIER_A,
      left + clampedRadius * BEZIER_OFFSET,
      bottom - clampedRadius * BEZIER_OFFSET
    );
    paint.bezierCurveTo(
      left + clampedRadius * BEZIER_A,
      bottom,
      left + clampedRadius * BEZIER_AD,
      bottom,
      left + clampedRadius + dx,
      bottom
    );
  } else {
    paint.lineTo(left, bottom);
  }

  paint.lineTo(right - clampedRadius - dx, bottom);

  // Bottom right corner
  if (clampedRadius > 0) {
    paint.bezierCurveTo(
      right - clampedRadius * BEZIER_AD,
      bottom,
      right - clampedRadius * BEZIER_A,
      bottom,
      right - clampedRadius * BEZIER_OFFSET,
      bottom - clampedRadius * BEZIER_OFFSET
    );
    paint.bezierCurveTo(
      right,
      bottom - clampedRadius * BEZIER_A,
      right,
      bottom - clampedRadius * BEZIER_AD,
      right,
      bottom - clampedRadius - dy
    );
  } else {
    paint.lineTo(right, bottom);
  }

  paint.closePath();
}
