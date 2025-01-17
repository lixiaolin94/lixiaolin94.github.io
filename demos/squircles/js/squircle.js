function drawRoundRect(left, top, right, bottom, radius, paint) {
  const width = right - left;
  const height = bottom - top;
  paint.beginPath();
  paint.roundRect(left, top, width, height, radius);
  paint.closePath();
}

function drawFigmaSmoothCorners(left, top, right, bottom, radius, smoothness = 0.6, paint) {
  const DEGREES_TO_RADIANS = Math.PI / 180;

  // 基础尺寸计算
  const width = right - left;
  const height = bottom - top;
  const minDimension = Math.min(width, height);

  // 特殊情况处理：当尺寸过小或无圆角时，退化为普通圆角矩形
  if (minDimension <= 2 * radius || radius === 0) {
    drawRoundRect(left, top, right, bottom, radius, paint);
    return;
  }

  // 计算圆角最大尺寸
  const maxCornerSize = minDimension / 2;
  const cornerSize = Math.min(maxCornerSize, (1 + smoothness) * radius);

  // 计算平滑角度
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

  // 计算控制点参数
  const theta = (90 - cornerAngle) / 2;
  const controlRatio = Math.tan(smoothAngle * DEGREES_TO_RADIANS);
  const handleLength = radius * Math.tan((theta / 2) * DEGREES_TO_RADIANS);

  const arcLength = Math.sin((cornerAngle / 2) * DEGREES_TO_RADIANS) * radius * Math.sqrt(2);
  const controlLength = handleLength * Math.cos(smoothAngle * DEGREES_TO_RADIANS);
  const controlHeight = controlLength * controlRatio;

  const handleSmall = (cornerSize - arcLength - (1 + controlRatio) * controlLength) / 3;
  const handleLarge = 2 * handleSmall;

  // 开始
  paint.beginPath();

  // 起点（上边中点）
  paint.moveTo(left + width / 2, top);

  // 右上角
  paint.lineTo(right - cornerSize, top);
  paint.bezierCurveTo(
    right - (cornerSize - handleLarge),
    top,
    right - (cornerSize - handleLarge - handleSmall),
    top,
    right - (cornerSize - handleLarge - handleSmall - controlLength),
    top + controlHeight
  );
  paint.arc(right - radius, top + radius, radius, (270 + theta) * DEGREES_TO_RADIANS, (360 - theta) * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(right, top + (cornerSize - handleLarge - handleSmall), right, top + (cornerSize - handleLarge), right, top + cornerSize);

  // 右下角
  paint.lineTo(right, bottom - cornerSize);
  paint.bezierCurveTo(
    right,
    bottom - (cornerSize - handleLarge),
    right,
    bottom - (cornerSize - handleLarge - handleSmall),
    right - controlHeight,
    bottom - (cornerSize - handleLarge - handleSmall - controlLength)
  );
  paint.arc(right - radius, bottom - radius, radius, (0 + theta) * DEGREES_TO_RADIANS, (90 - theta) * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(right - (cornerSize - handleLarge - handleSmall), bottom, right - (cornerSize - handleLarge), bottom, right - cornerSize, bottom);

  // 左下角
  paint.lineTo(left + cornerSize, bottom);
  paint.bezierCurveTo(
    left + (cornerSize - handleLarge),
    bottom,
    left + (cornerSize - handleLarge - handleSmall),
    bottom,
    left + (cornerSize - handleLarge - handleSmall - controlLength),
    bottom - controlHeight
  );
  paint.arc(left + radius, bottom - radius, radius, (90 + theta) * DEGREES_TO_RADIANS, (180 - theta) * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(left, bottom - (cornerSize - handleLarge - handleSmall), left, bottom - (cornerSize - handleLarge), left, bottom - cornerSize);

  // 左上角
  paint.lineTo(left, top + cornerSize);
  paint.bezierCurveTo(
    left,
    top + (cornerSize - handleLarge),
    left,
    top + (cornerSize - handleLarge - handleSmall),
    left + controlHeight,
    top + (cornerSize - handleLarge - handleSmall - controlLength)
  );
  paint.arc(left + radius, top + radius, radius, (180 + theta) * DEGREES_TO_RADIANS, (270 - theta) * DEGREES_TO_RADIANS, false);
  paint.bezierCurveTo(left + (cornerSize - handleLarge - handleSmall), top, left + (cornerSize - handleLarge), top, left + cornerSize, top);

  // 完成
  paint.closePath();
}

function drawSketchSmoothCorners(left, top, right, bottom, radius, paint) {
  // 基础常量定义
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

  // 基础尺寸计算
  const width = right - left;
  const height = bottom - top;
  const minDimension = Math.min(width, height) / 2;
  const radiusRatio = radius / minDimension;

  // 特殊情况处理：当尺寸过小或无圆角时，退化为普通圆角矩形
  if (minDimension <= 2 * radius || radius === 0) {
    drawRoundRect(left, top, right, bottom, radius, paint);
    return;
  }

  // 计算端点比例
  let endpointRatio = 1;
  if (radiusRatio > 0.5) {
    const percentage = (radiusRatio - 0.5) / 0.4;
    const clampedPercentage = Math.min(1, percentage);
    endpointRatio = 1 - (1 - 1.104 / 1.2819) * clampedPercentage;
  }

  // 计算控制点比例
  let controlRatio = 1;
  if (radiusRatio > 0.6) {
    const percentage = (radiusRatio - 0.6) / 0.3;
    const clampedPercentage = Math.min(1, percentage);
    controlRatio = 1 + (0.8717 / 0.8362 - 1) * clampedPercentage;
  }

  // 预计算所有radius相关的值
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

  // 开始
  paint.beginPath();

  // 起点（上边中点）
  paint.moveTo(left + width / 2, top);

  // 右上角
  const cornerEndX = Math.max(left + width / 2, right - cornerDistance);
  paint.lineTo(cornerEndX, top);

  paint.bezierCurveTo(
    right - controlHandleDistance,
    top,
    right - controlPoints.handleLarge,
    top + controlPoints.curveOuter,
    right - controlPoints.distanceOuter,
    top + controlPoints.curveInner
  );
  paint.bezierCurveTo(
    right - controlPoints.distanceInner,
    top + controlPoints.handleMedium,
    right - controlPoints.handleMedium,
    top + controlPoints.distanceInner,
    right - controlPoints.curveInner,
    top + controlPoints.distanceOuter
  );
  paint.bezierCurveTo(
    right - controlPoints.curveOuter,
    top + controlPoints.handleLarge,
    right,
    top + controlHandleDistance,
    right,
    top + Math.min(height / 2, cornerDistance)
  );

  // 右下角
  const cornerStartY = Math.max(top + height / 2, bottom - cornerDistance);
  paint.lineTo(right, cornerStartY);

  paint.bezierCurveTo(
    right,
    bottom - controlHandleDistance,
    right - controlPoints.curveOuter,
    bottom - controlPoints.handleLarge,
    right - controlPoints.curveInner,
    bottom - controlPoints.distanceOuter
  );
  paint.bezierCurveTo(
    right - controlPoints.handleMedium,
    bottom - controlPoints.distanceInner,
    right - controlPoints.distanceInner,
    bottom - controlPoints.handleMedium,
    right - controlPoints.distanceOuter,
    bottom - controlPoints.curveInner
  );
  paint.bezierCurveTo(
    right - controlPoints.handleLarge,
    bottom - controlPoints.curveOuter,
    right - controlHandleDistance,
    bottom,
    Math.max(left + width / 2, right - cornerDistance),
    bottom
  );

  // 左下角
  const cornerEndX2 = Math.min(left + width / 2, left + cornerDistance);
  paint.lineTo(cornerEndX2, bottom);

  paint.bezierCurveTo(
    left + controlHandleDistance,
    bottom,
    left + controlPoints.handleLarge,
    bottom - controlPoints.curveOuter,
    left + controlPoints.distanceOuter,
    bottom - controlPoints.curveInner
  );
  paint.bezierCurveTo(
    left + controlPoints.distanceInner,
    bottom - controlPoints.handleMedium,
    left + controlPoints.handleMedium,
    bottom - controlPoints.distanceInner,
    left + controlPoints.curveInner,
    bottom - controlPoints.distanceOuter
  );
  paint.bezierCurveTo(
    left + controlPoints.curveOuter,
    bottom - controlPoints.handleLarge,
    left,
    bottom - controlHandleDistance,
    left,
    Math.max(top + height / 2, bottom - cornerDistance)
  );

  // 左上角
  const cornerEndY2 = Math.min(top + height / 2, top + cornerDistance);
  paint.lineTo(left, cornerEndY2);

  paint.bezierCurveTo(
    left,
    top + controlHandleDistance,
    left + controlPoints.curveOuter,
    top + controlPoints.handleLarge,
    left + controlPoints.curveInner,
    top + controlPoints.distanceOuter
  );
  paint.bezierCurveTo(
    left + controlPoints.handleMedium,
    top + controlPoints.distanceInner,
    left + controlPoints.distanceInner,
    top + controlPoints.handleMedium,
    left + controlPoints.distanceOuter,
    top + controlPoints.curveInner
  );
  paint.bezierCurveTo(
    left + controlPoints.handleLarge,
    top + controlPoints.curveOuter,
    left + controlHandleDistance,
    top,
    Math.min(left + width / 2, left + cornerDistance),
    top
  );

  paint.closePath();
}

function drawQuadSmoothCorners(left, top, right, bottom, radius, paint) {
  // 基础尺寸计算
  const width = right - left;
  const height = bottom - top;

  // 确保半径在合理范围内
  const maxRadius = Math.min(width, height) / 2;
  const rx = Math.min(Math.max(0, radius), maxRadius);
  const ry = rx; // 保持圆角为正圆形

  // 开始
  paint.beginPath();

  // 起点（右边中点）
  paint.moveTo(right, top + ry);

  // 右上角
  paint.quadraticCurveTo(right, top, right - rx, top);

  // 上边
  paint.lineTo(left + rx, top);

  // 左上角
  paint.quadraticCurveTo(left, top, left, top + ry);

  // 左边
  paint.lineTo(left, bottom - ry);

  // 左下角
  paint.quadraticCurveTo(left, bottom, left + rx, bottom);

  // 底边
  paint.lineTo(right - rx, bottom);

  // 右下角
  paint.quadraticCurveTo(right, bottom, right, bottom - ry);

  // 右边
  paint.lineTo(right, top + ry);

  paint.closePath();
}
