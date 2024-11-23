const IGNORED_PATTERNS = ["__MACOSX", ".DS_Store", "Thumbs.db", "desktop.ini", "._"];

function shouldIgnoreFile(path) {
  return IGNORED_PATTERNS.some((pattern) => path.includes(pattern));
}

function isValidImageFile(filename) {
  const validExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
  const ext = filename.split(".").pop().toLowerCase();
  return validExtensions.includes(ext);
}

function getMimeType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const mimeTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

function compressBase64(base64Str) {
  return base64Str.replace(/[\r\n\s]+/g, "");
}

function compressJSON(json) {
  if (typeof json === "string") {
    json = JSON.parse(json);
  }

  const processNode = (node) => {
    if (Array.isArray(node)) {
      return node.map((item) => processNode(item));
    } else if (typeof node === "object" && node !== null) {
      const newObj = {};
      for (let key in node) {
        if (key === "p" && typeof node[key] === "string" && node[key].startsWith("data:")) {
          newObj[key] = compressBase64(node[key]);
        } else {
          newObj[key] = processNode(node[key]);
        }
      }
      return newObj;
    }
    return node;
  };

  return processNode(json);
}

async function processZipFile(file) {
  try {
    console.log("Processing file...");

    if (!file.name.toLowerCase().endsWith(".zip")) {
      throw new Error("Please upload a ZIP file");
    }

    const zip = new JSZip();
    let contents;
    try {
      contents = await zip.loadAsync(file);
    } catch (e) {
      throw new Error("Invalid or corrupted ZIP file");
    }

    let jsonFile, jsonFileName;
    let imagesFolder = {};
    let validFilesFound = false;

    for (const [path, zipEntry] of Object.entries(contents.files)) {
      if (shouldIgnoreFile(path)) {
        console.log(`Skipping system file: ${path}`);
        continue;
      }

      console.log(`Checking file: ${path}`);

      if (path.toLowerCase().endsWith(".json") && !zipEntry.dir) {
        if (jsonFile) {
          throw new Error("Multiple JSON files found. Please include only one Lottie JSON file");
        }
        jsonFile = zipEntry;
        jsonFileName = path;
        validFilesFound = true;
      } else if (path.startsWith("images/") && !zipEntry.dir) {
        if (!isValidImageFile(path)) {
          console.log(`Warning: Skipping unsupported image format: ${path}`);
          continue;
        }
        imagesFolder[path] = zipEntry;
        validFilesFound = true;
      }
    }

    if (!validFilesFound) {
      throw new Error("No valid JSON or image files found in ZIP");
    }

    if (!jsonFile) {
      throw new Error("JSON file not found");
    }

    if (Object.keys(imagesFolder).length === 0) {
      throw new Error("No image files found");
    }

    let jsonText = await jsonFile.async("string");
    jsonText = jsonText.replace(/^\uFEFF/, "").trim();

    let jsonContent;
    try {
      jsonContent = JSON.parse(jsonText);
    } catch (e) {
      console.log("JSON parsing failed:");
      console.log(`Error message: ${e.message}`);
      console.log(`JSON preview: ${jsonText.substring(0, 100)}`);
      throw new Error("Invalid JSON format");
    }

    if (!jsonContent.assets || !Array.isArray(jsonContent.assets)) {
      throw new Error("Invalid Lottie animation format");
    }

    let processedImages = 0;
    for (const asset of jsonContent.assets) {
      if (asset.u === "images/" && asset.p) {
        const imagePath = `images/${asset.p}`;
        const imageFile = imagesFolder[imagePath];

        if (imageFile) {
          try {
            console.log(`Processing image: ${imagePath}`);
            const imageBuffer = await imageFile.async("arraybuffer");
            const base64 = btoa(new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));

            asset.u = "";
            asset.p = `data:${getMimeType(asset.p)};base64,${base64}`;
            asset.e = 1;
            processedImages++;
          } catch (e) {
            console.log(`Warning: Failed to process image ${imagePath}: ${e.message}`);
          }
        } else {
          console.log(`Warning: Referenced image not found: ${imagePath}`);
        }
      }
    }

    if (processedImages === 0) {
      throw new Error("No images were processed successfully");
    }

    const compressedContent = compressJSON(jsonContent);
    // const newFileName = jsonFileName.replace(".json", "-base64.json");
    const newFileName = jsonFileName;

    try {
      const blob = new Blob([JSON.stringify(compressedContent)], {
        type: "application/json",
      });
      showDialog(blob, newFileName);
      console.log(`Complete! Successfully processed ${processedImages} images`);
    } catch (e) {
      throw new Error("Failed to generate file: " + e.message);
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
    console.error(error);
  }
}
