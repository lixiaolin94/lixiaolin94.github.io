import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEffect, useRef } from 'react';
import fragmentShader from '@/routes/demos/voice-visualizer/shaders/fragment.glsl?raw';
import vertexShader from '@/routes/demos/voice-visualizer/shaders/vertex.glsl?raw';

const TEXTURE_SOURCE = '/assets/noise-watercolor.jpg';
const VIEWPORT = [300, 300] as const;
const PALETTE = {
  BLUE: {
    main: { r: 220 / 255, g: 247 / 255, b: 255 / 255 },
    low: { r: 1 / 255, g: 129 / 255, b: 254 / 255 },
    mid: { r: 164 / 255, g: 239 / 255, b: 255 / 255 },
    high: { r: 255 / 255, g: 253 / 255, b: 239 / 255 }
  },
  DARK_BLUE: {
    main: { r: 218 / 255, g: 245 / 255, b: 255 / 255 },
    low: { r: 0 / 255, g: 102 / 255, b: 204 / 255 },
    mid: { r: 46 / 255, g: 198 / 255, b: 245 / 255 },
    high: { r: 114 / 255, g: 234 / 255, b: 245 / 255 }
  },
  GREYSCALE: {
    main: { r: 215 / 255, g: 215 / 255, b: 215 / 255 },
    low: { r: 48 / 255, g: 48 / 255, b: 48 / 255 },
    mid: { r: 152 / 255, g: 152 / 255, b: 152 / 255 },
    high: { r: 255 / 255, g: 255 / 255, b: 255 / 255 }
  }
} as const;

const AUDIO_UPDATE_INTERVAL = 60;
const AUDIO_TIME_CONSTANT_MULTIPLIER = 2;
const AUDIO_TIME_CONSTANT_DELTA = 2;
const AUDIO_CUMULATIVE_MULTIPLIER = 40;
const AUDIO_CUMULATIVE_TIME_CONSTANT = 2;
const FFT_SIZE = 2048;
const SAMPLE_RATE = 48000;

function smoothTransition(time: number, timeConstant: number) {
  return 1 - Math.exp(-time / timeConstant);
}

function lerp(start: number, end: number, t: number) {
  return start + t * (end - start);
}

export function Component() {
  useDocumentTitle('OpenAI Voice Visualizer | Xiaolin');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef({
    mic: false,
    advanced: true,
    main: { ...PALETTE.BLUE.main },
    low: { ...PALETTE.BLUE.low },
    mid: { ...PALETTE.BLUE.mid },
    high: { ...PALETTE.BLUE.high }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGL2RenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let textureLocation: WebGLUniformLocation | null = null;
    let noiseTexture: WebGLTexture | null = null;
    let uniformData: Record<string, number> = {};
    let uniformDataBuffer: ArrayBuffer | null = null;
    let uniformFloats: Float32Array | null = null;
    let uniformInts: Int32Array | null = null;
    let glUniformBuffer: WebGLBuffer | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let freqData: any = null;
    let timeData: any = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let microphoneStream: MediaStream | null = null;
    let audioData = [0, 0, 0, 0];
    let cumulativeAudioData = [0, 0, 0, 0];
    let micLevel = 0;
    let startTime = 0;
    let lastFrameTime = 0;
    let requestId = 0;
    let pane: any = null;
    let vertexShaderObject: WebGLShader | null = null;
    let fragmentShaderObject: WebGLShader | null = null;

    function createShaderObj(context: WebGL2RenderingContext, type: number, source: string) {
      const shader = context.createShader(type)!;
      context.shaderSource(shader, source);
      context.compileShader(shader);
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
        const error = context.getShaderInfoLog(shader);
        context.deleteShader(shader);
        throw new Error(`Shader compilation error: ${error}`);
      }
      return shader;
    }

    function createProgram(context: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
      vertexShaderObject = createShaderObj(context, context.VERTEX_SHADER, vertexSource);
      fragmentShaderObject = createShaderObj(context, context.FRAGMENT_SHADER, fragmentSource);
      const nextProgram = context.createProgram()!;
      context.attachShader(nextProgram, vertexShaderObject);
      context.attachShader(nextProgram, fragmentShaderObject);
      context.linkProgram(nextProgram);
      if (!context.getProgramParameter(nextProgram, context.LINK_STATUS)) {
        throw new Error(`Unable to initialize shader program: ${context.getProgramInfoLog(nextProgram)}`);
      }
      return nextProgram;
    }

    function setupUniforms() {
      if (!gl || !program) return;
      vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      const blockIndex = gl.getUniformBlockIndex(program, 'BlorbUniformsObject');
      const blockSize = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE) as number;
      glUniformBuffer = gl.createBuffer();
      gl.bindBuffer(gl.UNIFORM_BUFFER, glUniformBuffer);
      gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, glUniformBuffer);
      gl.uniformBlockBinding(program, blockIndex, 0);

      const activeUniforms = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES) as number[];
      uniformData = {};
      for (const index of activeUniforms) {
        const info = gl.getActiveUniform(program, index);
        if (!info) continue;
        const name = info.name.replace(/\[0\]$/, '');
        const offset = gl.getActiveUniforms(program, [index], gl.UNIFORM_OFFSET)[0];
        uniformData[name] = offset;
      }

      uniformDataBuffer = new ArrayBuffer(blockSize);
      uniformFloats = new Float32Array(uniformDataBuffer);
      uniformInts = new Int32Array(uniformDataBuffer);
      textureLocation = gl.getUniformLocation(program, 'uTextureNoise');
    }

    function loadNoiseTexture() {
      return new Promise<WebGLTexture>((resolve) => {
        if (!gl) return;
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = TEXTURE_SOURCE;
        image.onload = () => {
          if (!gl) return;
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          resolve(texture);
        };
      });
    }

    function initAudio() {
      try {
        audioContext = new window.AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        freqData = new Float32Array(analyser.frequencyBinCount);
        timeData = new Float32Array(analyser.frequencyBinCount);
        return true;
      } catch {
        return false;
      }
    }

    function startMicrophone() {
      if (!audioContext || !analyser) return;
      if (audioContext.state === 'suspended') void audioContext.resume();
      void navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
        microphoneStream = stream;
        microphone = audioContext!.createMediaStreamSource(stream);
        microphone.connect(analyser!);
      });
    }

    function stopMicrophone() {
      microphone?.disconnect();
      microphone = null;
      microphoneStream?.getTracks().forEach((track) => track.stop());
      microphoneStream = null;
    }

    function normalizeFrequencyData(data: ArrayLike<number>) {
      return Array.from(data, (entry) => {
        let value = 1 - (Math.max(-100, Math.min(-10, entry)) * -1) / 100;
        value = Math.sqrt(value);
        return value;
      });
    }

    function calculateBandMagnitudes(normalizedData: number[], options: { bandCount: number; binCount: number; gainMultipliers?: number[] }) {
      const result: number[] = [];
      const minFreq = 20;
      const maxFreq = SAMPLE_RATE / 2;
      const bands = new Array(options.bandCount + 1);
      for (let i = 0; i <= options.bandCount; i++) bands[i] = minFreq * Math.pow(maxFreq / minFreq, i / options.bandCount);
      const bandData = new Array(options.bandCount).fill(null).map(() => [] as number[]);
      const freqResolution = SAMPLE_RATE / (normalizedData.length * 2);

      for (let i = 0; i < normalizedData.length; i++) {
        const freq = i * freqResolution;
        for (let j = 0; j < options.bandCount; j++) {
          if (freq >= bands[j] && freq < bands[j + 1]) {
            bandData[j].push(normalizedData[i]);
            break;
          }
        }
      }

      for (let i = 0; i < options.bandCount; i++) {
        const values = bandData[i];
        const gainMultiplier = options.gainMultipliers?.[i] ?? 1;
        if (!values.length) {
          for (let j = 0; j < options.binCount; j++) result.push(0);
          continue;
        }
        const sorted = [...values].sort((a, b) => a - b);
        const medianIndex = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0 ? (sorted[medianIndex - 1] + sorted[medianIndex]) / 2 : sorted[medianIndex];
        const scaledValue = (Math.abs(median) * gainMultiplier) / (Math.abs(median) * gainMultiplier + 1);
        for (let j = 0; j < options.binCount; j++) result.push(scaledValue);
      }

      return result;
    }

    function processAudioData(prevAudioData: number[], prevCumulativeAudioData: number[], deltaTimeS: number, audioDataRaw: number[]) {
      const audioDataIncrement = audioDataRaw.map((value) => value * deltaTimeS * AUDIO_UPDATE_INTERVAL * AUDIO_TIME_CONSTANT_MULTIPLIER);
      const audioAlpha = smoothTransition(deltaTimeS, AUDIO_TIME_CONSTANT_DELTA);
      const newAudioData = prevAudioData.map((prev, index) => lerp(prev, prev + audioDataIncrement[index], audioAlpha));

      const cumulativeIncrement = audioDataRaw.map((value) => value * deltaTimeS * AUDIO_UPDATE_INTERVAL * AUDIO_CUMULATIVE_MULTIPLIER);
      const rawCumulativeAudio = prevCumulativeAudioData.map((prev, index) => prev + cumulativeIncrement[index]);
      const cumulativeAlpha = smoothTransition(deltaTimeS, AUDIO_CUMULATIVE_TIME_CONSTANT);
      const newCumulativeAudioData = prevCumulativeAudioData.map((prev, index) => lerp(prev, rawCumulativeAudio[index], cumulativeAlpha));

      return { audioData: newAudioData, cumulativeAudioData: newCumulativeAudioData };
    }

    function updateAudioData() {
      if (!analyser || !freqData || !timeData) return;
      analyser.getFloatFrequencyData(freqData);
      analyser.getFloatTimeDomainData(timeData);
      const normalized = normalizeFrequencyData(freqData);
      const bandData = calculateBandMagnitudes(normalized, { bandCount: 4, binCount: 1, gainMultipliers: [10, 1, 1, 1] });
      const now = performance.now();
      const deltaTime = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      const processed = processAudioData(audioData, cumulativeAudioData, deltaTime, bandData);
      audioData = processed.audioData;
      cumulativeAudioData = processed.cumulativeAudioData;

      let rms = 0;
      for (let i = 0; i < timeData.length; i++) rms += timeData[i] * timeData[i];
      rms = Math.sqrt(rms / timeData.length);
      micLevel = Math.min(1, rms * 5);
    }

    function updateUniforms() {
      if (!gl || !glUniformBuffer || !uniformDataBuffer || !uniformFloats || !uniformInts) return;
      const config = configRef.current;
      const values: Record<string, number | boolean | number[]> = {
        time: performance.now() / 1000,
        micLevel,
        stateListen: 1,
        listenTimestamp: startTime,
        stateThink: 0,
        thinkTimestamp: 0,
        stateSpeak: 0,
        speakTimestamp: 0,
        readyTimestamp: startTime,
        stateHalt: 0,
        haltTimestamp: 0,
        touchDownTimestamp: 0,
        touchUpTimestamp: 0,
        stateFailedToConnect: 0,
        failedToConnectTimestamp: 0,
        avgMag: audioData,
        cumulativeAudio: cumulativeAudioData,
        isNewBloop: true,
        isAdvancedBloop: config.advanced,
        bloopColorMain: [config.main.r, config.main.g, config.main.b],
        bloopColorLow: [config.low.r, config.low.g, config.low.b],
        bloopColorMid: [config.mid.r, config.mid.g, config.mid.b],
        bloopColorHigh: [config.high.r, config.high.g, config.high.b],
        isDarkMode: false,
        screenScaleFactor: window.devicePixelRatio,
        viewport: [...VIEWPORT],
        silenceAmount: 0,
        silenceTimestamp: 0,
        fadeBloopWhileListening: false
      };

      const floats = uniformFloats;
      const ints = uniformInts;
      if (!floats || !ints) return;

      Object.keys(uniformData).forEach((name) => {
        const [, key] = name.split('.');
        const offset = uniformData[name] / 4;
        const value = values[key];
        if (typeof value === 'number') floats[offset] = value;
        else if (typeof value === 'boolean') ints[offset] = value ? 1 : 0;
        else if (Array.isArray(value)) value.forEach((entry, index) => { floats[offset + index] = entry; });
      });

      gl.bindBuffer(gl.UNIFORM_BUFFER, glUniformBuffer);
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, uniformDataBuffer);
    }

    function render() {
      if (!gl || !vao || !noiseTexture || !textureLocation) return;
      updateAudioData();
      updateUniforms();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      gl.uniform1i(textureLocation, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestId = requestAnimationFrame(render);
    }

    function applyColorPreset(presetName: keyof typeof PALETTE) {
      const preset = PALETTE[presetName];
      configRef.current.main = { ...preset.main };
      configRef.current.low = { ...preset.low };
      configRef.current.mid = { ...preset.mid };
      configRef.current.high = { ...preset.high };
      pane?.refresh();
    }

    void (async () => {
      try {
        const pixelRatio = window.devicePixelRatio;
        canvas.width = VIEWPORT[0] * pixelRatio;
        canvas.height = VIEWPORT[1] * pixelRatio;
        canvas.style.width = `${VIEWPORT[0]}px`;
        canvas.style.height = `${VIEWPORT[1]}px`;
        gl = canvas.getContext('webgl2', { premultipliedAlpha: true });
        if (!gl) throw new Error('WebGL2 is not supported in your browser');

        program = createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(program);
        setupUniforms();
        noiseTexture = await loadNoiseTexture();

        const audioInitialized = initAudio();
        startTime = performance.now() / 1000;
        lastFrameTime = performance.now();
        if (configRef.current.mic && audioInitialized) startMicrophone();

        const { Pane } = await import('tweakpane');
        pane = new Pane();
        const generalFolder = pane.addFolder({ title: 'general' });
        const colorFolder = pane.addFolder({ title: 'color', expanded: false });
        const paletteFolder = pane.addFolder({ title: 'palette', expanded: false });

        generalFolder.addBinding(configRef.current, 'mic').on('change', (event: { value: boolean }) => {
          if (event.value) startMicrophone();
          else stopMicrophone();
        });
        generalFolder.addBinding(configRef.current, 'advanced');
        colorFolder.addBinding(configRef.current, 'main', { color: { type: 'float' } });
        colorFolder.addBinding(configRef.current, 'low', { color: { type: 'float' } });
        colorFolder.addBinding(configRef.current, 'mid', { color: { type: 'float' } });
        colorFolder.addBinding(configRef.current, 'high', { color: { type: 'float' } });
        paletteFolder.addButton({ title: 'Blue' }).on('click', () => applyColorPreset('BLUE'));
        paletteFolder.addButton({ title: 'DarkBlue' }).on('click', () => applyColorPreset('DARK_BLUE'));
        paletteFolder.addButton({ title: 'Greyscale' }).on('click', () => applyColorPreset('GREYSCALE'));

        render();
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelAnimationFrame(requestId);
      stopMicrophone();
      void audioContext?.close();
      pane?.dispose();
      if (gl && program) {
        if (noiseTexture) gl.deleteTexture(noiseTexture);
        if (glUniformBuffer) gl.deleteBuffer(glUniformBuffer);
        if (vao) gl.deleteVertexArray(vao);
        if (vertexShaderObject) {
          gl.detachShader(program, vertexShaderObject);
          gl.deleteShader(vertexShaderObject);
        }
        if (fragmentShaderObject) {
          gl.detachShader(program, fragmentShaderObject);
          gl.deleteShader(fragmentShaderObject);
        }
        gl.deleteProgram(program);
      }
    };
  }, []);

  return (
    <main className="fullscreen-panel" style={{ display: 'grid', placeItems: 'center' }}>
      <canvas ref={canvasRef} />
    </main>
  );
}
