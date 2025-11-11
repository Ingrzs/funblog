
import { GoogleGenAI } from "@google/genai";

// Fix: Add types for the file argument and the Promise return value
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const PROMPT_MEME = `
Analiza la imagen que te envío y crea un texto tipo meme con doble sentido, relacionado con pareja, noviazgo o situaciones de amor y sarcasmo.

El texto debe:
- Comenzar con “Yo:”
- Tener una sola línea, estilo meme viral.
- Basarse en la expresión o el gesto de la persona en la imagen.
- Reflejar humor, ironía, picardía o drama cotidiano (por ejemplo: celos, deseo, infidelidad, discusiones, rutinas de pareja, orgullo, arrepentimiento, etc.).
- Usar lenguaje coloquial y mexicano, con censura leve o ingeniosa para palabras atrevidas (puch4ina, pantunfla, m4rido, f3liz, 3x, etc.).
- Mantener el tono tipo páginas virales como Blog Fun, Zeneida o Jarhat Pacheco (mezcla de humor, doble sentido y emociones).

Ejemplos del tono que quiero:
- Yo: pensando que a la primera cita solté la pantunfla.
- Yo: viendo cómo mi m4rido se queja de mí y sin mí no puede vivir.
- Yo: sin quejarme cuando me detonan.
- Yo: viendo como mi cuñada le llora a mi hermano que está todo f3o.
- Yo: viendo con ojos de amor a mi m4rido después de besarme la puch4ina.
- Yo: después de ver una foto donde estaba joven y bonita.

Dame 3 versiones diferentes del texto, cada una con un tono distinto, siguiendo este formato EXACTO:
💋 Pícara: [Texto aquí]
😏 Sarcástica: [Texto aquí]
😭 Dramática: [Texto aquí]
`;

const getPhrasePrompt = () => `
Crea 10 frases variadas, inspiradas en el estilo de Blog Fun, Zeneida o Jarhat Pacheco, usando lenguaje informal y expresivo.

Tono y Temas:
- Amor, desamor y relaciones.
- Chisme, morbo e indirectas.
- Humor cotidiano (trabajo, escuela, vida adulta).
- Reflexión o autoengaño irónico.
- Sarcasmo o drama ligero.

Instrucciones:
- Las frases deben ser cortas, directas y auténticas, no cursis ni poéticas.
- Puedes censurar levemente palabras (ej: p4reja, m4rido, f3liz).
- Usa los siguientes emojis para clasificar cada frase. Puedes repetir categorías.
- IMPORTANTE: Varía las frases en cada nueva generación. No repitas ideas o estructuras de forma idéntica.

Ejemplos de estilo:
“Yo no ando buscando amor, ando buscando quien no me quite la paz.”
“No me da coraje que tenga novia, me da coraje que no sea mejor que yo.”
“Yo también decía: ‘ya no vuelvo’, y aquí ando, haciendo fila otra vez.”
“A veces mi trabajo no me estresa, me da ganas de llorar por deporte.”
“Mi problema no es el amor, es que me gustan los proyectos incompletos.”
“Yo no soy chismosa, solo tengo buena memoria y me gusta confirmar.”
“Se me pasó el enojo, pero no el apunte mental que hice.”
“Si me vas a mentir, mínimo que valga la pena el drama.”
“Hay ex que deberían pagar renta por vivir en mi mente.”
“A veces quiero paz, pero también quiero saber con quién anda.”

Formato de Salida EXACTO (10 frases en total, puedes mezclar y repetir las categorías):
💔: [Texto de la frase aquí]
😏: [Texto de la frase aquí]
😅: [Texto de la frase aquí]
😌: [Texto de la frase aquí]
😤: [Texto de la frase aquí]
... y así hasta completar 10 frases.

Para asegurar la aleatoriedad, usa este número como inspiración: ${Math.random()}.
`;


const parseMemeTitles = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  // Fix: Add type annotation for the 'titles' object
  const titles: Record<string, string> = {};

  lines.forEach(line => {
    if (line.startsWith('💋 Pícara:')) {
      titles.picara = line.replace('💋 Pícara:', '').trim();
    } else if (line.startsWith('😏 Sarcástica:')) {
      titles.sarcastica = line.replace('😏 Sarcástica:', '').trim();
    } else if (line.startsWith('😭 Dramática:')) {
      titles.dramatica = line.replace('😭 Dramática:', '').trim();
    }
  });

  return titles;
}

const parsePhrases = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const phrases: Record<string, string>[] = [];

    lines.forEach(line => {
        if (line.startsWith('💔:')) {
            phrases.push({ relaciones: line.replace('💔:', '').trim() });
        } else if (line.startsWith('😏:')) {
            phrases.push({ chisme: line.replace('😏:', '').trim() });
        } else if (line.startsWith('😅:')) {
            phrases.push({ humor: line.replace('😅:', '').trim() });
        } else if (line.startsWith('😌:')) {
            phrases.push({ reflexion: line.replace('😌:', '').trim() });
        } else if (line.startsWith('😤:')) {
            phrases.push({ sarcasmo: line.replace('😤:', '').trim() });
        }
    });

    return phrases;
}


// Fix: Add types for function arguments and the Promise return value
export const generateTitles = async (imageFile: File, apiKey: string): Promise<Record<string, string>> => {
  const ai = new GoogleGenAI({ apiKey });

  try {
    const base64Data = await fileToBase64(imageFile);
    
    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: base64Data,
      },
    };

    const textPart = {
      text: PROMPT_MEME,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [imagePart, textPart] }],
    });
    
    const parsed = parseMemeTitles(response.text);
    if (Object.keys(parsed).length === 0) {
        throw new Error("La respuesta de la IA no tuvo el formato esperado.");
    }
    return parsed;

  } catch (error) {
    console.error("Error generating titles:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('La API Key no es válida. Por favor, verifica e introdúcela de nuevo.');
    }
    return {
        picara: "Error al generar.",
        sarcastica: "Error al generar.",
        dramatica: "Error al generar."
    };
  }
};

// Fix: Add types for function arguments and the Promise return value
export const generatePhrases = async (apiKey: string): Promise<Record<string, string>[]> => {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: getPhrasePrompt(),
        });

        const parsed = parsePhrases(response.text);
        if (parsed.length === 0) {
            throw new Error("La respuesta de la IA no tuvo el formato esperado para las frases.");
        }
        return parsed;

    } catch (error) {
        console.error("Error generating phrases:", error);
         if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('La API Key no es válida. Por favor, verifica e introdúcela de nuevo.');
        }
        return [{ error: "No se pudieron generar las frases. Intenta de nuevo." }];
    }
};
