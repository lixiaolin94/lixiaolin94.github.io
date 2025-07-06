class GLSLToAGSLConverter {
    constructor() {
        this.glslEditor = document.getElementById('glsl-editor');
        this.agslEditor = document.getElementById('agsl-editor');
        this.downloadButton = document.getElementById('download-button');
        this.copyButton = document.getElementById('copy-button');
        this.conversionError = document.getElementById('conversion-error');
        this.dropOverlay = document.getElementById('drop-overlay');
        
        this.initEventListeners();
        this.initDragAndDrop();
    }
    
    initEventListeners() {
        this.copyButton.addEventListener('click', () => {
            this.copyToClipboard(this.agslEditor.value, 'AGSL');
        });
        
        this.downloadButton.addEventListener('click', () => {
            this.downloadAGSL();
        });
        
        this.glslEditor.addEventListener('input', () => {
            if (this.glslEditor.value.trim()) {
                this.convertGLSLToAGSL();
            } else {
                this.agslEditor.value = '';
                this.hideError();
            }
        });
    }
    
    initDragAndDrop() {
        const editorPanel = this.glslEditor.parentElement;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            editorPanel.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            editorPanel.addEventListener(eventName, () => this.highlight(), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            editorPanel.addEventListener(eventName, () => this.unhighlight(), false);
        });
        
        editorPanel.addEventListener('drop', (e) => this.handleDrop(e), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    highlight() {
        this.dropOverlay.classList.add('active');
        this.glslEditor.classList.add('drag-over');
    }
    
    unhighlight() {
        this.dropOverlay.classList.remove('active');
        this.glslEditor.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }
    
    handleFile(file) {
        const validExtensions = ['.glsl', '.frag', '.fs', '.vert', '.vs', '.txt'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
            this.showError(`Invalid file type. Please use files with extensions: ${validExtensions.join(', ')}`);
            return;
        }
        
        if (file.size > 1024 * 1024) {
            this.showError('File too large. Please use files smaller than 1MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            if (this.validateGLSLContent(content)) {
                this.glslEditor.value = content;
                this.convertGLSLToAGSL();
                this.hideError();
            }
        };
        reader.onerror = () => {
            this.showError('Error reading file. Please try again.');
        };
        reader.readAsText(file);
    }
    
    validateGLSLContent(content) {
        const hasMainFunction = /\bmain\s*\(/.test(content);
        const hasBasicTypes = /\b(void|float|int|bool|vec[234]|mat[234])\b/.test(content);
        
        if (!hasMainFunction) {
            this.showError('Invalid GLSL: Missing main() function');
            return false;
        }
        
        if (!hasBasicTypes) {
            this.showError('Invalid GLSL: No GLSL types detected');
            return false;
        }
        
        const hasFragmentFeatures = /\bgl_FragColor\b|\bgl_FragCoord\b|\btexture2D\b|\bsampler2D\b/.test(content);
        const hasVertexFeatures = /\bgl_Position\b|\bgl_Vertex\b|\battribute\b/.test(content);
        
        if (hasVertexFeatures && !hasFragmentFeatures) {
            this.showError('This appears to be a vertex shader. Only fragment shaders are supported.');
            return false;
        }
        
        return true;
    }
    
    showError(message) {
        this.conversionError.textContent = message;
        this.conversionError.style.display = 'block';
    }
    
    hideError() {
        this.conversionError.style.display = 'none';
    }
    
    async copyToClipboard(text, type) {
        if (!text.trim()) {
            alert(`No ${type} code to copy`);
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            const button = this.copyButton;
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 1000);
        } catch (err) {
            alert('Failed to copy to clipboard. Please update your browser.');
        }
    }
    
    downloadAGSL() {
        const agslCode = this.agslEditor.value.trim();
        if (!agslCode) {
            alert('No AGSL code to download');
            return;
        }
        
        const timestamp = Date.now();
        const filename = `${timestamp}.agsl`;
        
        const blob = new Blob([agslCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    convertGLSLToAGSL() {
        this.hideError();
        
        const glslCode = this.glslEditor.value.trim();
        if (!glslCode) {
            this.showError('Please enter GLSL code to convert');
            return;
        }
        
        try {
            const agslCode = this.translateGLSLToAGSL(glslCode);
            this.agslEditor.value = agslCode;
        } catch (error) {
            this.showError(`Conversion failed: ${error.message}`);
            this.agslEditor.value = '';
        }
    }
    
    translateGLSLToAGSL(glslCode) {
        let agslCode = glslCode;
        
        agslCode = agslCode.replace(/#version\s+\d+(\s+es)?/g, '').trim();
        agslCode = agslCode.replace(/precision\s+\w+\s+float\s*;/g, '').trim();
        
        let outVariableName = null;
        const outVariableMatch = agslCode.match(/out\s+vec4\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/);
        if (outVariableMatch) {
            outVariableName = outVariableMatch[1];
            agslCode = agslCode.replace(/out\s+vec4\s+[a-zA-Z_][a-zA-Z0-9_]*\s*;/g, '');
        }
        
        agslCode = agslCode.replace(/\bvec2\b/g, 'float2');
        agslCode = agslCode.replace(/\bvec3\b/g, 'float3');
        agslCode = agslCode.replace(/\bvec4\b/g, 'float4');
        agslCode = agslCode.replace(/\bivec2\b/g, 'int2');
        agslCode = agslCode.replace(/\bivec3\b/g, 'int3');
        agslCode = agslCode.replace(/\bivec4\b/g, 'int4');
        agslCode = agslCode.replace(/\bbvec2\b/g, 'bool2');
        agslCode = agslCode.replace(/\bbvec3\b/g, 'bool3');
        agslCode = agslCode.replace(/\bbvec4\b/g, 'bool4');
        
        agslCode = agslCode.replace(/\bmat2\b/g, 'float2x2');
        agslCode = agslCode.replace(/\bmat3\b/g, 'float3x3');
        agslCode = agslCode.replace(/\bmat4\b/g, 'float4x4');
        
        agslCode = agslCode.replace(/\bsampler2D\b/g, 'shader');
        agslCode = agslCode.replace(/\btexture2D\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, '$1.eval($2)');
        agslCode = agslCode.replace(/\btexture\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, '$1.eval($2)');
        
        agslCode = agslCode.replace(/\btextureLod\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*[^)]+\s*\)/g, '$1.eval($2)');
        agslCode = agslCode.replace(/\btexture2DLod\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*[^)]+\s*\)/g, '$1.eval($2)');
        agslCode = agslCode.replace(/\btexture2DLodEXT\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*[^)]+\s*\)/g, '$1.eval($2)');
        
        agslCode = agslCode.replace(/\bgl_FragCoord\b/g, 'fragCoord');
        agslCode = agslCode.replace(/void\s+main\s*\(\s*\)\s*\{/, 'half4 main(float2 fragCoord) {');
        agslCode = agslCode.replace(/gl_FragColor\s*=\s*(.*?);/g, 'return half4($1);');
        
        if (outVariableName) {
            const outAssignRegex = new RegExp(`\\b${outVariableName}\\s*=\\s*(.*?);`, 'g');
            agslCode = agslCode.replace(outAssignRegex, 'return half4($1);');
        }
        
        agslCode = agslCode.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return agslCode.trim();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GLSLToAGSLConverter();
});