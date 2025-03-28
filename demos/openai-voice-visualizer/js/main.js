// Constants
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
  isDarkMode: false,
  useMicrophone: false,
  isAdvancedBloop: true,
  ...PALETTE.BLUE,
};

// Global variables
let gl, program, vao, textureLocation, noiseTexture, uniformData, uniformDataBuffer, uniformFloats, uniformInts, glUniformBuffer;
let audioContext, analyser, freqData, timeData, microphone, microphoneStream;
let audioData = [0, 0, 0, 0];
let cumulativeAudioData = [0, 0, 0, 0];
let micLevel = 0;
let startTime, lastFrameTime, requestId;

// Create shader helper function
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

// Create program helper function
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

// Setup uniform buffers
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

// Load noise texture
async function loadNoiseTexture() {
  return new Promise((resolve) => {
    const noiseTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);

    // Temporary texture until image loads
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

// Audio initialization
function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    freqData = new Float32Array(analyser.frequencyBinCount);
    timeData = new Float32Array(analyser.frequencyBinCount);
    return true;
  } catch (error) {
    console.error("Failed to initialize audio context:", error);
    return false;
  }
}

// Microphone functions
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

// Audio processing functions
function normalizeFrequencyData(data) {
  const result = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    // Convert dB scale to linear
    let value = 1 - (Math.max(-100, Math.min(-10, data[i])) * -1) / 100;
    value = Math.sqrt(value); // Add some non-linear scaling
    result[i] = value;
  }
  return result;
}

function calculateBandMagnitudes(data, bandCount) {
  const result = new Array(bandCount).fill(0);
  const bandSize = Math.floor(data.length / bandCount);

  for (let i = 0; i < bandCount; i++) {
    let sum = 0;
    const start = i * bandSize;
    const end = Math.min((i + 1) * bandSize, data.length);

    for (let j = start; j < end; j++) {
      sum += data[j];
    }

    result[i] = sum / (end - start);
  }

  return result;
}

function updateAudioData() {
  if (!analyser) return;

  analyser.getFloatFrequencyData(freqData);
  analyser.getFloatTimeDomainData(timeData);

  const normalizedFreqData = normalizeFrequencyData(freqData);
  const bandData = calculateBandMagnitudes(normalizedFreqData, 4);

  const now = performance.now();
  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  const audioRaw = [...bandData, 0]; // 4 bands + overall level

  // Simple lowpass filter for smoother visualization
  for (let i = 0; i < 4; i++) {
    audioData[i] = audioData[i] * 0.7 + audioRaw[i] * 0.3;
    cumulativeAudioData[i] += audioData[i] * deltaTime * 2;
    // Add some decay to cumulative data
    cumulativeAudioData[i] *= 0.99;
  }

  // Calculate microphone level
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
    touchDownTimestamp: 0,
    touchUpTimestamp: 0,
    stateListen: 0,
    listenTimestamp: 0,
    stateThink: 0,
    thinkTimestamp: 0,
    stateSpeak: 1, // Always in speak mode for this demo
    speakTimestamp: startTime,
    readyTimestamp: startTime,
    stateHalt: 0,
    haltTimestamp: 0,
    stateFailedToConnect: 0,
    failedToConnectTimestamp: 0,
    avgMag: audioData,
    cumulativeAudio: cumulativeAudioData,
    viewport: VIEWPORT,
    screenScaleFactor: window.devicePixelRatio,
    silenceAmount: 0,
    silenceTimestamp: 0,
    isDarkMode: config.isDarkMode,
    fadeBloopWhileListening: false,
    isNewBloop: true,
    isAdvancedBloop: config.isAdvancedBloop,
    bloopColorMain: mainColor,
    bloopColorLow: lowColor,
    bloopColorMid: midColor,
    bloopColorHigh: highColor,
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

// Render function
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

    // Load shaders from external files
    const vertexShaderSource = await fetch("./shaders/vertex.glsl").then((res) => res.text());
    const fragmentShaderSource = await fetch("./shaders/fragment.glsl").then((res) => res.text());

    program = await createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    setupUniforms();

    noiseTexture = await loadNoiseTexture();

    const audioInitialized = initAudio();

    startTime = performance.now() / 1000;
    lastFrameTime = performance.now();

    document.body.style.background = config.isDarkMode ? "black" : "white";

    if (config.useMicrophone && audioInitialized) {
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

  Object.assign(config, preset);
  if (pane) pane.refresh();
}

const pane = new Tweakpane.Pane();

const generalFolder = pane.addFolder({ title: "general" });
generalFolder.addInput(config, "isDarkMode", { label: "darkMode" }).on("change", (event) => {
  document.body.style.background = event.value ? "black" : "white";
});

generalFolder.addInput(config, "useMicrophone", { label: "mic" }).on("change", (event) => {
  if (event.value) {
    startMicrophone();
  } else {
    stopMicrophone();
  }
});

generalFolder.addInput(config, "isAdvancedBloop", { label: "advanced" });

const colorFolder = pane.addFolder({ title: "color" });
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

const paletteFolder = pane.addFolder({ title: "palette" });
paletteFolder.addButton({ title: "Blue" }).on("click", () => {
  applyColorPreset("BLUE");
});
paletteFolder.addButton({ title: "DarkBlue" }).on("click", () => {
  applyColorPreset("DARK_BLUE");
});
paletteFolder.addButton({ title: "Greyscale" }).on("click", () => {
  applyColorPreset("GREYSCALE");
});
