import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMemo, useState } from 'react';

function erf(x: number) {
  const sign = x >= 0 ? 1 : -1;
  let value = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * value);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-value * value);
  return sign * y;
}

function gaussianEaseOut(t: number, k = 2.5) {
  return erf(k * t) / erf(k);
}

function gaussianEaseIn(t: number, k = 2.5) {
  return 1 - erf(k * (1 - t)) / erf(k);
}

function gaussianEaseInOut(t: number, k = 2.5) {
  return erf(k * (2 * t - 1)) / (2 * erf(k)) + 0.5;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)] : [0, 0, 0];
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Component() {
  useDocumentTitle('Gaussian Gradient Generator | Xiaolin');

  const [angle, setAngle] = useState(90);
  const [colorStart, setColorStart] = useState('#ff0000');
  const [alphaStart, setAlphaStart] = useState(1);
  const [colorEnd, setColorEnd] = useState('#0000ff');
  const [alphaEnd, setAlphaEnd] = useState(0);
  const [easeType, setEaseType] = useState('out');
  const [mirror, setMirror] = useState(false);

  const gradientData = useMemo(() => {
    const rgbStart = hexToRgb(colorStart);
    const rgbEnd = hexToRgb(colorEnd);
    const steps = mirror ? 30 : 15;
    const stops = [];

    for (let i = 0; i <= steps; i++) {
      const position = i / steps;
      const t = mirror ? (position <= 0.5 ? position * 2 : (1 - position) * 2) : position;
      let ratio = t;
      if (easeType === 'out') ratio = gaussianEaseOut(t);
      else if (easeType === 'in') ratio = gaussianEaseIn(t);
      else if (easeType === 'inout') ratio = gaussianEaseInOut(t);

      const r = Math.round(rgbStart[0] + (rgbEnd[0] - rgbStart[0]) * ratio);
      const g = Math.round(rgbStart[1] + (rgbEnd[1] - rgbStart[1]) * ratio);
      const b = Math.round(rgbStart[2] + (rgbEnd[2] - rgbStart[2]) * ratio);
      const a = Number.parseFloat((alphaStart + (alphaEnd - alphaStart) * ratio).toFixed(3));

      stops.push({ position: Number.parseFloat(position.toFixed(4)), color: [r, g, b, a] });
    }

    return {
      type: 'linear',
      ease_algorithm: `gaussian_${easeType}`,
      is_mirror: mirror,
      angle,
      colors_count: stops.length,
      stops
    };
  }, [alphaEnd, alphaStart, angle, colorEnd, colorStart, easeType, mirror]);

  const cssGradient = useMemo(
    () =>
      `linear-gradient(${angle}deg, ${gradientData.stops
        .map((stop) => `rgba(${stop.color[0]}, ${stop.color[1]}, ${stop.color[2]}, ${stop.color[3]}) ${(stop.position * 100).toFixed(2)}%`)
        .join(', ')})`,
    [angle, gradientData]
  );

  function exportSVG() {
    const svgStops = gradientData.stops
      .map((stop) => {
        const rgbString = `rgb(${stop.color[0]}, ${stop.color[1]}, ${stop.color[2]})`;
        return `      <stop offset="${(stop.position * 100).toFixed(1)}%" stop-color="${rgbString}" stop-opacity="${stop.color[3]}" />`;
      })
      .join('\n');

    const svgCode = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">\n  <defs>\n    <linearGradient id="gaussianGrad" gradientTransform="rotate(${gradientData.angle - 90}, 0.5, 0.5)">\n${svgStops}\n    </linearGradient>\n  </defs>\n  <rect width="200" height="200" fill="url(#gaussianGrad)" />\n</svg>`;
    triggerDownload(svgCode, `gaussian_gradient${gradientData.is_mirror ? '_mirrored' : ''}.svg`, 'image/svg+xml');
  }

  function exportLottie() {
    const angleRad = (gradientData.angle * Math.PI) / 180;
    const distance = 100 * (Math.abs(Math.sin(angleRad)) + Math.abs(Math.cos(angleRad)));
    const startX = -Math.sin(angleRad) * distance;
    const startY = Math.cos(angleRad) * distance;
    const endX = Math.sin(angleRad) * distance;
    const endY = -Math.cos(angleRad) * distance;

    const lottieColors: number[] = [];
    const lottieAlphas: number[] = [];
    gradientData.stops.forEach((stop) => {
      lottieColors.push(stop.position, Number((stop.color[0] / 255).toFixed(4)), Number((stop.color[1] / 255).toFixed(4)), Number((stop.color[2] / 255).toFixed(4)));
      lottieAlphas.push(stop.position, stop.color[3]);
    });

    const lottieData = {
      v: '5.7.0',
      fr: 30,
      ip: 0,
      op: 60,
      w: 200,
      h: 200,
      nm: 'Gaussian Gradient',
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: 'Gradient Box',
          sr: 1,
          ip: 0,
          op: 60,
          st: 0,
          ks: {
            o: { a: 0, k: 100 },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [100, 100, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 0, k: [100, 100, 100] }
          },
          ao: 0,
          shapes: [
            {
              ty: 'gr',
              nm: 'Rectangle 1',
              np: 3,
              cix: 2,
              bm: 0,
              ix: 1,
              it: [
                { ty: 'rc', d: 1, s: { a: 0, k: [200, 200] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 }, nm: 'Rectangle Path 1' },
                { ty: 'gf', o: { a: 0, k: 100 }, r: 1, t: 1, nm: 'Gradient Fill 1', g: { p: gradientData.stops.length, k: { a: 0, k: [...lottieColors, ...lottieAlphas] } }, s: { a: 0, k: [startX, startY] }, e: { a: 0, k: [endX, endY] } },
                { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, nm: 'Transform' }
              ]
            }
          ]
        }
      ]
    };

    triggerDownload(JSON.stringify(lottieData, null, 2), `gaussian_gradient${gradientData.is_mirror ? '_mirrored' : ''}.json`, 'application/json');
  }

  return (
    <main className="tool-page stack" style={{ alignItems: 'center' }}>
      <h1>Gaussian Gradient Generator</h1>
      <div className="card inline-fields" style={{ padding: '1rem 1.5rem', justifyContent: 'center' }}>
        <label className="field">
          <span>Angle</span>
          <input type="number" value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
        </label>
        <label className="field">
          <span>Start</span>
          <div className="inline-fields" style={{ gap: '0.375rem' }}>
            <input type="color" value={colorStart} onChange={(e) => setColorStart(e.target.value)} />
            <input type="number" value={alphaStart} min="0" max="1" step="0.05" onChange={(e) => setAlphaStart(Number(e.target.value))} />
          </div>
        </label>
        <label className="field">
          <span>End</span>
          <div className="inline-fields" style={{ gap: '0.375rem' }}>
            <input type="color" value={colorEnd} onChange={(e) => setColorEnd(e.target.value)} />
            <input type="number" value={alphaEnd} min="0" max="1" step="0.05" onChange={(e) => setAlphaEnd(Number(e.target.value))} />
          </div>
        </label>
        <label className="field">
          <span>Easing</span>
          <select value={easeType} onChange={(e) => setEaseType(e.target.value)}>
            <option value="out">Ease-Out</option>
            <option value="in">Ease-In</option>
            <option value="inout">Ease-In-Out</option>
            <option value="linear">Linear</option>
          </select>
        </label>
        <label className="field-inline">
          <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} />
          <span>Mirror</span>
        </label>
      </div>

      <div className="card" style={{ width: 200, height: 200, overflow: 'hidden', background: cssGradient }} />

      <div className="inline-fields">
        <button onClick={exportSVG}>Export SVG</button>
        <button onClick={exportLottie} style={{ backgroundColor: '#00c1a2' }}>
          Export Lottie
        </button>
      </div>

      <textarea readOnly rows={18} value={JSON.stringify(gradientData, null, 2)} style={{ width: '100%', maxWidth: 780, fontFamily: 'var(--font-mono)' }} />
    </main>
  );
}
