const TEXTURE_SOURCE = "./assets/noise-watercolor.jpg";
const VIEWPORT = [300, 300];
const PALETTE = {
  BLUE: {
    main: { r: 220 / 255, g: 247 / 255, b: 255 / 255 },
    low: { r: 1 / 255, g: 129 / 255, b: 254 / 255 },
    mid: { r: 164 / 255, g: 239 / 255, b: 255 / 255 },
    high: { r: 255 / 255, g: 253 / 255, b: 239 / 255 },
  },
  DARK_BLUE: {
    main: { r: 218 / 255, g: 245 / 255, b: 255 / 255 },
    low: { r: 0 / 255, g: 102 / 255, b: 204 / 255 },
    mid: { r: 46 / 255, g: 198 / 255, b: 245 / 255 },
    high: { r: 114 / 255, g: 234 / 255, b: 245 / 255 },
  },
  GREYSCALE: {
    main: { r: 215 / 255, g: 215 / 255, b: 215 / 255 },
    low: { r: 48 / 255, g: 48 / 255, b: 48 / 255 },
    mid: { r: 152 / 255, g: 152 / 255, b: 152 / 255 },
    high: { r: 255 / 255, g: 255 / 255, b: 255 / 255 },
  },
};

const config = {
  mic: false,
  advanced: true,
  main: { ...PALETTE.BLUE.main },
  low: { ...PALETTE.BLUE.low },
  mid: { ...PALETTE.BLUE.mid },
  high: { ...PALETTE.BLUE.high },
};

let gl, program, vao, textureLocation, noiseTexture, uniformData, uniformDataBuffer, uniformFloats, uniformInts, glUniformBuffer;
let audioContext, analyser, freqData, timeData, microphone, microphoneStream;
let audioData = [0, 0, 0, 0];
let cumulativeAudioData = [0, 0, 0, 0];
let micLevel = 0;
let startTime, lastFrameTime, requestId;

const AUDIO_UPDATE_INTERVAL = 60;
const AUDIO_FRAME_MS = Math.floor(1000 / AUDIO_UPDATE_INTERVAL);
const AUDIO_BANDS = 240;
const AUDIO_TIME_CONSTANT_MULTIPLIER = 2;
const AUDIO_TIME_CONSTANT_DELTA = 2;
const AUDIO_CUMULATIVE_MULTIPLIER = 40;
const AUDIO_CUMULATIVE_TIME_CONSTANT = 2;
const FFT_SIZE = 2048;
const SAMPLE_RATE = 48000;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation error: ${error}`);
  }

  return shader;
}

async function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    throw new Error(`Unable to initialize the shader program: ${error}`);
  }

  return program;
}

function setupUniforms() {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const blockIndex = gl.getUniformBlockIndex(program, "BlorbUniformsObject");
  const blockSize = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);

  glUniformBuffer = gl.createBuffer();
  gl.bindBuffer(gl.UNIFORM_BUFFER, glUniformBuffer);
  gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);

  const bindingPoint = 0;
  gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, glUniformBuffer);
  gl.uniformBlockBinding(program, blockIndex, bindingPoint);

  const activeUniforms = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES);

  uniformData = {};
  for (let i = 0; i < activeUniforms.length; i++) {
    const index = activeUniforms[i];
    const info = gl.getActiveUniform(program, index);
    if (!info) continue;

    let name = info.name.replace(/\[0\]$/, "");
    const offset = gl.getActiveUniforms(program, [index], gl.UNIFORM_OFFSET)[0];
    uniformData[name] = offset;
  }

  uniformDataBuffer = new ArrayBuffer(blockSize);
  uniformFloats = new Float32Array(uniformDataBuffer);
  uniformInts = new Int32Array(uniformDataBuffer);

  textureLocation = gl.getUniformLocation(program, "uTextureNoise");
}

async function loadNoiseTexture() {
  return new Promise((resolve) => {
    const noiseTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);

    const tempData = new Uint8Array([255, 255, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, tempData);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = TEXTURE_SOURCE;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      resolve(noiseTexture);
    };
  });
}

function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    freqData = new Float32Array(analyser.frequencyBinCount);
    timeData = new Float32Array(analyser.frequencyBinCount);
    return true;
  } catch (error) {
    console.error("Failed to initialize audio context:", error);
    return false;
  }
}

function startMicrophone() {
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
      microphoneStream = stream;
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
    })
    .catch((err) => {
      console.error("Error accessing microphone:", err);
    });
}

function stopMicrophone() {
  if (microphone) {
    microphone.disconnect();
    microphone = null;
  }

  if (microphoneStream) {
    microphoneStream.getTracks().forEach((track) => track.stop());
    microphoneStream = null;
  }
}

function normalizeFrequencyData(data) {
  const result = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    let value = 1 - (Math.max(-100, Math.min(-10, data[i])) * -1) / 100;
    value = Math.sqrt(value);
    result[i] = value;
  }
  return result;
}

function calculateBandMagnitudes(normalizedData, options) {
  const { bandCount, binCount, gainMultipliers } = options;
  const result = [];

  const minFreq = 20;
  const maxFreq = SAMPLE_RATE / 2;
  const bands = new Array(bandCount + 1);

  for (let i = 0; i <= bandCount; i++) {
    bands[i] = minFreq * Math.pow(maxFreq / minFreq, i / bandCount);
  }

  const bandData = new Array(bandCount).fill(null).map(() => []);

  const freqResolution = SAMPLE_RATE / (normalizedData.length * 2);

  for (let i = 0; i < normalizedData.length; i++) {
    const freq = i * freqResolution;

    for (let j = 0; j < bandCount; j++) {
      if (freq >= bands[j] && freq < bands[j + 1]) {
        bandData[j].push(normalizedData[i]);
        break;
      }
    }
  }

  for (let i = 0; i < bandCount; i++) {
    const bandValues = bandData[i];
    const gainMultiplier = gainMultipliers ? gainMultipliers[i] : 1;

    if (bandValues.length === 0) {
      for (let j = 0; j < binCount; j++) {
        result.push(0);
      }
      continue;
    }

    const sortedValues = [...bandValues].sort((a, b) => a - b);
    const medianIndex = Math.floor(sortedValues.length / 2);
    let median;

    if (sortedValues.length % 2 === 0) {
      median = (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2;
    } else {
      median = sortedValues[medianIndex];
    }

    median = Math.abs(median) * gainMultiplier;

    const scaledValue = median / (median + 1);

    for (let j = 0; j < binCount; j++) {
      result.push(scaledValue);
    }
  }

  return result;
}

function smoothTransition(time, timeConstant) {
  return 1 - Math.exp(-time / timeConstant);
}

function lerp(start, end, t) {
  return start + t * (end - start);
}

function processAudioData(prevAudioData, prevCumulativeAudioData, deltaTimeS, audioDataRaw) {
  const audioDataIncrement = audioDataRaw.map((v) => v * deltaTimeS * AUDIO_UPDATE_INTERVAL * AUDIO_TIME_CONSTANT_MULTIPLIER);

  const audioAlpha = smoothTransition(deltaTimeS, AUDIO_TIME_CONSTANT_DELTA);

  const audioData = prevAudioData.map((prev, i) => lerp(prev, prev + audioDataIncrement[i], audioAlpha));

  const cumulativeIncrement = audioDataRaw.map((v) => v * deltaTimeS * AUDIO_UPDATE_INTERVAL * AUDIO_CUMULATIVE_MULTIPLIER);

  const rawCumulativeAudio = prevCumulativeAudioData.map((prev, i) => prev + cumulativeIncrement[i]);

  const cumulativeAlpha = smoothTransition(deltaTimeS, AUDIO_CUMULATIVE_TIME_CONSTANT);
  const cumulativeAudioData = prevCumulativeAudioData.map((prev, i) => lerp(prev, rawCumulativeAudio[i], cumulativeAlpha));

  return { audioData, cumulativeAudioData };
}

function updateAudioData() {
  if (!analyser) return;

  analyser.getFloatFrequencyData(freqData);
  analyser.getFloatTimeDomainData(timeData);

  const normalizedFreqData = normalizeFrequencyData(freqData);

  const gainMultipliers = [10, 1, 1, 1];
  const bandData = calculateBandMagnitudes(normalizedFreqData, {
    bandCount: 4,
    binCount: 1,
    gainMultipliers: gainMultipliers,
  });

  const now = performance.now();
  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  const processedData = processAudioData(audioData, cumulativeAudioData, deltaTime, bandData);

  audioData = processedData.audioData;
  cumulativeAudioData = processedData.cumulativeAudioData;

  let rms = 0;
  for (let i = 0; i < timeData.length; i++) {
    rms += timeData[i] * timeData[i];
  }
  rms = Math.sqrt(rms / timeData.length);
  micLevel = Math.min(1, rms * 5);
}

function updateUniforms() {
  const currentTime = performance.now() / 1000;

  const mainColor = [config.main.r, config.main.g, config.main.b];
  const lowColor = [config.low.r, config.low.g, config.low.b];
  const midColor = [config.mid.r, config.mid.g, config.mid.b];
  const highColor = [config.high.r, config.high.g, config.high.b];

  const values = {
    time: currentTime,
    micLevel: micLevel,
    stateListen: 0,
    listenTimestamp: 0,
    stateThink: 0,
    thinkTimestamp: 0,
    stateSpeak: 1,
    speakTimestamp: startTime,
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
    bloopColorMain: mainColor,
    bloopColorLow: lowColor,
    bloopColorMid: midColor,
    bloopColorHigh: highColor,
    isDarkMode: false,
    screenScaleFactor: window.devicePixelRatio,
    viewport: VIEWPORT,
    silenceAmount: 0,
    silenceTimestamp: 0,
    fadeBloopWhileListening: false,
  };

  Object.keys(uniformData).forEach((name) => {
    const [, key] = name.split(".");
    const offset = uniformData[name] / 4;
    const value = values[key];

    if (typeof value === "number") {
      uniformFloats[offset] = value;
    } else if (typeof value === "boolean") {
      uniformInts[offset] = value ? 1 : 0;
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        uniformFloats[offset + i] = value[i];
      }
    }
  });

  gl.bindBuffer(gl.UNIFORM_BUFFER, glUniformBuffer);
  gl.bufferSubData(gl.UNIFORM_BUFFER, 0, uniformDataBuffer);
}

function render() {
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

function cleanup() {
  cancelAnimationFrame(requestId);

  if (microphone || microphoneStream) {
    stopMicrophone();
  }

  if (audioContext) {
    audioContext.close();
  }

  if (pane) {
    pane.dispose();
  }
}

async function initWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const pixelRatio = window.devicePixelRatio;
    canvas.width = VIEWPORT[0] * pixelRatio;
    canvas.height = VIEWPORT[1] * pixelRatio;
    canvas.style.width = `${VIEWPORT[0]}px`;
    canvas.style.height = `${VIEWPORT[1]}px`;
    document.body.appendChild(canvas);

    gl = canvas.getContext("webgl2", { premultipliedAlpha: true });
    if (!gl) {
      throw new Error("WebGL2 is not supported in your browser");
    }

    const vertexShaderSource = await fetch("./shaders/vertex.glsl").then((res) => res.text());
    const fragmentShaderSource = await fetch("./shaders/fragment.glsl").then((res) => res.text());

    program = await createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    setupUniforms();

    noiseTexture = await loadNoiseTexture();

    const audioInitialized = initAudio();

    startTime = performance.now() / 1000;
    lastFrameTime = performance.now();

    if (config.mic && audioInitialized) {
      startMicrophone();
    }

    render();

    window.addEventListener("beforeunload", cleanup);

    return true;
  } catch (error) {
    console.error("Error initializing application:", error);
    return false;
  }
}

initWebGL();

function applyColorPreset(presetName) {
  const preset = PALETTE[presetName];
  if (!preset) return;

  config.main = { ...preset.main };
  config.low = { ...preset.low };
  config.mid = { ...preset.mid };
  config.high = { ...preset.high };

  if (pane) pane.refresh();
}

const pane = new Tweakpane.Pane();
const generalFolder = pane.addFolder({ title: "general" });
const colorFolder = pane.addFolder({ title: "color", expanded: false });
const paletteFolder = pane.addFolder({ title: "palette", expanded: false });

generalFolder.addInput(config, "mic").on("change", (event) => {
  if (event.value) {
    startMicrophone();
  } else {
    stopMicrophone();
  }
});

generalFolder.addInput(config, "advanced");

colorFolder.addInput(config, "main", {
  color: { type: "float" },
});
colorFolder.addInput(config, "low", {
  color: { type: "float" },
});
colorFolder.addInput(config, "mid", {
  color: { type: "float" },
});
colorFolder.addInput(config, "high", {
  color: { type: "float" },
});


paletteFolder.addButton({ title: "Blue" }).on("click", () => {
  applyColorPreset("BLUE");
});
paletteFolder.addButton({ title: "DarkBlue" }).on("click", () => {
  applyColorPreset("DARK_BLUE");
});
paletteFolder.addButton({ title: "Greyscale" }).on("click", () => {
  applyColorPreset("GREYSCALE");
});
