export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface Watermark {
  type: 'text' | 'image' | 'none';
  text: string;
  imageUrl: string | null;
  opacity: number;
  size: number;
  x: number; // 0 a 100
  y: number; // 0 a 100
  imageWidth?: number;
  imageHeight?: number;
}

export interface GlobalDesignSettings {
  showHeader: boolean;
  watermark: Watermark;
  profileName: string;
  profileHandle: string;
  profileAvatarUrl: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
}


export interface GeneratedMeme {
  id: string;
  imageUrl: string;
  titles: Record<string, string>; // e.g., { picara: '...', sarcastica: '...' }
  editText: string;
}

// Interfaz para los datos que se pasan al servicio de generación de imágenes
export interface MemeCreationData {
    mainImageUrl?: string; // Hecho opcional para las frases
    text: string;
    // Pasa la configuración de diseño global
    design: GlobalDesignSettings;
}