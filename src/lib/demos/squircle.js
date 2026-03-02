export function drawRoundRect(paint, left, top, right, bottom, radius) {
	const width = right - left;
	const height = bottom - top;
	paint.beginPath();
	paint.roundRect(left, top, width, height, radius);
	paint.closePath();
}

export function drawQuadSmoothRoundRect(paint, left, top, right, bottom, radius) {
	const KAPPA_QUAD = 1.17157;
	const THRESHOLD = 0.4;
	const width = right - left;
	const height = bottom - top;
	const minDimension = Math.min(width, height);

	if (radius === 0 || radius >= minDimension * THRESHOLD) {
		drawRoundRect(paint, left, top, right, bottom, radius);
		return;
	}

	const maxCornerSize = minDimension / 2;
	const cornerSize = Math.min(maxCornerSize, radius * KAPPA_QUAD);

	paint.beginPath();
	paint.moveTo(right, top + cornerSize);
	paint.lineTo(right, bottom - cornerSize);
	paint.quadraticCurveTo(right, bottom, right - cornerSize, bottom);
	paint.lineTo(left + cornerSize, bottom);
	paint.quadraticCurveTo(left, bottom, left, bottom - cornerSize);
	paint.lineTo(left, top + cornerSize);
	paint.quadraticCurveTo(left, top, left + cornerSize, top);
	paint.lineTo(right - cornerSize, top);
	paint.quadraticCurveTo(right, top, right, top + cornerSize);
	paint.closePath();
}

export function drawSmoothRoundRect(paint, left, top, right, bottom, radius, smoothness = 0.6) {
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
	const clampedRadius = Math.max(0, Math.min(radius, Math.min(centerX, centerY)));

	if (clampedRadius <= 0) {
		paint.beginPath();
		paint.rect(left, top, width, height);
		paint.closePath();
		return;
	}

	const calculateExtension = (r, centerDistance, s) => {
		const extension = r * s;
		const maxExtension = centerDistance - r;
		return Math.min(extension, maxExtension);
	};

	const dx = calculateExtension(clampedRadius, centerX, smoothness);
	const dy = calculateExtension(clampedRadius, centerY, smoothness);
	const r = clampedRadius;

	paint.beginPath();
	paint.moveTo(right, bottom - r - dy);
	paint.lineTo(right, top + r + dy);

	if (r > 0) {
		paint.bezierCurveTo(right, top + r * BEZIER_AD, right, top + r * BEZIER_A, right - r * BEZIER_OFFSET, top + r * BEZIER_OFFSET);
		paint.bezierCurveTo(right - r * BEZIER_A, top, right - r * BEZIER_AD, top, right - r - dx, top);
	} else { paint.lineTo(right, top); }

	paint.lineTo(left + r + dx, top);

	if (r > 0) {
		paint.bezierCurveTo(left + r * BEZIER_AD, top, left + r * BEZIER_A, top, left + r * BEZIER_OFFSET, top + r * BEZIER_OFFSET);
		paint.bezierCurveTo(left, top + r * BEZIER_A, left, top + r * BEZIER_AD, left, top + r + dy);
	} else { paint.lineTo(left, top); }

	paint.lineTo(left, bottom - r - dy);

	if (r > 0) {
		paint.bezierCurveTo(left, bottom - r * BEZIER_AD, left, bottom - r * BEZIER_A, left + r * BEZIER_OFFSET, bottom - r * BEZIER_OFFSET);
		paint.bezierCurveTo(left + r * BEZIER_A, bottom, left + r * BEZIER_AD, bottom, left + r + dx, bottom);
	} else { paint.lineTo(left, bottom); }

	paint.lineTo(right - r - dx, bottom);

	if (r > 0) {
		paint.bezierCurveTo(right - r * BEZIER_AD, bottom, right - r * BEZIER_A, bottom, right - r * BEZIER_OFFSET, bottom - r * BEZIER_OFFSET);
		paint.bezierCurveTo(right, bottom - r * BEZIER_A, right, bottom - r * BEZIER_AD, right, bottom - r - dy);
	} else { paint.lineTo(right, bottom); }

	paint.closePath();
}
