function Clamp(value, min, max) {
    if (value < min) {
        value = min;
    } else if (value > max) {
        value = max;
    }
    return value;
}

function Clamp01(value) {
    if (value < 0) {
        return 0;
    }
    if (value > 1) {
        return 1;
    }
    return value;
}

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
};

function radToDeg(rad) {
    return rad / (Math.PI / 180);
};

function Lerp(a, b, t) {
    return a + (b - a) * Clamp01(t);
}

function SmoothDamp(current, target, currentVelocity, smoothTime, deltaTime) {
    let maxSpeed = Infinity;

    smoothTime = Math.max(0.0001, smoothTime);
    let num = 2 / smoothTime;
    let num2 = num * deltaTime;
    let num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
    let value = current - target;
    let num4 = target;
    let num5 = maxSpeed * smoothTime;
    value = Clamp(value, 0 - num5, num5);
    target = current - value;
    let num6 = (currentVelocity + num * value) * deltaTime;
    currentVelocity = (currentVelocity - num * num6) * num3;
    let num7 = target + (value + num6) * num3;
    if (num4 - current > 0 == num7 > num4) {
        num7 = num4;
        currentVelocity = (num7 - num4) / deltaTime;
    }
    return num7;
}

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static Angle(from, to) {
        return radToDeg(Math.atan2(to.y - from.y, to.x - from.x));
    }

    static Lerp(a, b, t) {
        t = Clamp01(t);
        return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }

    static SmoothDamp(current, target, currentVelocity, smoothTime, deltaTime) {
        let maxSpeed = Infinity;

        smoothTime = Math.max(0.0001, smoothTime);
        let num = 2 / smoothTime;
        let num2 = num * deltaTime;
        let num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
        let num4 = current.x - target.x;
        let num5 = current.y - target.y;
        let vector = target;
        let num6 = maxSpeed * smoothTime;
        let num7 = num6 * num6;
        let num8 = num4 * num4 + num5 * num5;
        if (num8 > num7) {
            let num9 = Math.sqrt(num8);
            num4 = num4 / num9 * num6;
            num5 = num5 / num9 * num6;
        }
        target.x = current.x - num4;
        target.y = current.y - num5;
        let num10 = (currentVelocity.x + num * num4) * deltaTime;
        let num11 = (currentVelocity.y + num * num5) * deltaTime;
        currentVelocity.x = (currentVelocity.x - num * num10) * num3;
        currentVelocity.y = (currentVelocity.y - num * num11) * num3;
        let num12 = target.x + (num4 + num10) * num3;
        let num13 = target.y + (num5 + num11) * num3;
        let num14 = vector.x - current.x;
        let num15 = vector.y - current.y;
        let num16 = num12 - vector.x;
        let num17 = num13 - vector.y;
        if (num14 * num16 + num15 * num17 > 0) {
            num12 = vector.x;
            num13 = vector.y;
            currentVelocity.x = (num12 - vector.x) / deltaTime;
            currentVelocity.y = (num13 - vector.y) / deltaTime;
        }
        return new Vector2(num12, num13);
    }
}
