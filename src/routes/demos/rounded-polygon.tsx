import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEffect, useRef } from 'react';

export function Component() {
  useDocumentTitle('Rounded Polygon | Xiaolin');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const paneContainer = paneRef.current;
    if (!canvas || !paneContainer) return;

    let pane: any = null;
    let resizeHandler: (() => void) | null = null;

    void (async () => {
      const { Pane } = await import('tweakpane');
      const { RoundedPolygon, CornerRounding, verticesFromNumVerts } = await import('@/lib/demos/RoundedPolygon');
      const dpr = window.devicePixelRatio || 1;
      const context = canvas.getContext('2d');
      if (!context) return;
      const ctx = context;
      const canvasEl = canvas;

      const params = { vertices: 4, radius: 256, cornerRadius: 80, smoothing: 0.6, rotation: 45, color: '#cccccc', outline: false, debug: false };

      function drawPoint(x: number, y: number, radius: number) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      function render() {
        const centerX = canvasEl.width / dpr / 2;
        const centerY = canvasEl.height / dpr / 2;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        ctx.scale(dpr, dpr);

        const rounding = new CornerRounding(params.cornerRadius, params.smoothing);
        const baseVertices = verticesFromNumVerts(params.vertices, params.radius, 0, 0);
        const rotationRadians = (params.rotation * Math.PI) / 180;
        const rotatedVertices = new Array(baseVertices.length);

        for (let i = 0; i < baseVertices.length; i += 2) {
          const x = baseVertices[i];
          const y = baseVertices[i + 1];
          rotatedVertices[i] = x * Math.cos(rotationRadians) - y * Math.sin(rotationRadians) + centerX;
          rotatedVertices[i + 1] = x * Math.sin(rotationRadians) + y * Math.cos(rotationRadians) + centerY;
        }

        const polygon = RoundedPolygon.fromVertices(rotatedVertices, rounding, null, centerX, centerY);
        const cubics = polygon.cubics;
        ctx.beginPath();
        if (cubics.length > 0) {
          ctx.moveTo(cubics[0].anchor0X, cubics[0].anchor0Y);
          for (const cubic of cubics) {
            ctx.bezierCurveTo(cubic.control0X, cubic.control0Y, cubic.control1X, cubic.control1Y, cubic.anchor1X, cubic.anchor1Y);
          }
        }
        ctx.closePath();

        if (params.outline) {
          ctx.strokeStyle = params.color;
          ctx.lineWidth = 0.5 * dpr;
          ctx.stroke();
        } else {
          ctx.fillStyle = params.color;
          ctx.fill();
        }

        if (params.debug) {
          const lineWidth = 0.5 * dpr;
          const pointRadius = 1.5 * dpr;
          for (const cubic of cubics) {
            ctx.strokeStyle = 'green';
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(cubic.anchor0X, cubic.anchor0Y);
            ctx.lineTo(cubic.control0X, cubic.control0Y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cubic.anchor1X, cubic.anchor1Y);
            ctx.lineTo(cubic.control1X, cubic.control1Y);
            ctx.stroke();
            ctx.fillStyle = 'red';
            drawPoint(cubic.anchor0X, cubic.anchor0Y, pointRadius);
            drawPoint(cubic.anchor1X, cubic.anchor1Y, pointRadius);
            ctx.fillStyle = 'green';
            drawPoint(cubic.control0X, cubic.control0Y, pointRadius);
            drawPoint(cubic.control1X, cubic.control1Y, pointRadius);
          }
        }
      }

      resizeHandler = () => {
        const height = window.innerHeight - Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10);
        canvasEl.style.width = `${window.innerWidth}px`;
        canvasEl.style.height = `${height}px`;
        canvasEl.width = window.innerWidth * dpr;
        canvasEl.height = height * dpr;
        render();
      };

      window.addEventListener('resize', resizeHandler);
      resizeHandler();

      pane = new Pane({ container: paneContainer });
      pane.addBinding(params, 'vertices', { min: 3, step: 1 });
      pane.addBinding(params, 'radius', { min: 0 });
      pane.addBinding(params, 'cornerRadius', { min: 0 });
      pane.addBinding(params, 'smoothing', { min: 0, max: 1 });
      pane.addBinding(params, 'rotation');
      pane.addBinding(params, 'color');
      pane.addBinding(params, 'outline');
      pane.addBinding(params, 'debug');
      pane.on('change', render);
    })();

    return () => {
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      pane?.dispose();
    };
  }, []);

  return (
    <main className="fullscreen-panel">
      <canvas ref={canvasRef} />
      <div ref={paneRef} style={{ position: 'fixed', top: 'calc(var(--nav-height) + 10px)', right: 10, width: 300 }} />
    </main>
  );
}
