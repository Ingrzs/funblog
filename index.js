

import { generateTitles, generatePhrases } from './services/geminiService.js';
import { createMemeImage, createPhraseImage } from './services/imageService.js';

const DEFAULT_AVATAR_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJyb3RhdGUoMTAgNTAgNTApIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0iI0ZGRiIgc3Ryb2tlPSIjREREIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDY1LDQwIEMgNjgsMzUgNzIsMzUgNzUsNDAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iNSIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjxwYXRoIGQ9Ik0gMzAsNjUgUSA1MCw4NSA3MCw2NSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI2IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+PGNpcmNsZSBjeD0iMzUiIGN5PSI0MCIgcj0iNSIgZmlsbD0iYmxhY2siIC8+PC9nPjwvc3ZnPg==';
const WHITE_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
const EMOJIS = { picara: '💋', sarcastica: '😏', dramatica: '😭', relaciones: '💔', chisme: '😏', humor: '😅', reflexion: '😌', sarcasmo: '😤',};

// --- STATE MANAGEMENT ---
const state = {
    apiKey: null,
    uploadedImages: [],
    generatedMemes: [],
    titleType: 'meme',
    designSettings: {
        showHeader: true,
        profileName: 'Blogfun',
        profileHandle: '@blogfun',
        profileAvatarUrl: DEFAULT_AVATAR_URL,
        watermark: { type: 'none', text: 'Tu Marca de Agua', imageUrl: null, opacity: 0.7, size: 5, x: 50, y: 85, imageWidth: 0, imageHeight: 0, },
    },
    isLoading: false,
    error: null,
};

// --- DOM ELEMENT REFERENCES ---
const DOMElements = {
    apiKeyContainer: document.getElementById('api-key-manager-container'),
    modeMemeBtn: document.getElementById('mode-meme-btn'),
    modeFraseBtn: document.getElementById('mode-frase-btn'),
    errorContainer: document.getElementById('error-container'),
    uploaderContainer: document.getElementById('uploader-container'),
    previewContainer: document.getElementById('preview-container'),
    resultsContainer: document.getElementById('results-container'),
    loadingContainer: document.getElementById('loading-container'),
    loadingText: document.getElementById('loading-text'),
    footerButtons: document.getElementById('footer-buttons'),
};

// --- TEMPLATE GENERATORS ---
const getApiKeyManagerHTML = () => {
    if (state.apiKey) {
        const maskedKey = `${state.apiKey.substring(0, 5)}...${state.apiKey.substring(state.apiKey.length - 4)}`;
        return `
            <div class="flex items-center justify-center gap-4 p-2 bg-gray-800 rounded-lg mb-6 border border-gray-700">
                <span class="text-sm text-green-400">API Key Guardada:</span>
                <span class="font-mono text-gray-300">${maskedKey}</span>
                <button id="edit-api-key-btn" class="text-sm text-indigo-400 hover:text-indigo-300">Editar</button>
            </div>`;
    }
    return `
        <div class="flex flex-col sm:flex-row items-center justify-center gap-2 p-4 bg-gray-800 rounded-lg mb-6 border border-indigo-500/50">
            <label for="api-key-input" class="text-sm font-semibold text-gray-300 whitespace-nowrap">Tu API Key de Gemini:</label>
            <input id="api-key-input" type="password" placeholder="Introduce tu API Key aquí" class="flex-grow bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white w-full sm:w-auto"/>
            <div class="flex gap-2 mt-2 sm:mt-0">
                <button id="save-api-key-btn" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm">Guardar</button>
            </div>
        </div>`;
};
const getUploaderHTML = () => `
    <div class="w-full max-w-2xl mx-auto">
        <label for="file-upload" class="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-indigo-500">
            <div class="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                <svg class="w-10 h-10 mb-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                <p class="mb-2 text-sm text-gray-400"><span class="font-semibold text-indigo-400">Haz clic para subir</span> o arrastra y suelta</p>
                <p class="text-xs text-gray-500">Sube una o varias imágenes (PNG, JPG, etc.)</p>
            </div>
            <input id="file-upload" type="file" multiple accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </label>
    </div>`;

const getPreviewHTML = () => `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
    ${state.uploadedImages.map(image => `
        <div key="${image.id}" class="aspect-square rounded-lg overflow-hidden ring-2 ring-gray-700">
            <img src="${image.previewUrl}" alt="Vista previa" class="w-full h-full object-cover" />
        </div>`).join('')}
</div>`;

const getResultsHTML = () => `
    ${getGlobalControlsHTML()}
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
        ${state.generatedMemes.map(meme => getMemeCardHTML(meme)).join('')}
    </div>`;

const getGlobalControlsHTML = () => {
    const { showHeader, profileName, profileHandle, profileAvatarUrl, watermark } = state.designSettings;
    return `
    <div class="p-6 bg-gray-800 rounded-xl shadow-lg mb-8 border border-gray-700">
        <h2 class="text-xl font-bold text-indigo-300 mb-4">Controles de Diseño Globales</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col gap-4">
                <h3 class="text-lg font-semibold text-gray-200">Perfil y Encabezado</h3>
                <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-gray-300">Mostrar Encabezado</span>
                    <div class="relative"><input id="show-header-toggle" type="checkbox" class="sr-only" ${showHeader ? 'checked' : ''} /><div class="block bg-gray-600 w-14 h-8 rounded-full"></div><div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full"></div></div>
                </label>
                <div class="flex items-center gap-4 transition-opacity ${showHeader ? 'opacity-100' : 'opacity-50 pointer-events-none'}">
                    <img id="avatar-img" src="${profileAvatarUrl}" alt="Avatar" class="w-16 h-16 rounded-full object-cover cursor-pointer" />
                    <input type="file" accept="image/*" id="avatar-upload" class="hidden" />
                    <div class="flex-1">
                        <input type="text" id="profile-name-input" value="${profileName}" class="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" placeholder="Nombre de perfil"/>
                        <input type="text" id="profile-handle-input" value="${profileHandle}" class="w-full bg-gray-700 border border-gray-600 rounded p-2 mt-2 text-white" placeholder="@usuario"/>
                    </div>
                </div>
            </div>
            <div class="flex flex-col gap-4">
                 <h3 class="text-lg font-semibold text-gray-200">Marca de Agua</h3>
                 <div id="watermark-preview-box" class="relative w-full h-24 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 overflow-hidden">
                    Arrastra la marca aquí
                    ${watermark.type !== 'none' ? `<div id="watermark-draggable" class="absolute cursor-move" style="left: ${watermark.x}%; top: ${watermark.y}%; opacity: ${watermark.opacity}; transform: translate(-50%, -50%);">
                        ${watermark.type === 'text' ? `<span class="text-white text-sm whitespace-nowrap" style="font-size: ${watermark.size}px">${watermark.text}</span>` : `<img src="${watermark.imageUrl}" style="max-height: ${watermark.size * 2}px" alt="watermark preview"/>`}
                    </div>` : ''}
                </div>
                <div id="watermark-controls">
                ${watermark.type === 'none' ? `
                    <div class="flex gap-2">
                        <button id="add-text-watermark-btn" class="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Añadir Texto</button>
                        <button id="add-image-watermark-btn" class="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Añadir Imagen</button>
                        <input type="file" accept="image/png, image/jpeg" id="watermark-upload" class="hidden" />
                    </div>
                ` : `
                    <div class="flex flex-col gap-3">
                        ${watermark.type === 'text' ? `<input type="text" id="watermark-text-input" value="${watermark.text}" class="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />` : ''}
                        <div class="grid grid-cols-[auto,1fr] items-center gap-x-2 gap-y-3">
                            <label class="text-sm text-gray-400">Tamaño:</label>
                            <input type="range" id="watermark-size-slider" min="2" max="12" step="0.5" value="${watermark.size}" class="w-full" />
                            <label class="text-sm text-gray-400">Opacidad:</label>
                            <input type="range" id="watermark-opacity-slider" min="0.1" max="1" step="0.1" value="${watermark.opacity}" class="w-full" />
                        </div>
                        <button id="remove-watermark-btn" class="text-center py-2 bg-red-800 hover:bg-red-700 rounded-lg transition-colors text-sm">Quitar Marca</button>
                    </div>
                `}
                </div>
            </div>
        </div>
    </div>`;
};

const getMemeCardHTML = (meme) => {
    const { showHeader, profileName, profileHandle, profileAvatarUrl, watermark } = state.designSettings;
    const isPhraseMode = state.titleType === 'frase';
    return `
    <div class="bg-gray-800 rounded-lg shadow-lg shadow-black/30 flex flex-col gap-4" data-meme-id="${meme.id}">
        <div class="${isPhraseMode ? 'bg-white' : 'bg-gray-100'} text-gray-900 rounded-t-lg border-b border-gray-200 relative overflow-hidden p-4">
            ${showHeader ? `
            <div class="flex items-center gap-3">
                <div class="w-12 h-12"><img src="${profileAvatarUrl}" alt="Avatar" class="w-full h-full rounded-full object-cover" /></div>
                <div class="flex-1">
                    <p class="w-full bg-transparent font-bold text-gray-800 border-0 p-0 focus:ring-0">${profileName}</p>
                    <p class="w-full bg-transparent text-sm text-gray-500 border-0 p-0 focus:ring-0">${profileHandle}</p>
                </div>
            </div>` : ''}
            <div class="mt-3 w-full relative ${isPhraseMode ? 'min-h-[18rem] flex items-center justify-center' : ''}">
                <textarea class="edit-text-area w-full bg-transparent p-0 border-0 focus:ring-0 resize-none ${isPhraseMode ? 'text-2xl font-bold text-center' : `text-lg text-gray-900`}" placeholder="Escribe tu texto aquí..." rows="1">${meme.editText}</textarea>
                ${!isPhraseMode ? `<img src="${meme.imageUrl}" alt="Meme" class="w-full h-auto rounded-lg object-cover mt-3" />` : ''}
                ${watermark.type !== 'none' ? `
                <div class="absolute pointer-events-none select-none" style="left: ${watermark.x}%; top: ${watermark.y}%; opacity: ${watermark.opacity}; transform: translate(-50%, -50%);">
                    ${watermark.type === 'text' ? `<span class="font-bold text-white whitespace-nowrap" style="WebkitTextStroke: 1px black; text-shadow: 2px 2px 4px rgba(0,0,0,0.7); font-size: ${watermark.size * 4}px">${watermark.text}</span>` : `<img src="${watermark.imageUrl}" alt="Watermark" class="h-auto" style="max-width: ${watermark.size * 15}px" />`}
                </div>` : ''}
            </div>
        </div>
        <div class="p-4 flex flex-col gap-3">
            <h3 class="text-sm font-bold text-indigo-300 uppercase tracking-wider">Sugerencias de la IA</h3>
            <div class="flex flex-col gap-2">
                ${Object.entries(meme.titles).map(([key, title]) => `
                    <button class="suggestion-btn text-left p-3 bg-gray-700/50 hover:bg-indigo-500/30 rounded-lg transition-colors flex items-start gap-2 text-gray-200" data-title="${title}">
                        <span class="text-xl">${EMOJIS[key] || '✏️'}</span>
                        <span class="flex-1">${title}</span>
                    </button>`).join('')}
            </div>
            <button class="download-btn mt-4 w-full px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg">
                Descargar
            </button>
        </div>
    </div>`;
};

const getFooterButtonsHTML = () => {
    const hasImages = state.uploadedImages.length > 0;
    const hasMemes = state.generatedMemes.length > 0;
    let buttons = '';
    if (hasImages || hasMemes) {
        buttons += `<button id="reset-btn" class="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors">Empezar de Nuevo</button>`;
    }
    const showGenerate = (state.titleType === 'meme' && hasImages && !hasMemes) || (state.titleType === 'frase' && !hasMemes);
    if (showGenerate) {
        buttons += `<button id="generate-btn" class="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg">
            ${state.titleType === 'meme' ? 'Generar Títulos' : 'Generar Frases'}
        </button>`;
    }
    return buttons;
};

// --- RENDER ORCHESTRATOR ---
const render = () => {
    // API Key
    DOMElements.apiKeyContainer.innerHTML = getApiKeyManagerHTML();

    // Error
    DOMElements.errorContainer.textContent = state.error;
    DOMElements.errorContainer.classList.toggle('hidden', !state.error);

    // Main Content Views
    const currentView = state.isLoading ? 'loading' : (state.generatedMemes.length > 0 ? 'results' : (state.uploadedImages.length > 0 && state.titleType === 'meme' ? 'preview' : 'upload'));
    
    DOMElements.loadingContainer.classList.toggle('hidden', currentView !== 'loading');
    DOMElements.uploaderContainer.classList.toggle('hidden', currentView !== 'upload' || state.titleType !== 'meme');
    DOMElements.previewContainer.classList.toggle('hidden', currentView !== 'preview');
    DOMElements.resultsContainer.classList.toggle('hidden', currentView !== 'results');
    
    if (currentView === 'loading') {
        DOMElements.loadingText.textContent = state.titleType === 'meme' ? 'Analizando imágenes...' : 'Generando frases...';
    } else if (currentView === 'upload' && state.titleType === 'meme') {
        DOMElements.uploaderContainer.innerHTML = getUploaderHTML();
    } else if (currentView === 'preview') {
        DOMElements.previewContainer.innerHTML = getPreviewHTML();
    } else if (currentView === 'results') {
        DOMElements.resultsContainer.innerHTML = getResultsHTML();
    }

    // Footer
    DOMElements.footerButtons.innerHTML = getFooterButtonsHTML();

    // Attach all event listeners
    attachEventListeners();
};


// --- EVENT LISTENERS ---
const attachEventListeners = () => {
    // API Key
    document.getElementById('edit-api-key-btn')?.addEventListener('click', () => {
        state.apiKey = null;
        render();
    });
    document.getElementById('save-api-key-btn')?.addEventListener('click', () => {
        const input = document.getElementById('api-key-input');
        if (input && input.value.trim()) {
            state.apiKey = input.value.trim();
            localStorage.setItem('gemini-api-key', state.apiKey);
            render();
        }
    });

    // Mode Switch
    DOMElements.modeMemeBtn.addEventListener('click', () => handleModeChange('meme'));
    DOMElements.modeFraseBtn.addEventListener('click', () => handleModeChange('frase'));

    // Uploader
    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('change', (e) => handleFilesSelected(Array.from(e.target.files || [])));
    }
    
    // Main Actions
    document.getElementById('reset-btn')?.addEventListener('click', handleReset);
    document.getElementById('generate-btn')?.addEventListener('click', handleGenerate);
    
    // Results Page Listeners
    if (state.generatedMemes.length > 0) {
        // Global Design
        document.getElementById('show-header-toggle')?.addEventListener('change', (e) => {
            state.designSettings.showHeader = e.target.checked;
            render();
        });
        document.getElementById('avatar-img')?.addEventListener('click', () => document.getElementById('avatar-upload').click());
        document.getElementById('avatar-upload')?.addEventListener('change', handleAvatarChange);
        document.getElementById('profile-name-input')?.addEventListener('input', (e) => state.designSettings.profileName = e.target.value);
        document.getElementById('profile-handle-input')?.addEventListener('input', (e) => state.designSettings.profileHandle = e.target.value);
        
        // Watermark
        document.getElementById('add-text-watermark-btn')?.addEventListener('click', () => {
            state.designSettings.watermark.type = 'text';
            render();
        });
        document.getElementById('add-image-watermark-btn')?.addEventListener('click', () => document.getElementById('watermark-upload').click());
        document.getElementById('watermark-upload')?.addEventListener('change', handleWatermarkImageChange);
        document.getElementById('remove-watermark-btn')?.addEventListener('click', () => {
            state.designSettings.watermark.type = 'none';
            if (state.designSettings.watermark.imageUrl) URL.revokeObjectURL(state.designSettings.watermark.imageUrl);
            state.designSettings.watermark.imageUrl = null;
            render();
        });
        document.getElementById('watermark-text-input')?.addEventListener('input', (e) => {
            state.designSettings.watermark.text = e.target.value;
            render();
        });
        document.getElementById('watermark-size-slider')?.addEventListener('input', (e) => {
             state.designSettings.watermark.size = parseFloat(e.target.value);
             render();
        });
        document.getElementById('watermark-opacity-slider')?.addEventListener('input', (e) => {
             state.designSettings.watermark.opacity = parseFloat(e.target.value);
             render();
        });
        
        const watermarkDraggable = document.getElementById('watermark-draggable');
        if (watermarkDraggable) {
           watermarkDraggable.addEventListener('mousedown', handleWatermarkDragStart);
        }

        // Meme Cards
        document.querySelectorAll('.suggestion-btn').forEach(btn => btn.addEventListener('click', handleSuggestionClick));
        document.querySelectorAll('.download-btn').forEach(btn => btn.addEventListener('click', handleDownload));
        document.querySelectorAll('.edit-text-area').forEach(area => {
            area.addEventListener('input', handleMemeTextChange);
            // Auto-grow logic
            area.style.height = 'auto';
            area.style.height = `${area.scrollHeight}px`;
        });
    }
};

// --- HANDLER FUNCTIONS ---
const handleModeChange = (type) => {
    if (state.titleType === type) return;
    handleReset();
    state.titleType = type;
    DOMElements.modeMemeBtn.classList.toggle('bg-indigo-600', type === 'meme');
    DOMElements.modeMemeBtn.classList.toggle('text-white', type === 'meme');
    DOMElements.modeMemeBtn.classList.toggle('shadow-md', type === 'meme');
    DOMElements.modeMemeBtn.classList.toggle('text-gray-300', type !== 'meme');
    DOMElements.modeMemeBtn.classList.toggle('hover:bg-gray-700', type !== 'meme');
    DOMElements.modeFraseBtn.classList.toggle('bg-purple-600', type === 'frase');
    DOMElements.modeFraseBtn.classList.toggle('text-white', type === 'frase');
    DOMElements.modeFraseBtn.classList.toggle('shadow-md', type === 'frase');
    DOMElements.modeFraseBtn.classList.toggle('text-gray-300', type !== 'frase');
    DOMElements.modeFraseBtn.classList.toggle('hover:bg-gray-700', type !== 'frase');
    render();
};

const handleFilesSelected = (files) => {
    const newImages = files.map(file => ({
        id: `${file.name}-${Date.now()}`,
        file,
        previewUrl: URL.createObjectURL(file),
    }));
    state.uploadedImages.push(...newImages);
    state.generatedMemes = [];
    state.error = null;
    render();
};

const handleGenerate = async () => {
    if (!state.apiKey) {
        state.error = 'Por favor, configura tu API Key de Gemini para generar contenido.';
        render();
        return;
    }
    state.isLoading = true;
    state.error = null;
    state.generatedMemes = [];
    render();

    try {
        if (state.titleType === 'meme') {
            const memePromises = state.uploadedImages.map(async (image) => {
                const titles = await generateTitles(image.file, state.apiKey);
                return { id: image.id, imageUrl: image.previewUrl, titles, editText: Object.values(titles)[0] || '' };
            });
            state.generatedMemes = await Promise.all(memePromises);
        } else {
            const phrases = await generatePhrases(state.apiKey);
            state.generatedMemes = phrases.map((p, index) => ({
                id: `phrase-${Date.now()}-${index}`,
                imageUrl: WHITE_PIXEL,
                titles: p,
                editText: Object.values(p)[0] || '',
            }));
        }
    } catch (err) {
        state.error = err.message || 'Ocurrió un error durante la generación. Por favor, inténtalo de nuevo.';
        console.error('An error occurred during generation:', err);
    } finally {
        state.isLoading = false;
        render();
    }
};

const handleReset = () => {
    state.uploadedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    if (state.designSettings.profileAvatarUrl !== DEFAULT_AVATAR_URL) URL.revokeObjectURL(state.designSettings.profileAvatarUrl);
    if (state.designSettings.watermark.imageUrl) URL.revokeObjectURL(state.designSettings.watermark.imageUrl);
    
    state.uploadedImages = [];
    state.generatedMemes = [];
    state.error = null;
    state.isLoading = false;
    state.designSettings = {
        showHeader: true,
        profileName: 'Blogfun',
        profileHandle: '@blogfun',
        profileAvatarUrl: DEFAULT_AVATAR_URL,
        watermark: { type: 'none', text: 'Tu Marca de Agua', imageUrl: null, opacity: 0.7, size: 5, x: 50, y: 85, imageWidth: 0, imageHeight: 0 },
    };
    render();
};

const handleSuggestionClick = (e) => {
    const button = e.currentTarget;
    const card = button.closest('[data-meme-id]');
    if (!card) return;

    const memeId = card.dataset.memeId;
    const newText = button.dataset.title;
    
    const meme = state.generatedMemes.find(m => m.id === memeId);
    if (meme) {
        meme.editText = newText;
        const area = card.querySelector('.edit-text-area');
        if (area) {
            area.value = newText;
            // Trigger auto-grow
            area.style.height = 'auto';
            area.style.height = `${area.scrollHeight}px`;
        }
    }
};

const handleDownload = async (e) => {
    const button = e.currentTarget;
    const card = button.closest('[data-meme-id]');
    if (!card) return;
    
    const memeId = card.dataset.memeId;
    const meme = state.generatedMemes.find(m => m.id === memeId);
    
    if (!meme || !meme.editText) {
        state.error = "El texto no puede estar vacío.";
        render();
        return;
    }
    
    try {
        const creationData = {
            mainImageUrl: meme.imageUrl,
            text: meme.editText,
            design: state.designSettings,
        };
        const dataUrl = state.titleType === 'frase'
            ? await createPhraseImage(creationData)
            : await createMemeImage(creationData);
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${state.titleType}-${meme.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (downloadError) {
        console.error("Failed to create and download image:", downloadError);
        state.error = "No se pudo crear la imagen para descargar.";
        render();
    }
};

const handleMemeTextChange = (e) => {
    const area = e.currentTarget;
    const card = area.closest('[data-meme-id]');
    if (!card) return;

    const memeId = card.dataset.memeId;
    const meme = state.generatedMemes.find(m => m.id === memeId);
    if (meme) {
      meme.editText = area.value;
    }
    
    // Auto-grow logic
    area.style.height = 'auto';
    area.style.height = `${area.scrollHeight}px`;
};

const handleAvatarChange = (e) => {
    const target = e.target;
    if (target.files && target.files[0]) {
        const newAvatarUrl = URL.createObjectURL(target.files[0]);
        if (state.designSettings.profileAvatarUrl !== DEFAULT_AVATAR_URL) {
            URL.revokeObjectURL(state.designSettings.profileAvatarUrl);
        }
        state.designSettings.profileAvatarUrl = newAvatarUrl;
        render();
    }
};

const handleWatermarkImageChange = (e) => {
    const target = e.target;
    if (target.files && target.files[0]) {
        const newImageUrl = URL.createObjectURL(target.files[0]);
        const img = new Image();
        img.onload = () => {
            if (state.designSettings.watermark.imageUrl) {
                URL.revokeObjectURL(state.designSettings.watermark.imageUrl);
            }
            state.designSettings.watermark = {
                ...state.designSettings.watermark,
                type: 'image',
                imageUrl: newImageUrl,
                imageWidth: img.width,
                imageHeight: img.height,
            };
            render();
        };
        img.src = newImageUrl;
    }
};

const handleWatermarkDragStart = (e) => {
    e.preventDefault();
    const watermarkEl = e.target.closest('#watermark-draggable');
    const previewBox = document.getElementById('watermark-preview-box');
    if (!watermarkEl || !previewBox) return;

    const onMouseMove = (moveEvent) => {
        const boxRect = previewBox.getBoundingClientRect();
        let x = moveEvent.clientX - boxRect.left;
        let y = moveEvent.clientY - boxRect.top;

        let xPercent = (x / boxRect.width) * 100;
        let yPercent = (y / boxRect.height) * 100;
        
        xPercent = Math.max(0, Math.min(100, xPercent));
        yPercent = Math.max(0, Math.min(100, yPercent));

        state.designSettings.watermark.x = xPercent;
        state.designSettings.watermark.y = yPercent;
        
        watermarkEl.style.left = `${xPercent}%`;
        watermarkEl.style.top = `${yPercent}%`;
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        render(); // Re-render to ensure state consistency
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
};


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
        state.apiKey = savedKey;
    }
    render();
});