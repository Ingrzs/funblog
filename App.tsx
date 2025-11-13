
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { UploadedImage, GeneratedMeme, Watermark, MemeCreationData, GlobalDesignSettings } from './types';
import { generateTitles, generatePhrases } from './services/geminiService';
import { createMemeImage, createPhraseImage, createTweetImage } from './services/imageService';

const DEFAULT_AVATAR_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJyb3RhdGUoMTAgNTAgNTApIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0iI0ZGRiIgc3Ryb2tlPSIjREREIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDY1LDQwIEMgNjgsMzUgNzIsMzUgNzUsNDAiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iNSIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjxwYXRoIGQ9Ik0gMzAsNjUgUSA1MCw4NSA3MCw2NSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI2IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+PGNpcmNsZSBjeD0iMzUiIGN5PSI0MCIgcj0iNSIgZmlsbD0iYmxhY2siIC8+PC9nPjwvc3ZnPg==';
const WHITE_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
const DESIGN_SETTINGS_KEY = 'viral-generator-design-settings';

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const cleanText = (text: string): string => {
    if (!text) return '';
    // Elimina comillas dobles, rizadas de apertura y cierre del principio y del final
    return text.trim().replace(/^["“]|["”]$/g, '');
};

const ApiKeyManager: React.FC<{
    apiKey: string | null;
    onApiKeyChange: (key: string | null) => void;
}> = ({ apiKey, onApiKeyChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const handleSave = () => {
        if (inputValue.trim()) {
            onApiKeyChange(inputValue.trim());
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        onApiKeyChange(null);
        setInputValue('');
        setIsEditing(false);
    };

    const handleEdit = () => {
        setInputValue(apiKey || '');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setInputValue('');
        setIsEditing(false);
    };

    const maskedKey = apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : '';

    if (apiKey && !isEditing) {
        return (
            <div className="flex items-center justify-center gap-4 p-2 bg-gray-800 rounded-lg mb-6 border border-gray-700">
                <span className="text-sm text-green-400">API Key Guardada:</span>
                <span className="font-mono text-gray-300">{maskedKey}</span>
                <button onClick={handleEdit} className="text-sm text-indigo-400 hover:text-indigo-300">Editar</button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 p-4 bg-gray-800 rounded-lg mb-6 border border-indigo-500/50">
            <label htmlFor="api-key-input" className="text-sm font-semibold text-gray-300 whitespace-nowrap">Tu API Key de Gemini:</label>
            <input
                id="api-key-input"
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Introduce tu API Key aquí"
                className="flex-grow bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white w-full sm:w-auto"
            />
            <div className="flex gap-2 mt-2 sm:mt-0">
                <button onClick={handleSave} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm">Guardar</button>
                {apiKey && isEditing && <button onClick={handleDelete} className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg text-sm">Borrar</button>}
                {isEditing && <button onClick={handleCancel} className="px-4 py-1.5 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg text-sm">Cancelar</button>}
            </div>
        </div>
    );
};


const UploadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const LoadingSpinner: React.FC<{text?: string}> = ({ text = "Generando contenido ingenioso..."}) => (
    <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
        <p className="text-indigo-300 font-semibold">{text}</p>
    </div>
);

const ImageUploader: React.FC<{ onFilesSelected: (files: File[]) => void; disabled: boolean }> = ({ onFilesSelected, disabled }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            onFilesSelected(Array.from(event.target.files));
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <label
                htmlFor="file-upload"
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    disabled ? 'bg-gray-800 border-gray-700 cursor-not-allowed' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-indigo-500'
                }`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadIcon className="w-10 h-10 mb-4 text-gray-400"/>
                    <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold text-indigo-400">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">Sube una o varias imágenes (PNG, JPG, etc.)</p>
                </div>
                <input id="file-upload" type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} disabled={disabled} />
            </label>
        </div>
    );
};

// Fix: Add MemeCategorySelector component
const MemeCategorySelector: React.FC<{
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    disabled: boolean;
}> = ({ selectedCategory, onCategoryChange, disabled }) => {
    const categories = [
        { id: 'pareja', label: 'Amor y Pareja', icon: '💑' },
        { id: 'familia', label: 'Familia', icon: '👩‍👧' },
        { id: 'trabajo', label: 'Trabajo y Vida', icon: '💼' }
    ];

    return (
        <div className="flex flex-col items-center justify-center mb-8 gap-3">
            <h3 className="text-lg font-semibold text-gray-300">Elige el tema de tu meme:</h3>
            <div className="flex flex-wrap justify-center gap-3">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        disabled={disabled}
                        className={`px-4 py-2 text-base font-semibold rounded-lg transition-colors border-2 ${
                            selectedCategory === cat.id
                                ? 'bg-teal-500 border-teal-400 text-white shadow-lg'
                                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {cat.icon} ${cat.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

const AutoGrowTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [props.value]);

    return <textarea ref={textareaRef} {...props} />;
};

// Fix: Update EMOJIS to support new categories
const EMOJIS: Record<string, string> = {
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
    tweet: '🐦'
};

const MemeEditorCard: React.FC<{
    meme: GeneratedMeme;
    designSettings: GlobalDesignSettings;
    onMemeTextChange: (id: string, newText: string) => void;
    onDownload: (meme: GeneratedMeme) => void;
    titleType: 'meme' | 'frase' | 'tweet';
}> = ({ meme, designSettings, onMemeTextChange, onDownload, titleType }) => {
    const { showHeader, profileName, profileHandle, profileAvatarUrl, watermark, textAlign } = designSettings;

    const isPhraseMode = titleType === 'frase';
    const isTweetMode = titleType === 'tweet';

    const mainContentBg = isPhraseMode || isTweetMode ? 'bg-white' : 'bg-gray-100';
    const mainTextColor = 'text-gray-900';

    let mainContainerClasses = `p-4 ${mainContentBg} ${mainTextColor} rounded-t-lg border-b border-gray-200 relative overflow-hidden`;
    if (isPhraseMode) {
        mainContainerClasses += ' aspect-square flex flex-col';
    }

    const headerVisible = (showHeader && (isPhraseMode || isTweetMode)) || (!isTweetMode && showHeader);

    const header = headerVisible && (
        <div className={`flex gap-3 ${isTweetMode ? 'mb-3' : ''}`}>
            <div className="w-12 h-12 flex-shrink-0">
                <img src={profileAvatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="flex-1" style={isTweetMode ? { paddingTop: '2px' } : {}}>
                <p className="font-bold text-gray-800" style={isTweetMode ? { fontSize: '16px', lineHeight: '1.2' } : { fontSize: '1rem' }}>{profileName}</p>
                <p className="text-gray-500" style={isTweetMode ? { fontSize: '15px', lineHeight: '1.2' } : { fontSize: '0.875rem' }}>{profileHandle}</p>
            </div>
        </div>
    );

    const contentLayoutClasses = `w-full relative ${isPhraseMode ? 'flex-grow flex items-center justify-center' : ''} ${!isTweetMode ? 'mt-3' : ''}`;

    let textEditor;
    if (isTweetMode) {
        textEditor = (
            <div
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(e) => onMemeTextChange(meme.id, e.currentTarget.textContent || '')}
                className="edit-text-area w-full bg-transparent p-0 border-0 focus:ring-0 whitespace-pre-wrap break-words"
                style={{ fontSize: '23px', lineHeight: '30px', textAlign: 'left' }}
                data-placeholder="Escribe tu texto aquí..."
                dangerouslySetInnerHTML={{ __html: meme.editText }}
            />
        );
    } else if (isPhraseMode) {
        textEditor = (
            <div
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(e) => onMemeTextChange(meme.id, e.currentTarget.textContent || '')}
                className="edit-text-area w-full bg-transparent p-0 border-0 focus:ring-0 whitespace-pre-wrap break-words"
                style={{ fontSize: '28px', lineHeight: '40px', textAlign }}
                data-placeholder="Escribe tu texto aquí..."
                dangerouslySetInnerHTML={{ __html: meme.editText }}
            />
        );
    } else { // Meme mode
        textEditor = (
            <AutoGrowTextarea
                value={meme.editText}
                onChange={(e) => onMemeTextChange(meme.id, e.target.value)}
                className={`edit-text-area w-full bg-transparent p-0 border-0 focus:ring-0 resize-none text-lg ${mainTextColor}`}
                placeholder="Escribe tu texto aquí..."
                rows={1}
                style={{ textAlign }}
            />
        );
    }


    return (
        <div className="bg-gray-800 rounded-lg shadow-lg shadow-black/30 flex flex-col gap-4">
            <div className={mainContainerClasses}>
                {header}
                <div className={contentLayoutClasses}>
                    {textEditor}
                    {!isPhraseMode && !isTweetMode && (
                        <img src={meme.imageUrl} alt="Meme" className="w-full h-auto rounded-lg object-cover mt-3" />
                    )}
                    {watermark.type !== 'none' && (
                         <div
                            className="absolute pointer-events-none select-none"
                            style={{
                                left: `${watermark.x}%`,
                                top: `${watermark.y}%`,
                                opacity: watermark.opacity,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            {watermark.type === 'text' ? (
                                <span className="font-bold text-white whitespace-nowrap" style={{ WebkitTextStroke: '1px black', textShadow: '2px 2px 4px rgba(0,0,0,0.7)', fontSize: `${watermark.size * 4}px` }}>
                                    {watermark.text}
                                </span>
                            ) : (
                                <img src={watermark.imageUrl!} alt="Watermark" className="h-auto" style={{ maxWidth: `${watermark.size * 15}px` }} />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Sugerencias de la IA</h3>
                <div className="flex flex-col gap-2">
                    {Object.entries(meme.titles).map(([key, title]) => (
                        <button key={key} onClick={() => onMemeTextChange(meme.id, title)} className="text-left p-3 bg-gray-700/50 hover:bg-indigo-500/30 rounded-lg transition-colors flex items-start gap-2 text-gray-200">
                            <span className="text-xl">{EMOJIS[key] || '✏️'}</span>
                            <span className="flex-1">{title}</span>
                        </button>
                    ))}
                </div>

                <button onClick={() => onDownload(meme)} className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg">
                    Descargar
                </button>
            </div>
        </div>
    );
};


const GlobalDesignControls: React.FC<{
    settings: GlobalDesignSettings;
    titleType: 'meme' | 'frase' | 'tweet';
    onSettingsChange: (updates: Partial<GlobalDesignSettings>) => void;
    onWatermarkSettingsChange: (updates: Partial<Watermark>) => void;
    onWatermarkImageChange: (file: File) => void;
    onError: (message: string) => void;
}> = ({ settings, titleType, onSettingsChange, onWatermarkSettingsChange, onWatermarkImageChange, onError }) => {
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const watermarkImageInputRef = useRef<HTMLInputElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const watermarkRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const dataUrl = await fileToDataURL(e.target.files[0]);
                if (settings.profileAvatarUrl && settings.profileAvatarUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(settings.profileAvatarUrl);
                }
                onSettingsChange({ profileAvatarUrl: dataUrl });
            } catch (err) {
                console.error("Error processing avatar image:", err);
                onError("No se pudo cargar la imagen de perfil.");
            }
        }
    };

    const handleWatermarkImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onWatermarkImageChange(e.target.files[0]);
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!watermarkRef.current) return;
        isDragging.current = true;
        const rect = watermarkRef.current.getBoundingClientRect();
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        e.preventDefault();
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !imageContainerRef.current) return;
        const containerRect = imageContainerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left - dragOffset.current.x;
        const y = e.clientY - containerRect.top - dragOffset.current.y;
        const xPercent = Math.max(0, Math.min(100, (x / containerRect.width) * 100));
        const yPercent = Math.max(0, Math.min(100, (y / containerRect.height) * 100));
        onWatermarkSettingsChange({ x: xPercent, y: yPercent });
    }, [onWatermarkSettingsChange]);

    const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


    const isTextMode = titleType === 'frase' || titleType === 'tweet';

    return (
        <div className="p-6 bg-gray-800 rounded-xl shadow-lg mb-8 border border-gray-700">
            <h2 className="text-xl font-bold text-indigo-300 mb-4">Controles de Diseño Globales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna de Perfil y Encabezado */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-gray-200">Perfil y Encabezado</h3>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-gray-300">Mostrar Encabezado</span>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={settings.showHeader} onChange={(e) => onSettingsChange({ showHeader: e.target.checked })} />
                            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.showHeader ? 'transform translate-x-6 bg-indigo-400' : ''}`}></div>
                        </div>
                    </label>
                    <div className={`flex items-center gap-4 transition-opacity ${settings.showHeader ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <img src={settings.profileAvatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover cursor-pointer" onClick={() => avatarInputRef.current?.click()} />
                        <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={handleAvatarFileChange} />
                        <div className="flex-1">
                            <input type="text" value={settings.profileName} onChange={(e) => onSettingsChange({ profileName: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" placeholder="Nombre de perfil"/>
                            <input type="text" value={settings.profileHandle} onChange={(e) => onSettingsChange({ profileHandle: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded p-2 mt-2 text-white" placeholder="@usuario"/>
                        </div>
                    </div>
                </div>

                {/* Columna de Marca de Agua */}
                <div className="flex flex-col gap-4">
                     <h3 className="text-lg font-semibold text-gray-200">Marca de Agua</h3>
                     <div ref={imageContainerRef} className="relative w-full h-24 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                        Arrastra la marca aquí
                        {settings.watermark.type !== 'none' && (
                             <div ref={watermarkRef} onMouseDown={handleMouseDown} className="absolute cursor-move" style={{ left: `${settings.watermark.x}%`, top: `${settings.watermark.y}%`, opacity: settings.watermark.opacity, transform: 'translate(-50%, -50%)' }}>
                                {settings.watermark.type === 'text' ? <span className="text-white text-sm whitespace-nowrap" style={{fontSize: `${settings.watermark.size}px`}}>{settings.watermark.text}</span> : <img src={settings.watermark.imageUrl!} style={{maxHeight: `${settings.watermark.size*2}px`}} alt="watermark preview"/>}
                            </div>
                        )}
                    </div>
                    {settings.watermark.type === 'none' ? (
                        <div className="flex gap-2">
                            <button onClick={() => onWatermarkSettingsChange({type: 'text'})} className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Añadir Texto</button>
                            <button onClick={() => watermarkImageInputRef.current?.click()} className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Añadir Imagen</button>
                            <input type="file" accept="image/png, image/jpeg" ref={watermarkImageInputRef} className="hidden" onChange={handleWatermarkImageFileChange} />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {settings.watermark.type === 'text' && ( <input type="text" value={settings.watermark.text} onChange={(e) => onWatermarkSettingsChange({ text: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" /> )}
                            <div className="grid grid-cols-[auto,1fr] items-center gap-x-2 gap-y-3">
                                <label className="text-sm text-gray-400">Tamaño:</label>
                                <input type="range" min="2" max="12" step="0.5" value={settings.watermark.size} onChange={(e) => onWatermarkSettingsChange({ size: parseFloat(e.target.value) })} className="w-full" />
                                <label className="text-sm text-gray-400">Opacidad:</label>
                                <input type="range" min="0.1" max="1" step="0.1" value={settings.watermark.opacity} onChange={(e) => onWatermarkSettingsChange({ opacity: parseFloat(e.target.value) })} className="w-full" />
                            </div>
                            <button onClick={() => onWatermarkSettingsChange({type: 'none'})} className="text-center py-2 bg-red-800 hover:bg-red-700 rounded-lg transition-colors text-sm">Quitar Marca</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [generatedMemes, setGeneratedMemes] = useState<GeneratedMeme[]>([]);
    const [titleType, setTitleType] = useState<'meme' | 'frase' | 'tweet'>('meme');
    const [memeCategory, setMemeCategory] = useState('pareja');
    const [phraseCount, setPhraseCount] = useState(10);
    const [phraseLength, setPhraseLength] = useState<'muy-corto' | 'corto' | 'largo'>('corto');
    const [designSettings, setDesignSettings] = useState<GlobalDesignSettings>({
        showHeader: true,
        profileName: 'Blogfun',
        profileHandle: '@blogfun',
        profileAvatarUrl: DEFAULT_AVATAR_URL,
        textAlign: 'left',
        watermark: {
            type: 'none',
            text: 'Tu Marca de Agua',
            imageUrl: null,
            opacity: 0.7,
            size: 5,
            x: 50,
            y: 85,
        },
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini-api-key');
        if (savedKey) {
            setApiKey(savedKey);
        }
        try {
            const savedSettings = localStorage.getItem(DESIGN_SETTINGS_KEY);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setDesignSettings(prev => ({
                    ...prev,
                    profileName: parsed.profileName || 'Blogfun',
                    profileHandle: parsed.profileHandle || '@blogfun',
                    profileAvatarUrl: parsed.profileAvatarUrl || DEFAULT_AVATAR_URL,
                    showHeader: typeof parsed.showHeader === 'boolean' ? parsed.showHeader : true,
                }));
            }
        } catch (e) {
            console.error("Failed to load design settings:", e);
        }
    }, []);

    useEffect(() => {
        try {
            const settingsToSave = {
                profileName: designSettings.profileName,
                profileHandle: designSettings.profileHandle,
                profileAvatarUrl: designSettings.profileAvatarUrl,
                showHeader: designSettings.showHeader,
            };
            localStorage.setItem(DESIGN_SETTINGS_KEY, JSON.stringify(settingsToSave));
        } catch (e) {
            console.error("Failed to save design settings:", e);
        }
    }, [designSettings.profileName, designSettings.profileHandle, designSettings.profileAvatarUrl, designSettings.showHeader]);


    const handleApiKeyChange = (key: string | null) => {
        if (key) {
            localStorage.setItem('gemini-api-key', key);
            setApiKey(key);
        } else {
            localStorage.removeItem('gemini-api-key');
            setApiKey(null);
        }
    };

    const handleFilesSelected = (files: File[]) => {
        const newImages: UploadedImage[] = files.map(file => ({
            id: `${file.name}-${Date.now()}`,
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setUploadedImages(prev => [...prev, ...newImages]);
        setGeneratedMemes([]);
        setError(null);
    };

    const handleCategoryChange = (category: string) => {
        if (memeCategory === category || isLoading) return;
        setMemeCategory(category);
    };

    const cleanAllTitles = (titles: Record<string, string>): Record<string, string> => {
        const cleaned: Record<string, string> = {};
        for (const key in titles) {
            cleaned[key] = cleanText(titles[key]);
        }
        return cleaned;
    };

    const handleGenerate = useCallback(async () => {
        if (!apiKey) {
            setError('Por favor, configura tu API Key de Gemini para generar contenido.');
            return;
        }
        if (titleType === 'meme' && uploadedImages.length === 0) return;
        
        setIsLoading(true);
        setError(null);
        setGeneratedMemes([]);

        try {
            if (titleType === 'meme') {
                const memePromises = uploadedImages.map(async (image) => {
                    const titles = await generateTitles(image.file, apiKey, memeCategory);
                    const cleanedTitles = cleanAllTitles(titles);
                    return { id: image.id, imageUrl: image.previewUrl, titles: cleanedTitles, editText: Object.values(cleanedTitles)[0] || '' };
                });
                setGeneratedMemes(await Promise.all(memePromises));
            } else if (titleType === 'frase' || titleType === 'tweet') {
                const results = await generatePhrases(apiKey, phraseCount, phraseLength);
                const cleanedResults = results.map(p => cleanAllTitles(p));
                setGeneratedMemes(cleanedResults.map((p, index) => ({
                    id: `${titleType}-${Date.now()}-${index}`, imageUrl: WHITE_PIXEL, titles: p, editText: Object.values(p)[0] || '',
                })));
            }
        } catch (err) {
            setError('Ocurrió un error durante la generación. Por favor, inténtalo de nuevo.');
            if (err instanceof Error) {
                console.error('An error occurred during generation:', err.message);
            } else {
                console.error('An error occurred during generation:', String(err));
            }
        } finally {
            setIsLoading(false);
        }
    }, [uploadedImages, titleType, apiKey, memeCategory, phraseCount, phraseLength]);
    
    const handleMemeTextChange = (memeId: string, newText: string) => {
         setGeneratedMemes(prevMemes =>
            prevMemes.map(meme =>
                meme.id === memeId ? { ...meme, editText: newText } : meme
            )
        );
    };
    
    const handleWatermarkImageChange = (file: File) => {
        const newImageUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
             handleWatermarkSettingsChange({
                type: 'image',
                imageUrl: newImageUrl,
                imageWidth: img.width,
                imageHeight: img.height,
             });
        };
        img.src = newImageUrl;
    };
    
    const handleDesignSettingsChange = (updates: Partial<GlobalDesignSettings>) => {
        setDesignSettings(prev => ({ ...prev, ...updates }));
    };

    const handleWatermarkSettingsChange = (updates: Partial<Watermark>) => {
        if (updates.type === 'none' && designSettings.watermark.imageUrl) {
            URL.revokeObjectURL(designSettings.watermark.imageUrl);
            updates.imageUrl = null;
        }
        setDesignSettings(prev => ({
            ...prev,
            watermark: { ...prev.watermark, ...updates },
        }));
    };

    const handleDownloadMeme = async (meme: GeneratedMeme) => {
        if (!meme.editText) {
            setError("El texto no puede estar vacío.");
            return;
        }
        try {
            const creationData: MemeCreationData = {
                mainImageUrl: meme.imageUrl,
                text: meme.editText,
                design: designSettings,
            };

            let dataUrl: string;
            if (titleType === 'frase') {
                dataUrl = await createPhraseImage(creationData);
            } else if (titleType === 'tweet') {
                dataUrl = await createTweetImage(creationData);
            } else {
                dataUrl = await createMemeImage(creationData);
            }

            const link = document.createElement('a');
            const safeText = meme.editText.replace(/[^a-z0-9]/gi, '_').slice(0, 20);
            link.download = `${titleType}_${safeText}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (downloadError) {
            console.error("Failed to create and download image:", downloadError);
            setError("No se pudo crear la imagen para descargar.");
        }
    };

    const handleReset = () => {
        uploadedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        if (designSettings.watermark.imageUrl) URL.revokeObjectURL(designSettings.watermark.imageUrl);
        
        setUploadedImages([]);
        setGeneratedMemes([]);
        setError(null);
        setIsLoading(false);
        setMemeCategory('pareja');
        setPhraseCount(10);
        setPhraseLength('corto');
        
        // Only reset watermark, keep profile settings
        handleWatermarkSettingsChange({ type: 'none', text: 'Tu Marca de Agua', imageUrl: null, opacity: 0.7, size: 5, x: 50, y: 85 });
    };

    const handleTitleTypeChange = (type: 'meme' | 'frase' | 'tweet') => {
        if (titleType === type || isLoading) return;
        handleReset();
        setTitleType(type);
        if (type === 'tweet') {
            setDesignSettings(prev => ({ ...prev, textAlign: 'left' }));
        } else if (type === 'frase') {
            setDesignSettings(prev => ({ ...prev, textAlign: 'center' }));
        } else {
             setDesignSettings(prev => ({ ...prev, textAlign: 'left' }));
        }
    }
    
    const hasImages = uploadedImages.length > 0;
    const hasMemes = generatedMemes.length > 0;

    const currentView = useMemo(() => {
        if (isLoading) return 'loading';
        if (hasMemes) return 'results';
        if (titleType === 'meme' && hasImages) return 'preview';
        return 'upload';
    }, [isLoading, hasMemes, hasImages, titleType]);
    
    const showCategorySelector = titleType === 'meme' && (currentView === 'upload' || currentView === 'preview');
    const isTextGenerationMode = titleType === 'frase' || titleType === 'tweet';

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto max-w-7xl pb-24">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 pb-2">
                        Generador de Contenido Viral
                    </h1>
                    <p className="text-lg text-gray-400 mt-2 max-w-3xl mx-auto">
                        Crea memes o frases para tus redes sociales con un solo clic.
                    </p>
                </header>

                <main>
                    <ApiKeyManager apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
                    
                    <div className="flex justify-center mb-8">
                        <div className="bg-gray-800 p-1.5 rounded-xl flex gap-2 border border-gray-700">
                            <button onClick={() => handleTitleTypeChange('meme')} className={`px-5 py-2 text-base font-semibold rounded-lg transition-colors ${titleType === 'meme' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}>😂 Modo Meme</button>
                            <button onClick={() => handleTitleTypeChange('frase')} className={`px-5 py-2 text-base font-semibold rounded-lg transition-colors ${titleType === 'frase' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}>✍️ Modo Frase</button>
                            <button onClick={() => handleTitleTypeChange('tweet')} className={`px-5 py-2 text-base font-semibold rounded-lg transition-colors ${titleType === 'tweet' ? 'bg-sky-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}>🐦 Modo Tweet</button>
                        </div>
                    </div>

                    {isTextGenerationMode && currentView === 'upload' && (
                        <div className="flex flex-col items-center justify-center gap-6 mb-8">
                            <div className="flex items-center gap-3">
                                <label htmlFor="phrase-count-input" className="text-gray-300">Número de {titleType === 'tweet' ? 'tweets' : 'frases'}:</label>
                                <input
                                    type="number" id="phrase-count-input" value={phraseCount}
                                    onChange={(e) => {
                                        let count = parseInt(e.target.value, 10);
                                        if (isNaN(count) || count < 1) count = 1; if (count > 20) count = 20;
                                        setPhraseCount(count);
                                    }}
                                    min="1" max="20" className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-20 text-center" disabled={isLoading}
                                />
                            </div>
                            {titleType === 'frase' && <div className="flex flex-col items-center gap-3">
                                <label className="text-gray-300">Largo de los textos:</label>
                                <div className="flex gap-2 rounded-lg bg-gray-900 p-1">
                                    {[
                                        { id: 'muy-corto', label: 'Muy Corto' }, { id: 'corto', label: 'Corto' }, { id: 'largo', label: 'Largo' },
                                    ].map(opt => (
                                        <button key={opt.id} onClick={() => setPhraseLength(opt.id as any)} disabled={isLoading}
                                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${phraseLength === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>}
                        </div>
                    )}
                    
                    {showCategorySelector && (
                        <MemeCategorySelector 
                            selectedCategory={memeCategory}
                            onCategoryChange={handleCategoryChange}
                            disabled={isLoading}
                        />
                    )}

                    {titleType === 'meme' && currentView === 'upload' && <ImageUploader onFilesSelected={handleFilesSelected} disabled={isLoading} />}
                    
                    {error && (
                        <div className="my-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg text-center">
                            {error}
                        </div>
                    )}
                    
                    {currentView === 'loading' && <div className="flex justify-center py-16"><LoadingSpinner text={titleType === 'meme' ? 'Analizando imágenes...' : `Generando ${titleType}s...`} /></div>}
                    
                    {currentView === 'preview' && (
                         <div className="flex flex-col items-center">
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                                {uploadedImages.map(image => (
                                    <div key={image.id} className="aspect-square rounded-lg overflow-hidden ring-2 ring-gray-700">
                                        <img src={image.previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}

                    {currentView === 'results' && (
                        <>
                        <GlobalDesignControls 
                            settings={designSettings}
                            titleType={titleType}
                            onSettingsChange={handleDesignSettingsChange}
                            onWatermarkSettingsChange={handleWatermarkSettingsChange}
                            onWatermarkImageChange={handleWatermarkImageChange}
                            onError={setError}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
                            {generatedMemes.map(meme => (
                                <MemeEditorCard
                                    key={meme.id}
                                    meme={meme}
                                    designSettings={designSettings}
                                    onMemeTextChange={handleMemeTextChange}
                                    onDownload={handleDownloadMeme}
                                    titleType={titleType}
                                />
                            ))}
                        </div>
                        </>
                    )}
                </main>

                <footer className="fixed bottom-0 left-0 w-full bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700">
                    <div className="container mx-auto max-w-7xl flex justify-center items-center gap-4">
                        {(hasImages || hasMemes) && (
                             <button onClick={handleReset} className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                                Empezar de Nuevo
                            </button>
                        )}
                       {(currentView === 'preview' || (isTextGenerationMode && currentView === 'upload')) && (
                            <button onClick={handleGenerate} className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || (titleType === 'meme' && !hasImages)}>
                                {titleType === 'meme' ? 'Generar Títulos' : `Generar ${titleType === 'tweet' ? 'Tweets' : 'Frases'}`}
                            </button>
                       )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default App;
