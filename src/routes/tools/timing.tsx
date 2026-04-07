import { CodeSnippet } from '@/components/CodeSnippet';
import { InputSlider } from '@/components/InputSlider';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Animator } from '@/lib/timing/animator';
import { SPRING_INPUT_TYPES } from '@/lib/timing/constants';
import {
  calculateDampingRatio,
  calculatePeakTime,
  convertDampingRatioToBounce,
  convertStiffnessToResponse,
  estimateSpringAnimationDuration,
  generateLinearTiming,
  springConverter
} from '@/lib/timing/converter';
import { SpringSolver } from '@/lib/timing/solver';
import { outputTemplates } from '@/lib/timing/templates';
import { getCSSVariable } from '@/lib/utils/css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

type SpringTypeKey = keyof typeof SPRING_INPUT_TYPES;
type InputMap = Record<string, number>;

function getDefaultInputs(type: SpringTypeKey): InputMap {
  return Object.fromEntries(SPRING_INPUT_TYPES[type].params.map((param) => [param.value, param.defaultValue]));
}

export function Component() {
  useDocumentTitle('Timing | Xiaolin');

  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as SpringTypeKey | null) ?? 'figma';
  const [currentType, setCurrentType] = useState<SpringTypeKey>(SPRING_INPUT_TYPES[initialType] ? initialType : 'figma');
  const [currentInputs, setCurrentInputs] = useState<InputMap>(() => {
    const type = SPRING_INPUT_TYPES[initialType] ? initialType : 'figma';
    const defaults = getDefaultInputs(type);
    for (const param of SPRING_INPUT_TYPES[type].params) {
      const value = searchParams.get(param.value);
      if (value !== null) defaults[param.value] = Number.parseFloat(value);
    }
    return defaults;
  });
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const animatorRef = useRef<Animator | null>(null);

  const typeGroups = useMemo(() => {
    const groups: Record<string, Array<{ key: string; name: string }>> = {};
    for (const [key, value] of Object.entries(SPRING_INPUT_TYPES)) {
      (groups[value.group] ??= []).push({ key, name: value.name });
    }
    return groups;
  }, []);

  const currentParams = SPRING_INPUT_TYPES[currentType]?.params ?? [];

  const spring = useMemo(() => {
    const physicalSpring = ((springConverter as unknown) as Record<string, (inputs: InputMap) => any>)[currentType]?.(currentInputs);
    if (!physicalSpring) return null;

    const { mass, stiffness, damping, initialVelocity } = physicalSpring;
    const dampingRatio = calculateDampingRatio(mass, stiffness, damping);
    const response = convertStiffnessToResponse(stiffness, mass);
    const bounce = convertDampingRatioToBounce(dampingRatio);
    const duration = Math.min(estimateSpringAnimationDuration(stiffness, dampingRatio, initialVelocity, 1, 0.001), 99.999);
    const solver = SpringSolver(mass, stiffness, damping, initialVelocity);

    let peakTime = calculatePeakTime(mass, stiffness, damping);
    let peakValue = solver(peakTime);
    if (dampingRatio >= 1) {
      peakTime = duration;
      peakValue = 1;
    }

    return {
      mass,
      stiffness,
      damping,
      dampingRatio,
      response,
      bounce,
      duration,
      solver,
      cssLinear: generateLinearTiming(solver, duration * 1000, 0.001),
      peak: { time: peakTime, value: peakValue }
    };
  }, [currentInputs, currentType]);

  const groupedOutputs = useMemo(() => {
    const groups: Record<string, typeof outputTemplates> = {};
    for (const template of outputTemplates) {
      (groups[template.platform] ??= []).push(template);
    }
    return groups;
  }, []);

  useEffect(() => {
    animatorRef.current = new Animator(SpringSolver(1, 100, 10, 0));
    return () => {
      animatorRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('type', currentType);
    currentParams.forEach((param) => {
      if (currentInputs[param.value] !== undefined) params.set(param.value, String(currentInputs[param.value]));
    });
    setSearchParams(params, { replace: true });
  }, [currentInputs, currentParams, currentType, setSearchParams]);

  useEffect(() => {
    if (!spring || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * dpr;
    const height = rect.height * dpr;
    const lineWidth = dpr * 1.25;
    const safeHeight = height - lineWidth;

    canvas.width = width;
    canvas.height = height;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.lineWidth = lineWidth;
    context.clearRect(0, 0, width, height);

    context.beginPath();
    context.setLineDash([5, 5]);
    context.strokeStyle = getCSSVariable('--color-ring');
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();
    context.setLineDash([]);

    context.strokeStyle = getCSSVariable('--color-primary');
    context.beginPath();
    context.moveTo(0, height);
    for (let i = 0; i < width; i++) {
      const x = i / (safeHeight * 0.5);
      const y = spring.solver(x);
      context.lineTo(i, (1 - y * 0.5) * safeHeight + lineWidth * 0.5);
    }
    context.stroke();

    const peakX = spring.peak.time * (safeHeight * 0.5);
    const peakY = (1 - spring.peak.value * 0.5) * safeHeight + lineWidth * 0.5;
    context.beginPath();
    context.fillStyle = getCSSVariable('--color-destructive');
    context.arc(peakX, peakY, 2 * dpr, 0, Math.PI * 2);
    context.fill();
    context.font = `${0.75 * dpr}rem monospace`;
    context.fillText(`(${spring.peak.time.toFixed(2)}, ${spring.peak.value.toFixed(2)})`, Math.min(160 * dpr, peakX), Math.max(14 * dpr, peakY - 8 * dpr));
  }, [spring]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function handleTypeChange(nextType: SpringTypeKey) {
    setCurrentType(nextType);
    setCurrentInputs(getDefaultInputs(nextType));
  }

  function handleSliderInput(paramKey: string, value: number) {
    setCurrentInputs((previous) => ({ ...previous, [paramKey]: value }));
  }

  function playPreview() {
    if (!spring || !previewRef.current || !canvasRef.current || !animatorRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const translateY = rect.height * 0.5 - 1;

    animatorRef.current.solver = spring.solver;
    animatorRef.current.stop();
    previewRef.current.style.transform = `translateY(${translateY}px)`;
    animatorRef.current.start((value: number) => {
      const y = translateY * (1 - value);
      if (previewRef.current) previewRef.current.style.transform = `translateY(${y}px)`;
    });
  }

  function stopPreview() {
    animatorRef.current?.stop();
    if (!previewRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    previewRef.current.style.transform = `translateY(${rect.height * 0.5 - 1}px)`;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  }

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '64rem',
        minHeight: 'calc(100vh - var(--nav-height))',
        marginInline: 'auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 20rem'
      }}
    >
      <div className="stack" style={{ padding: '0 1rem 4rem', overflowX: 'auto' }}>
        {Object.entries(groupedOutputs).map(([platform, templates]) => (
          <section className="stack" key={platform}>
            <h2>{platform}</h2>
            {spring
              ? templates.map((template) => (
                  <CodeSnippet key={template.id} language={template.language} api={template.api} link={template.link}>
                    {template.render(spring, spring.cssLinear)}
                  </CodeSnippet>
                ))
              : null}
          </section>
        ))}
      </div>

      <div className="stack" style={{ position: 'sticky', top: 0, maxHeight: 'calc(100vh - var(--nav-height))', overflowY: 'auto', padding: '0 1rem 1rem' }}>
        <header className="stack">
          <h1>Spring Converter</h1>
          <p className="muted">Translate spring parameters across platforms.</p>
          <div className="inline-fields" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="inline-fields" style={{ gap: '0.5rem' }}>
              <a className="icon" href="https://x.com/niloa_i" target="_blank" rel="noreferrer">
                X
              </a>
              <a className="icon" href="https://github.com/lixiaolin94" target="_blank" rel="noreferrer">
                GH
              </a>
            </div>
            <button className="secondary" onClick={copyLink}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </header>

        <button className="card" style={{ padding: 0, display: 'grid', gridTemplateColumns: '1fr 2rem', gap: '0.5rem', overflow: 'hidden', cursor: 'pointer' }} onClick={playPreview}>
          <canvas ref={canvasRef} style={{ margin: '0.5rem', width: '100%', aspectRatio: 1 }} />
          <div style={{ margin: '0.5rem', padding: '0.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--color-muted)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div ref={previewRef} style={{ width: '100%', height: 2, borderRadius: 1, background: 'var(--color-destructive)' }} />
          </div>
        </button>

        <select value={currentType} onChange={(event) => handleTypeChange(event.target.value as SpringTypeKey)}>
          {Object.entries(typeGroups).map(([group, types]) => (
            <optgroup key={group} label={group}>
              {types.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="stack" style={{ gap: '0.5rem' }}>
          {currentParams.map((param) => (
            <InputSlider
              key={param.value}
              label={param.label}
              value={currentInputs[param.value] ?? param.defaultValue}
              min={param.min}
              max={param.max}
              step={param.step}
              onChange={(value) => handleSliderInput(param.value, value)}
              onMouseDown={stopPreview}
              onMouseUp={playPreview}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
