
import { generateTitles, generatePhrases } from './services/geminiService.js';
import { createMemeImage, createPhraseImage, createTweetImage } from './services/imageService.js';

const DEFAULT_AVATAR_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJyb3RhdGUoMTAgNTAgNTApIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0iI0ZGRiIgc3Ryb2tlPSIjREREIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDY1LDQwIEMgNjgsMzUgNzIsMzUgNzUsNDAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iNSIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjxwYXRoIGQ9Ik0gMzAsNjUgUSA1MCw4NSA3MCw2NSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI2IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+PGNpcmNsZSBjeD0iMzUiIGN5PSI0MCIgcj0iNSIgZmlsbD0iYmxhY2siIC8+PC9nPjwvc3ZnPg==';
const WHITE_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
const DESIGN_SETTINGS_KEY = 'viral-generator-design-settings';
const EMOJIS = {
    // Pareja
    sarcasmo: '😏',
    drama: '😭',
    indirecta: '🤫',
    // Familia
    nostalgia: '😌',
    ternura: '❤️',
    // Trabajo
    sarcasmoTrabajo: '😤',
    estres: '😫',
    humorTrabajo: '😂',
    // Frases (some are shared)
    relaciones: '💔',
    chisme: '😏',
    humor: '😅',
    reflexion: '😌',
    sarcasmoFrase: '😤',
    // Tweet
    tweet: '🐦'
};

// --- STATE MANAGEMENT ---
const state = {
    apiKey: null,
    uploadedImages: [],
    generatedMemes: [],
    titleType: 'meme',
    memeCategory: 'pareja',
    phraseCount: 10,
    phraseLength: 'corto',
    designSettings: {
        showHeader: true,
        profileName: 'Blogfun',
        profileHandle: '@blogfun',
        profileAvatarUrl: DEFAULT_AVATAR_URL,
        textAlign: 'left',
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
    modeTweetBtn: document.getElementById('mode-tweet-btn'),
    errorContainer: document.getElementById('error-container'),
    uploaderContainer: document.getElementById('uploader-container'),
    previewContainer: document.getElementById('preview-container'),
    resultsContainer: document.getElementById('results-container'),
    loadingContainer: document.getElementById('loading-container'),
    loadingText: document.getElementById('loading-text'),
    footerButtons: document.getElementById('footer-buttons'),
    memeCategoryContainer: document.getElementById('meme-category-container'),
    mainContent: document.getElementById('main-content'),
    phraseOptionsContainer: document.getElementById('phrase-options-container'),
};

// --- HELPERS ---
const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const saveDesignSettings = () => {
    try {
        const settings = {
            profileName: state.designSettings.profileName,
            profileHandle: state.designSettings.profileHandle,
            profileAvatarUrl: state.designSettings.profileAvatarUrl,
            showHeader: state.designSettings.showHeader,
            textAlign: state.designSettings.textAlign,
        };
        localStorage.setItem(DESIGN_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save design settings:", e);
    }
};

const loadDesignSettings = () => {
    try {
        const savedSettings = localStorage.getItem(DESIGN_SETTINGS_KEY);
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            state.designSettings.profileName = parsed.profileName || 'Blogfun';
            state.designSettings.profileHandle = parsed.profileHandle || '@blogfun';
            state.designSettings.profileAvatarUrl = parsed.profileAvatarUrl || DEFAULT_AVATAR_URL;
            state.designSettings.showHeader = typeof parsed.showHeader === 'boolean' ? parsed.showHeader : true;
            state.designSettings.textAlign = parsed.textAlign || 'left';
        }
    } catch (e) {
        console.error("Failed to load design settings:", e);
    }
};

const cleanText = (text) => {
    if (!text) return '';
    // Elimina comillas dobles, rizadas de apertura y cierre del principio y del final
    return text.trim().replace(/^["“]|["”]$/g, '');
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

const getMemeCategorySelectorHTML = () => {
    const categories = [
        { id: 'pareja', label: 'Amor y Pareja', icon: '💑' },
        { id: 'familia', label: 'Familia', icon: '👩‍👧' },
        { id: 'trabajo', label: 'Trabajo y Vida', icon: '💼' }
    ];
    return `
    <div class="flex flex-col items-center justify-center mb-8 gap-3">
        <h3 class="text-lg font-semibold text-gray-300">Elige el tema de tu meme:</h3>
        <div class="flex flex-wrap justify-center gap-3">
            ${categories.map(cat => `
                <button
                    data-category="${cat.id}"
                    class="meme-category-btn px-4 py-2 text-base font-semibold rounded-lg transition-colors border-2 ${
                        state.memeCategory === cat.id
                            ? 'bg-teal-500 border-teal-400 text-white shadow-lg'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                    }">
                    ${cat.icon} ${cat.label}
                </button>
            `).join('')}
        </div>
    </div>
    `;
};

const getPhraseOptionsHTML = () => {
    const isTweetMode = state.titleType === 'tweet';
    const lengthOptions = isTweetMode ? [
        { id: 'corto', label: 'Corto' }
    ] : [
        { id: 'muy-corto', label: 'Muy Corto' },
        { id: 'corto', label: 'Corto' },
        { id: 'largo', label: 'Largo' },
    ];
    return `
    <div class="flex flex-col items-center justify-center gap-6 mb-8">
        <div class="flex items-center gap-3">
            <label for="phrase-count-input" class="text-gray-300">Número de ${isTweetMode ? 'tweets' : 'frases'}:</label>
            <input type="number" id="phrase-count-input" value="${state.phraseCount}" min="1" max="20" class="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-20 text-center" />
        </div>
        ${!isTweetMode ? `
        <div class="flex flex-col items-center gap-3">
            <label class="text-gray-300">Largo de los textos:</label>
            <div class="flex gap-2 rounded-lg bg-gray-900 p-1">
                ${lengthOptions.map(opt => `
                    <button
                        data-length="${opt.id}"
                        class="phrase-length-btn px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                            state.phraseLength === opt.id
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }">
                        ${opt.label}
                    </button>
                `).join('')}
            </div>
        </div>` : ''}
    </div>
    `;
};

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
    const { showHeader, profileName, profileHandle, profileAvatarUrl, watermark, textAlign } = state.designSettings;
    const isTextMode = state.titleType === 'frase' || state.titleType === 'tweet';
    const alignmentOptions = [
        { align: 'left', label: 'Izquierda', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>' },
        { align: 'center', label: 'Centro', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M6.75 17.25h10.5" /></svg>' },
        { align: 'right', label: 'Derecha', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-12 5.25h12" /></svg>' },
        { align: 'justify', label: 'Justificar', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>' }
    ];

    return `
    <div class="p-6 bg-gray-800 rounded-xl shadow-lg mb-8 border border-gray-700">
        <h2 class="text-xl font-bold text-indigo-300 mb-4">Controles de Diseño Globales</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
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
                ${isTextMode ? '' : `
                <div>
                    <h3 class="text-lg font-semibold text-gray-200 mt-4">Alineación de Texto</h3>
                    <div class="flex gap-1 rounded-lg bg-gray-900 p-1 mt-2">
                         ${alignmentOptions.map(({ align, label, icon }) => `
                            <button
                                data-align="${align}"
                                class="alignment-btn flex-1 p-2 rounded-md transition-colors ${textAlign === align ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}"
                                aria-label="Alinear ${label}"
                                title="${label}"
                            >
                                ${icon}
                            </button>
                        `).join('')}
                    </div>
                </div>`}
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
                        <button data-action="add-text-watermark" class="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Añadir Texto</button>
                        <button data-action="add-image-watermark" class="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Añadir Imagen</button>
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
                        <button data-action="remove-watermark" class="text-center py-2 bg-red-800 hover:bg-red-700 rounded-lg transition-colors text-sm">Quitar Marca</button>
                    </div>
                `}
                </div>
            </div>
        </div>
    </div>`;
};

const getMemeCardHTML = (meme) => {
    const { showHeader, profileName, profileHandle, profileAvatarUrl, watermark, textAlign } = state.designSettings;
    const isPhraseMode = state.titleType === 'frase';
    const isTweetMode = state.titleType === 'tweet';

    let containerClasses = 'bg-gray-100 text-gray-900';
    if (isPhraseMode || isTweetMode) containerClasses = 'bg-white';
    if (isPhraseMode) containerClasses += ' aspect-square flex flex-col';

    let contentLayoutClasses = 'w-full relative';
    if (isPhraseMode) {
        contentLayoutClasses += ' flex-grow flex items-center justify-center';
    }

    const headerHTML = `
        <div class="flex gap-3 ${isTweetMode ? 'mb-3' : ''}">
            <div class="w-12 h-12 flex-shrink-0"><img src="${profileAvatarUrl}" alt="Avatar" class="w-full h-full rounded-full object-cover" /></div>
            <div class="flex-1" ${isTweetMode ? 'style="padding-top: 2px;"' : ''}>
                <p class="font-bold text-gray-800" style="${isTweetMode ? 'font-size: 16px; line-height: 1.2;' : 'font-size: 1rem;'}">${profileName}</p>
                <p class="text-gray-500" style="${isTweetMode ? 'font-size: 15px; line-height: 1.2;' : 'font-size: 0.875rem;'}">${profileHandle}</p>
            </div>
        </div>`;

    let textEditorHTML;
    if (isTweetMode) {
        textEditorHTML = `<div
                contenteditable="true"
                class="edit-text-area w-full bg-transparent p-0 border-0 focus:ring-0 whitespace-pre-wrap break-words"
                style="font-size: 23px; line-height: 30px;"
                data-placeholder="Escribe tu texto aquí..."
            >${meme.editText}</div>`;
    } else if (isPhraseMode) {
        textEditorHTML = `<div
                contenteditable="true"
                class="edit-text-area w-full bg-transparent p-0 border-0 focus:ring-0 whitespace-pre-wrap break-words"
                style="font-size: 28px; line-height: 40px; text-align: ${textAlign};"
                data-placeholder="Escribe tu texto aquí..."
            >${meme.editText}</div>`;
    } else { // Meme mode
        textEditorHTML = `<textarea
                class="edit-text-area w-full bg-transparent p-0 border-0 focus:ring-0 resize-none text-lg text-gray-900"
                style="text-align: ${textAlign};"
                placeholder="Escribe tu texto aquí..."
                rows="1"
            >${meme.editText}</textarea>`;
    }

    return `
    <div class="bg-gray-800 rounded-lg shadow-lg shadow-black/30 flex flex-col gap-4" data-meme-id="${meme.id}">
        <div class="${containerClasses} text-gray-900 rounded-t-lg border-b border-gray-200 relative overflow-hidden p-4">
            ${(showHeader && (isPhraseMode || isTweetMode)) || (!isTweetMode && showHeader) ? headerHTML : ''}
            <div class="${contentLayoutClasses} ${!isTweetMode ? 'mt-3' : ''}">
                ${textEditorHTML}
                ${!isPhraseMode && !isTweetMode ? `<img src="${meme.imageUrl}" alt="Meme" class="w-full h-auto rounded-lg object-cover mt-3" />` : ''}
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
    const showGenerate = (state.titleType === 'meme' && hasImages && !hasMemes) || ((state.titleType === 'frase' || state.titleType === 'tweet') && !hasMemes);
    if (showGenerate) {
        let buttonText = 'Generar';
        if (state.titleType === 'meme') buttonText = 'Generar Títulos';
        if (state.titleType === 'frase') buttonText = 'Generar Frases';
        if (state.titleType === 'tweet') buttonText = 'Generar Tweets';
        buttons += `<button id="generate-btn" class="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg">
            ${buttonText}
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
    
    // Category Selector
    const showCategorySelector = state.titleType === 'meme' && state.generatedMemes.length === 0 && !state.isLoading;
    DOMElements.memeCategoryContainer.classList.toggle('hidden', !showCategorySelector);
    if (showCategorySelector) {
        DOMElements.memeCategoryContainer.innerHTML = getMemeCategorySelectorHTML();
    }
    
    // Phrase Options
    const showPhraseOptions = (state.titleType === 'frase' || state.titleType === 'tweet') && state.generatedMemes.length === 0 && !state.isLoading;
    DOMElements.phraseOptionsContainer.classList.toggle('hidden', !showPhraseOptions);
    if (showPhraseOptions) {
        DOMElements.phraseOptionsContainer.innerHTML = getPhraseOptionsHTML();
    }
    
    DOMElements.loadingContainer.classList.toggle('hidden', currentView !== 'loading');
    DOMElements.uploaderContainer.classList.toggle('hidden', currentView !== 'upload' || state.titleType !== 'meme');
    DOMElements.previewContainer.classList.toggle('hidden', currentView !== 'preview');
    DOMElements.resultsContainer.classList.toggle('hidden', currentView !== 'results');
    
    if (currentView === 'loading') {
        DOMElements.loadingText.textContent = state.titleType === 'meme' ? 'Analizando imágenes...' : (state.titleType === 'tweet' ? 'Generando tweets...' : 'Generando frases...');
    } else if (currentView === 'upload' && state.titleType === 'meme') {
        DOMElements.uploaderContainer.innerHTML = getUploaderHTML();
    } else if (currentView === 'preview') {
        DOMElements.previewContainer.innerHTML = getPreviewHTML();
    } else if (currentView === 'results') {
        DOMElements.resultsContainer.innerHTML = getResultsHTML();
    }

    // Footer
    DOMElements.footerButtons.innerHTML = getFooterButtonsHTML();
};


// --- HANDLER FUNCTIONS ---
const handleCategoryChange = (category) => {
    if (state.memeCategory === category || state.isLoading) return;
    state.memeCategory = category;
    render();
};

const handleModeChange = (type) => {
    if (state.titleType === type || state.isLoading) return;
    handleReset();
    state.titleType = type;
    
    if (type === 'tweet') {
        state.designSettings.textAlign = 'left';
    } else if (type === 'frase') {
        state.designSettings.textAlign = 'center';
    } else {
        state.designSettings.textAlign = 'left';
    }

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

    DOMElements.modeTweetBtn.classList.toggle('bg-sky-600', type === 'tweet');
    DOMElements.modeTweetBtn.classList.toggle('text-white', type === 'tweet');
    DOMElements.modeTweetBtn.classList.toggle('shadow-md', type === 'tweet');
    DOMElements.modeTweetBtn.classList.toggle('text-gray-300', type !== 'tweet');
    DOMElements.modeTweetBtn.classList.toggle('hover:bg-gray-700', type !== 'tweet');

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

const cleanAllTitles = (titles) => {
    const cleaned = {};
    for (const key in titles) {
        cleaned[key] = cleanText(titles[key]);
    }
    return cleaned;
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
                const titles = await generateTitles(image.file, state.apiKey, state.memeCategory);
                const cleanedTitles = cleanAllTitles(titles);
                return { id: image.id, imageUrl: image.previewUrl, titles: cleanedTitles, editText: Object.values(cleanedTitles)[0] || '' };
            });
            state.generatedMemes = await Promise.all(memePromises);
        } else if (state.titleType === 'frase' || state.titleType === 'tweet') {
            const results = await generatePhrases(state.apiKey, state.phraseCount, state.phraseLength);
            const cleanedResults = results.map(p => cleanAllTitles(p));
            state.generatedMemes = cleanedResults.map((p, index) => ({
                id: `${state.titleType}-${Date.now()}-${index}`,
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
    // Revoke object URLs for uploaded files
    state.uploadedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    // Revoke watermark image if it's a blob URL
    if (state.designSettings.watermark.imageUrl && state.designSettings.watermark.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(state.designSettings.watermark.imageUrl);
    }
    
    // Reset volatile state
    state.uploadedImages = [];
    state.generatedMemes = [];
    state.error = null;
    state.isLoading = false;
    state.memeCategory = 'pareja';
    state.phraseCount = 10;
    state.phraseLength = 'corto';
    
    // Only reset watermark, keep profile settings
    state.designSettings.watermark = { type: 'none', text: 'Tu Marca de Agua', imageUrl: null, opacity: 0.7, size: 5, x: 50, y: 85, imageWidth: 0, imageHeight: 0 };
    
    render();
};

const handleSuggestionClick = (button) => {
    const card = button.closest('[data-meme-id]');
    if (!card) return;

    const memeId = card.dataset.memeId;
    const newText = button.dataset.title;
    
    const meme = state.generatedMemes.find(m => m.id === memeId);
    if (meme) {
        meme.editText = newText; // Text is already cleaned
        const area = card.querySelector('.edit-text-area');
        if (area) {
            if (area.tagName === 'TEXTAREA') {
                area.value = newText;
                // Trigger auto-grow
                area.style.height = 'auto';
                area.style.height = `${area.scrollHeight}px`;
            } else {
                area.textContent = newText;
            }
        }
    }
};

const handleDownload = async (button) => {
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

        let dataUrl;
        if (state.titleType === 'frase') {
            dataUrl = await createPhraseImage(creationData);
        } else if (state.titleType === 'tweet') {
            dataUrl = await createTweetImage(creationData);
        } else {
            dataUrl = await createMemeImage(creationData);
        }
        
        const win = window.open();
        win.document.write(`<body style="margin:0; background:#111;"><img src="${dataUrl}" style="display:block; margin:auto; max-width:100%; height:auto; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);" alt="Generated Image"></body>`);

    } catch (downloadError) {
        console.error("Failed to create and download image:", downloadError);
        state.error = "No se pudo crear la imagen para descargar.";
        render();
    }
};

const handleMemeTextChange = (element) => {
    const card = element.closest('[data-meme-id]');
    if (!card) return;

    const memeId = card.dataset.memeId;
    const meme = state.generatedMemes.find(m => m.id === memeId);
    if (meme) {
        if (element.tagName === 'TEXTAREA') {
            meme.editText = element.value;
            // Auto-grow logic for textarea
            element.style.height = 'auto';
            element.style.height = `${element.scrollHeight}px`;
        } else {
            meme.editText = element.textContent || '';
        }
    }
};

const handleAvatarChange = async (e) => {
    const target = e.target;
    if (target.files && target.files[0]) {
        try {
            const dataUrl = await fileToDataURL(target.files[0]);
            if (state.designSettings.profileAvatarUrl && state.designSettings.profileAvatarUrl.startsWith('blob:')) {
                 URL.revokeObjectURL(state.designSettings.profileAvatarUrl);
            }
            state.designSettings.profileAvatarUrl = dataUrl;
            saveDesignSettings();
            render();
        } catch (err) {
            console.error("Error processing avatar image:", err);
            state.error = "No se pudo cargar la imagen de perfil.";
            render();
        }
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


// --- INITIALIZATION & EVENT LISTENERS ---
const initialize = () => {
    // Load initial state
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
        state.apiKey = savedKey;
    }
    loadDesignSettings();

    // Attach static listeners
    DOMElements.modeMemeBtn.addEventListener('click', () => handleModeChange('meme'));
    DOMElements.modeFraseBtn.addEventListener('click', () => handleModeChange('frase'));
    DOMElements.modeTweetBtn.addEventListener('click', () => handleModeChange('tweet'));

    // Attach delegated listeners to parent containers
    DOMElements.apiKeyContainer.addEventListener('click', (e) => {
        if (e.target.id === 'save-api-key-btn') {
            const input = document.getElementById('api-key-input');
            if (input && input.value.trim()) {
                state.apiKey = input.value.trim();
                localStorage.setItem('gemini-api-key', state.apiKey);
                render();
            }
        } else if (e.target.id === 'edit-api-key-btn') {
            state.apiKey = null;
            render();
        }
    });
    
    DOMElements.uploaderContainer.addEventListener('change', (e) => {
        if (e.target.id === 'file-upload') {
            handleFilesSelected(Array.from(e.target.files || []));
        }
    });

    DOMElements.phraseOptionsContainer.addEventListener('input', (e) => {
        if (e.target.id === 'phrase-count-input') {
            let count = parseInt(e.target.value, 10);
            if (isNaN(count) || count < 1) count = 1;
            if (count > 20) count = 20;
            state.phraseCount = count;
        }
    });

    DOMElements.phraseOptionsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.phrase-length-btn');
        if (btn) {
            const length = btn.dataset.length;
            if (length && length !== state.phraseLength) {
                state.phraseLength = length;
                render();
            }
        }
    });

    DOMElements.footerButtons.addEventListener('click', (e) => {
        if (e.target.id === 'reset-btn') handleReset();
        if (e.target.id === 'generate-btn') handleGenerate();
    });

    // Delegated listener for category buttons
    DOMElements.memeCategoryContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.meme-category-btn');
        if (btn) {
            handleCategoryChange(btn.dataset.category);
        }
    });

    // Delegated listeners for the results container, which is often re-rendered
    DOMElements.resultsContainer.addEventListener('click', (e) => {
        const target = e.target;
        const alignBtn = target.closest('.alignment-btn');
        if (target.closest('.suggestion-btn')) handleSuggestionClick(target.closest('.suggestion-btn'));
        if (target.closest('.download-btn')) handleDownload(target.closest('.download-btn'));
        if (target.id === 'avatar-img') document.getElementById('avatar-upload').click();
        if (target.dataset.action === 'add-text-watermark') {
             state.designSettings.watermark.type = 'text';
             render();
        }
        if (target.dataset.action === 'add-image-watermark') {
            document.getElementById('watermark-upload').click();
        }
        if (target.dataset.action === 'remove-watermark') {
            state.designSettings.watermark.type = 'none';
            if (state.designSettings.watermark.imageUrl) URL.revokeObjectURL(state.designSettings.watermark.imageUrl);
            state.designSettings.watermark.imageUrl = null;
            render();
        }
        if (alignBtn && alignBtn.dataset.align) {
            state.designSettings.textAlign = alignBtn.dataset.align;
            saveDesignSettings();
            render();
        }
    });

    DOMElements.resultsContainer.addEventListener('input', (e) => {
        const target = e.target;
        if (target.matches('.edit-text-area')) handleMemeTextChange(target);
        if (target.id === 'profile-name-input') {
            state.designSettings.profileName = target.value;
            saveDesignSettings();
        }
        if (target.id === 'profile-handle-input') {
            state.designSettings.profileHandle = target.value;
            saveDesignSettings();
        }
        if (target.id === 'watermark-text-input') {
            state.designSettings.watermark.text = target.value;
            render();
        }
        if (target.id === 'watermark-size-slider') {
            state.designSettings.watermark.size = parseFloat(target.value);
            render();
        }
        if (target.id === 'watermark-opacity-slider') {
            state.designSettings.watermark.opacity = parseFloat(target.value);
            render();
        }
    });
    
    DOMElements.resultsContainer.addEventListener('change', (e) => {
        const target = e.target;
        if (target.id === 'show-header-toggle') {
            state.designSettings.showHeader = target.checked;
            saveDesignSettings();
            render();
        }
        if (target.id === 'avatar-upload') handleAvatarChange(e);
        if (target.id === 'watermark-upload') handleWatermarkImageChange(e);
    });
    
    DOMElements.resultsContainer.addEventListener('mousedown', (e) => {
        if (e.target.closest('#watermark-draggable')) {
            handleWatermarkDragStart(e);
        }
    });

    // Initial Render
    handleModeChange('meme');
    render();
};

document.addEventListener('DOMContentLoaded', initialize);
