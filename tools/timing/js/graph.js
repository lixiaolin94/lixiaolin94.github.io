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

function drawSpringGraph(solver) {
  springGraphContext.clearRect(0, 0, springGraphWidth, springGraphHeight);
  springGraphContext.strokeStyle = "black";
  springGraphContext.beginPath();
  springGraphContext.moveTo(0, springGraphHeight);

  for (let i = 0; i < springGraphWidth; i++) {
    const x = i / (springGraphSafeHeight * 0.5);
    const y = solver(x);
    springGraphContext.lineTo(i, (1 - y * 0.5) * springGraphSafeHeight + LINE_WIDTH * 0.5);
  }

  springGraphContext.stroke();
}

function previewAnimation(progress) {
  const value = lerp(previewTranslateY, 0, progress);
  graphPreviewObject.style.transform = `translateY(${value}px)`;
}

function resetPreviewAnimation() {
  graphPreviewObject.style.transform = `translateY(${previewTranslateY}px)`;
}

initSpringGraph();
