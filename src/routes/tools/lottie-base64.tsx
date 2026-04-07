import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEffect, useRef, useState } from 'react';

const IGNORED_PATTERNS = ['__MACOSX', '.DS_Store', 'Thumbs.db', 'desktop.ini', '._'];

function shouldIgnoreFile(path: string) {
  return IGNORED_PATTERNS.some((pattern) => path.includes(pattern));
}

function getMimeType(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml'
  };
  return types[ext ?? ''] ?? 'application/octet-stream';
}

function compressJSON(json: unknown): unknown {
  if (Array.isArray(json)) return json.map(compressJSON);
  if (typeof json === 'object' && json !== null) {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(json)) {
      if (key === 'p' && typeof value === 'string' && value.startsWith('data:')) obj[key] = value.replace(/[\r\n\s]+/g, '');
      else obj[key] = compressJSON(value);
    }
    return obj;
  }
  return json;
}

export function Component() {
  useDocumentTitle('Lottie Image to Base64 | Xiaolin');

  const [dragOver, setDragOver] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    return () => animationRef.current?.destroy();
  }, []);

  async function processZipFile(file: File) {
    try {
      setError('');
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      let jsonFile: any = null;
      let jsonFileName = '';
      const imagesFolder: Record<string, any> = {};

      for (const [path, entry] of Object.entries(contents.files)) {
        if (shouldIgnoreFile(path) || entry.dir) continue;
        if (path.toLowerCase().endsWith('.json')) {
          if (jsonFile) throw new Error('Multiple JSON files found');
          jsonFile = entry;
          jsonFileName = path;
        } else if (path.startsWith('images/')) {
          const ext = path.split('.').pop()?.toLowerCase() ?? '';
          if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) imagesFolder[path] = entry;
        }
      }

      if (!jsonFile) throw new Error('JSON file not found');
      if (!Object.keys(imagesFolder).length) throw new Error('No image files found');

      let jsonText = await jsonFile.async('string');
      jsonText = jsonText.replace(/^\uFEFF/, '').trim();
      const jsonContent = JSON.parse(jsonText) as { assets?: Array<Record<string, unknown>> };
      if (!Array.isArray(jsonContent.assets)) throw new Error('Invalid Lottie format');

      let processedImages = 0;
      for (const asset of jsonContent.assets) {
        if (asset.u === 'images/' && typeof asset.p === 'string') {
          const imageFile = imagesFolder[`images/${asset.p}`];
          if (imageFile) {
            const buf = await imageFile.async('arraybuffer');
            const base64 = btoa(Array.from(new Uint8Array(buf), (byte) => String.fromCharCode(byte)).join(''));
            asset.u = '';
            asset.p = `data:${getMimeType(asset.p)};base64,${base64}`;
            asset.e = 1;
            processedImages++;
          }
        }
      }

      if (!processedImages) throw new Error('No images processed');

      const compressed = compressJSON(jsonContent);
      const blob = new Blob([JSON.stringify(compressed)], { type: 'application/json' });
      setCurrentBlob(blob);
      setCurrentFileName(jsonFileName.replace('.json', '-compressed.json'));
      setShowDialog(true);

      const lottie = (await import('lottie-web')).default;
      animationRef.current?.destroy();
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = '';
        const text = await blob.text();
        animationRef.current = lottie.loadAnimation({
          container: previewContainerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: JSON.parse(text)
        });
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to process ZIP file');
    }
  }

  function download() {
    if (!currentBlob || !currentFileName) return;
    const url = URL.createObjectURL(currentBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = currentFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="tool-page" style={{ maxWidth: 'none', paddingBottom: '1rem' }}>
      <div
        className="card"
        style={{
          minHeight: 'calc(100vh - var(--nav-height) - 3rem)',
          margin: '0 1rem',
          borderStyle: 'dashed',
          borderColor: dragOver ? 'var(--color-accent)' : 'var(--color-border)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer'
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files[0];
          if (file && (file.type === 'application/zip' || file.name.endsWith('.zip'))) void processZipFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <p>Drag and drop a ZIP file here or click to select a file.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          hidden
          onClick={(event) => {
            event.currentTarget.value = '';
          }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void processZipFile(file);
          }}
        />
      </div>
      {error ? <p className="tool-page" style={{ color: 'red' }}>{error}</p> : null}
      {showDialog ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.5)', display: 'grid', placeItems: 'center', zIndex: 100 }}>
          <div className="card stack" style={{ position: 'relative', padding: '1.5rem', minWidth: 360 }}>
            <button className="icon" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => setShowDialog(false)}>
              ×
            </button>
            <h3>Conversion Complete!</h3>
            <p className="muted">Your file is ready for download.</p>
            <div ref={previewContainerRef} style={{ width: 320, height: 200 }} />
            <button onClick={download}>Download</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
