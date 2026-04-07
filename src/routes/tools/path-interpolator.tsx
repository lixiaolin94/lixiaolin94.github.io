import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEffect, useMemo, useState } from 'react';

const TOKEN_REGEX = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g;
const COMMAND_PARAM_COUNT: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

function isCommand(token: string) {
  return /^[a-zA-Z]$/.test(token);
}

function detectInputType(text: string) {
  if (/\s*<\s*pathInterpolator/i.test(text)) return 'android';
  if (/<\s*svg|<\s*path/i.test(text)) return 'svg';
  return 'path';
}

function extractPathData(text: string, type: string) {
  if (type === 'android') {
    const match = text.match(/android:pathData\s*=\s*"([^"]+)"/i);
    return match ? match[1] : null;
  }
  if (type === 'svg') {
    const pathMatch = text.match(/\sd\s*=\s*"([^"]+)"/i);
    if (pathMatch) return pathMatch[1];
  }
  return text.trim() || null;
}

function tokenizePath(d: string) {
  return d.match(TOKEN_REGEX) || [];
}

function parsePath(d: string) {
  const tokens = tokenizePath(d);
  const segments: Array<{ cmd: string; values: number[] }> = [];
  let index = 0;
  let currentCommand: string | null = null;

  const popNumber = () => {
    if (index >= tokens.length) return null;
    if (isCommand(tokens[index])) return null;
    return Number.parseFloat(tokens[index++]);
  };

  while (index < tokens.length) {
    const token = tokens[index];
    if (isCommand(token)) {
      currentCommand = token;
      index++;
      if (COMMAND_PARAM_COUNT[token.toUpperCase()] === 0) {
        segments.push({ cmd: token, values: [] });
        currentCommand = null;
      }
      continue;
    }
    if (!currentCommand) return [];

    const upper = currentCommand.toUpperCase();
    const needed = COMMAND_PARAM_COUNT[upper];
    const values: number[] = [];
    while (values.length < needed) {
      const value = popNumber();
      if (value === null) break;
      values.push(value);
    }
    if (values.length < needed) break;
    segments.push({ cmd: currentCommand, values });
    if (currentCommand === 'M') currentCommand = 'L';
    if (currentCommand === 'm') currentCommand = 'l';
  }

  return segments;
}

function scaleSegments(segments: Array<{ cmd: string; values: number[] }>, factor: number) {
  if (!segments.length || factor === 1) return segments.map((segment) => ({ cmd: segment.cmd, values: [...segment.values] }));
  return segments.map((segment) => {
    const upper = segment.cmd.toUpperCase();
    const scaled = [...segment.values];
    if (upper === 'A') {
      [0, 1, 5, 6].forEach((idx) => {
        if (idx < scaled.length) scaled[idx] *= factor;
      });
    } else if (upper === 'H' || upper === 'V') {
      if (scaled.length) scaled[0] *= factor;
    } else if (upper !== 'Z') {
      for (let i = 0; i < scaled.length; i++) scaled[i] *= factor;
    }
    return { cmd: segment.cmd, values: scaled };
  });
}

function formatNumber(n: number) {
  return Number(n.toFixed(6)).toString();
}

function buildPathString(segments: Array<{ cmd: string; values: number[] }>) {
  return segments
    .map((segment) => (segment.values.length ? `${segment.cmd} ${segment.values.map(formatNumber).join(' ')}` : segment.cmd))
    .join(' ');
}

function computeBounds(segments: Array<{ cmd: string; values: number[] }>) {
  if (!segments.length) return null;

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;

  const record = (x: number, y: number) => {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  };

  for (const segment of segments) {
    const upper = segment.cmd.toUpperCase();
    const rel = segment.cmd !== upper;
    const values = segment.values;

    if (upper === 'M' || upper === 'L' || upper === 'T') {
      const x = rel ? cx + values[0] : values[0];
      const y = rel ? cy + values[1] : values[1];
      record(x, y);
      cx = x;
      cy = y;
      if (upper === 'M') {
        startX = x;
        startY = y;
      }
    } else if (upper === 'H') {
      cx = rel ? cx + values[0] : values[0];
      record(cx, cy);
    } else if (upper === 'V') {
      cy = rel ? cy + values[0] : values[0];
      record(cx, cy);
    } else if (upper === 'C') {
      for (let i = 0; i < 6; i += 2) {
        const x = rel ? cx + values[i] : values[i];
        const y = rel ? cy + values[i + 1] : values[i + 1];
        record(x, y);
        if (i === 4) {
          cx = x;
          cy = y;
        }
      }
    } else if (upper === 'S' || upper === 'Q') {
      for (let i = 0; i < values.length; i += 2) {
        const x = rel ? cx + values[i] : values[i];
        const y = rel ? cy + values[i + 1] : values[i + 1];
        record(x, y);
        if (i === values.length - 2) {
          cx = x;
          cy = y;
        }
      }
    } else if (upper === 'A') {
      const x = rel ? cx + values[5] : values[5];
      const y = rel ? cy + values[6] : values[6];
      record(x, y);
      cx = x;
      cy = y;
    } else if (upper === 'Z') {
      cx = startX;
      cy = startY;
    }
  }

  if (minX === Number.POSITIVE_INFINITY) return null;
  return { minX, maxX, minY, maxY };
}

export function Component() {
  useDocumentTitle('Path Interpolator Converter | Xiaolin');

  const [inputText, setInputText] = useState('');
  const [scaleFactor, setScaleFactor] = useState(1);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!inputText.trim()) {
      return {
        statusMessage: 'Waiting for input…',
        statusLevel: 'info',
        outputText: '',
        previewPath: '',
        previewViewBox: '0 0 1 1',
        previewStrokeWidth: 0.01,
        showError: false
      };
    }

    const type = detectInputType(inputText);
    const pathData = extractPathData(inputText, type);
    if (!pathData) {
      return { statusMessage: 'Could not find path data in the input.', statusLevel: 'error', outputText: '', previewPath: '', previewViewBox: '0 0 1 1', previewStrokeWidth: 0.01, showError: true };
    }

    const parsedSegments = parsePath(pathData);
    if (!parsedSegments.length) {
      return { statusMessage: 'Path data could not be parsed.', statusLevel: 'error', outputText: '', previewPath: '', previewViewBox: '0 0 1 1', previewStrokeWidth: 0.01, showError: true };
    }

    const segments = scaleSegments(parsedSegments, scaleFactor);
    const bounds = computeBounds(segments);
    if (!bounds) {
      return { statusMessage: 'Path bounds could not be determined.', statusLevel: 'error', outputText: '', previewPath: '', previewViewBox: '0 0 1 1', previewStrokeWidth: 0.01, showError: true };
    }

    const finalPath = buildPathString(segments);
    const width = bounds.maxX - bounds.minX || 1;
    const height = bounds.maxY - bounds.minY || 1;
    const outputText =
      type === 'android'
        ? `<svg viewBox="${formatNumber(bounds.minX)} ${formatNumber(bounds.minY)} ${formatNumber(width)} ${formatNumber(height)}" xmlns="http://www.w3.org/2000/svg"><path d="${finalPath}" /></svg>`
        : `<?xml version="1.0" encoding="utf-8"?>\n<pathInterpolator xmlns:android="http://schemas.android.com/apk/res/android"\n    android:pathData="${finalPath}" />`;

    return {
      statusMessage: `Detected ${type === 'android' ? 'Android XML -> SVG' : type === 'svg' ? 'SVG -> Android' : 'Path string -> Android'} | Scale ${formatNumber(scaleFactor)}`,
      statusLevel: 'info',
      outputText,
      previewPath: finalPath,
      previewViewBox: `${bounds.minX} ${bounds.minY} ${width} ${height}`,
      previewStrokeWidth: Math.max(0.003, Math.max(width, height) * 0.01),
      showError: false
    };
  }, [inputText, scaleFactor]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyOutput() {
    if (!result.outputText) return;
    await navigator.clipboard.writeText(result.outputText);
    setCopied(true);
  }

  return (
    <main className="tool-page stack">
      <div className="inline-fields">
        <label className="field-inline">
          Scale Factor
          <input type="number" step="0.01" value={scaleFactor} onChange={(e) => setScaleFactor(Number(e.target.value))} />
        </label>
        <button className="secondary" onClick={copyOutput}>
          {copied ? 'Copied!' : 'Copy Output'}
        </button>
        <div className="muted" style={{ color: result.statusLevel === 'error' ? 'red' : undefined }}>
          {result.statusMessage}
        </div>
      </div>

      <div className="inline-fields" style={{ alignItems: 'stretch' }}>
        <div className="field" style={{ flex: 1, minWidth: 280 }}>
          <label htmlFor="path-input">Input</label>
          <textarea
            id="path-input"
            rows={14}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste Android pathInterpolator XML, SVG XML, or a raw path string."
          />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 280 }}>
          <label htmlFor="path-output">Output</label>
          <textarea id="path-output" rows={14} readOnly value={result.outputText} placeholder="Converted output appears here." />
        </div>
      </div>

      <div className="card stack" style={{ padding: '1rem' }}>
        <div>Preview</div>
        <div style={{ height: 240, display: 'grid', placeItems: 'center', background: 'var(--color-muted)' }}>
          <svg viewBox={result.previewViewBox} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <path d={result.previewPath} stroke="blue" fill="none" strokeWidth={result.previewStrokeWidth} />
          </svg>
        </div>
        {result.showError ? <div style={{ color: 'red' }}>Invalid Path Data</div> : null}
      </div>
    </main>
  );
}
