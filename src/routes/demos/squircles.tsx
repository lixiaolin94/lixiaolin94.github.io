import { drawQuadSmoothRoundRect, drawRoundRect, drawSmoothRoundRect } from '@/lib/demos/squircle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEffect, useRef } from 'react';

export function Component() {
  useDocumentTitle('Squircles | Xiaolin');

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
      const context = canvas.getContext('2d');
      if (!context) return;
      const ctx = context;
      const canvasEl = canvas;
      const dpr = window.devicePixelRatio || 1;

      const view = { left: 40, top: 40, right: 400, bottom: 400, radius: 80 };
      const config = {
        drawRoundRect: true,
        roundRectColor: '#ec6b2e',
        drawQuadSmoothRoundRect: false,
        quadColor: '#7b61ff',
        drawSmoothRoundRect: true,
        smoothCornersColor: '#1bc47d',
        smoothness: 0.6,
        alpha: 0.8,
        outline: false,
        lineWidth: 1
      };

      function hex2rgba(hex: string, alpha = 1) {
        const [r, g, b] = hex.match(/\w\w/g)!.map((value) => Number.parseInt(value, 16));
        return `rgba(${r},${g},${b},${alpha})`;
      }

      function draw() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        ctx.scale(dpr, dpr);
        ctx.lineWidth = config.lineWidth;

        const shapes = [
          { enabled: config.drawRoundRect, method: drawRoundRect, color: config.roundRectColor, extra: [] },
          { enabled: config.drawQuadSmoothRoundRect, method: drawQuadSmoothRoundRect, color: config.quadColor, extra: [] },
          { enabled: config.drawSmoothRoundRect, method: drawSmoothRoundRect, color: config.smoothCornersColor, extra: [config.smoothness] }
        ];

        for (const shape of shapes) {
          if (!shape.enabled) continue;
          shape.method(context, view.left, view.top, view.right, view.bottom, view.radius, ...shape.extra);
          if (config.outline) {
            ctx.strokeStyle = hex2rgba(shape.color, config.alpha);
            ctx.stroke();
          } else {
            ctx.fillStyle = hex2rgba(shape.color, config.alpha);
            ctx.fill();
          }
        }
      }

      resizeHandler = () => {
        const height = window.innerHeight - Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10);
        canvasEl.width = window.innerWidth * dpr;
        canvasEl.height = height * dpr;
        canvasEl.style.width = `${window.innerWidth}px`;
        canvasEl.style.height = `${height}px`;
        draw();
      };

      pane = new Pane({ title: 'Squircle', container: paneContainer });
      pane.addBinding(view, 'left');
      pane.addBinding(view, 'top');
      pane.addBinding(view, 'right');
      pane.addBinding(view, 'bottom');
      pane.addBinding(view, 'radius', { min: 0 });
      pane.addBlade({ view: 'separator' });
      pane.addBinding(config, 'drawRoundRect');
      pane.addBinding(config, 'roundRectColor');
      pane.addBlade({ view: 'separator' });
      pane.addBinding(config, 'drawQuadSmoothRoundRect');
      pane.addBinding(config, 'quadColor');
      pane.addBlade({ view: 'separator' });
      pane.addBinding(config, 'drawSmoothRoundRect');
      pane.addBinding(config, 'smoothness', { min: 0, max: 1 });
      pane.addBinding(config, 'smoothCornersColor');
      pane.addBlade({ view: 'separator' });
      pane.addBinding(config, 'alpha', { min: 0, max: 1 });
      pane.addBinding(config, 'outline');
      pane.addBinding(config, 'lineWidth', { min: 0 });
      pane.on('change', draw);

      window.addEventListener('resize', resizeHandler);
      resizeHandler();
    })();

    return () => {
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      pane?.dispose();
    };
  }, []);

  return (
    <main className="fullscreen-panel">
      <canvas ref={canvasRef} />
      <div ref={paneRef} style={{ position: 'fixed', top: 'calc(var(--nav-height) + 10px)', right: 10, width: 360 }} />
    </main>
  );
}
