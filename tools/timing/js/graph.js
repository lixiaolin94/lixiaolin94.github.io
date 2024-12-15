const graphContainer = document.querySelector("#graph-container");
const graphPreviewObject = document.querySelector("#graph-preview-object");

const springGraph = document.querySelector("#spring-graph");
const springGraphContext = springGraph.getContext("2d");

let springGraphWidth, springGraphHeight, springGraphSafeHeight, previewTranslateY;

function initSpringGraph() {
  const rect = springGraph.getBoundingClientRect();
  springGraphWidth = rect.width * DPR;
  springGraphHeight = rect.height * DPR;
  previewTranslateY = rect.height * 0.5 - 1;

  springGraph.width = springGraphWidth;
  springGraph.height = springGraphHeight;
  springGraphSafeHeight = springGraphHeight - LINE_WIDTH;

  springGraphContext.lineWidth = LINE_WIDTH;
}

function drawSpringGraph(solver, peak) {
  springGraphContext.clearRect(0, 0, springGraphWidth, springGraphHeight);

  springGraphContext.beginPath();
  springGraphContext.setLineDash([5, 5]);
  springGraphContext.strokeStyle = "rgba(0, 0, 0, 0.2)";
  springGraphContext.moveTo(0, springGraphHeight / 2);
  springGraphContext.lineTo(springGraphWidth, springGraphHeight / 2);
  springGraphContext.stroke();
  springGraphContext.setLineDash([]);

  springGraphContext.strokeStyle = "black";
  springGraphContext.beginPath();
  springGraphContext.moveTo(0, springGraphHeight);

  for (let i = 0; i < springGraphWidth; i++) {
    const x = i / (springGraphSafeHeight * 0.5);
    const y = solver(x);
    springGraphContext.lineTo(i, (1 - y * 0.5) * springGraphSafeHeight + LINE_WIDTH * 0.5);
  }

  springGraphContext.stroke();

  const peakY = (1 - peak.value * 0.5) * springGraphSafeHeight + LINE_WIDTH * 0.5;
  const peakX = peak.time * (springGraphSafeHeight * 0.5);

  // Line
  springGraphContext.beginPath();
  springGraphContext.strokeStyle = "red";
  springGraphContext.moveTo(0, peakY);
  springGraphContext.lineTo(springGraphWidth, peakY);
  springGraphContext.stroke();

  // Point
  springGraphContext.beginPath();
  springGraphContext.fillStyle = "red";
  springGraphContext.arc(peakX, peakY, 2 * DPR, 0, Math.PI * 2);
  springGraphContext.fill();

  // Text
  springGraphContext.fillStyle = "red";
  springGraphContext.font = `${0.75 * DPR}rem Arial`;
  springGraphContext.fillText(`(${peak.time.toFixed(2)}, ${peak.value.toFixed(2)})`, peakX, peakY - 8 * DPR);
}

function previewAnimation(progress) {
  const value = lerp(previewTranslateY, 0, progress);
  graphPreviewObject.style.transform = `translateY(${value}px)`;
}

function resetPreviewAnimation() {
  graphPreviewObject.style.transform = `translateY(${previewTranslateY}px)`;
}

initSpringGraph();
