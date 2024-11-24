const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const completedDialog = document.getElementById("completed-dialog");
const closeButton = document.getElementById("close-button");
const downloadButton = document.getElementById("download-button");

let currentBlob = null;
let currentFileName = null;
let lottieAnim = null;

function loadAnimation(animationData) {
  if (lottieAnim) {
    lottieAnim.destroy();
  }

  const params = {
    container: document.getElementById("lottie-preview"),
    renderer: "svg",
    loop: true,
    autoplay: true,
    animationData: animationData,
  };

  lottieAnim = lottie.loadAnimation(params);
}

function showDialog(blob, fileName) {
  currentBlob = blob;
  currentFileName = fileName;
  completedDialog.style.display = "block";

  // TODO: 生成预览
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const animationData = JSON.parse(e.target.result);
      loadAnimation(animationData);
    } catch (error) {
      console.log("Animation data parsing failed.");
    }
  };
  reader.readAsText(blob);

  downloadButton.onclick = () => {
    if (currentBlob && currentFileName) {
      const url = URL.createObjectURL(currentBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
}

function hideDialog() {
  completedDialog.style.display = "none";
  // 清理当前的blob和fileName
  currentBlob = null;
  currentFileName = null;
}

closeButton.addEventListener("click", hideDialog);

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file.type === "application/zip" || file.name.endsWith(".zip")) {
    processZipFile(file);
  } else {
    log("Please upload a ZIP file");
  }
});

dropZone.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("click", () => {
  fileInput.value = "";
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    processZipFile(file);
  }
});
