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

const getMemePrompt = (category: string) => {
    const categoryPrompts = {
        pareja: `
CATEGORÍA: PAREJA / NOVIAZGO / INFIDELIDAD
ENTREGA 3 TEXTOS, UNO POR CADA TONO:
A) Pícara / morbosa (doble sentido leve, censura creativa).
B) Sarcástica / indirecta / chisme.
C) Dramática / emocional / tóxica.

FORMATO DE SALIDA (usa estas claves exactas):
sarcasmo: [Texto aquí]
drama: [Texto aquí]
indirecta: [Texto aquí]
        `,
        familia: `
CATEGORÍA: FAMILIA
ENTREGA 3 TEXTOS, UNO POR CADA TONO:
A) Humor picoso suave / doble sentido familiar.
B) Sarcasmo familiar / problemas típicos / indirectas.
C) Empático / nostálgico / emocional (sin cursilería extrema).

FORMATO DE SALIDA (usa estas claves exactas):
nostalgia: [Texto aquí]
humor: [Texto aquí]
ternura: [Texto aquí]
        `,
        trabajo: `
CATEGORÍA: TRABAJO / ESCUELA / VIDA ADULTA
ENTREGA 3 TEXTOS, UNO POR CADA TONO:
A) Pícara laboral o doble sentido “de oficina”.
B) Sarcástica / estrés laboral / queja irónica.
C) Dramática / cansancio / vida adulta difícil.

FORMATO DE SALIDA (usa estas claves exactas):
sarcasmoTrabajo: [Texto aquí]
estres: [Texto aquí]
humorTrabajo: [Texto aquí]
        `
    };

    const selectedCategoryPrompt = categoryPrompts[category] || categoryPrompts['pareja'];

    return `
Quiero que analices la imagen de forma profunda antes de generar textos. 
Sigue este proceso de interpretación:

1. ANALIZA EMOCIONES:
   - Expresión facial: enojo, tristeza, picardía, sorpresa, sospecha.
   - Mirada: hacia dónde ve, qué transmite.
   - Postura corporal: tensión, altanería, inseguridad, coquetería.
   - Energía general de la escena: dramática, cómica, incómoda, sensual, cotidiana.

2. ANALIZA CONTEXTO VISUAL:
   - Escenario: casa, oficina, calle, cuarto, exterior.
   - Elementos en manos u objetos visibles (celular, comida, espejo, cama).
   - Iluminación: realista, triste, romántica, dramática.
   - Posibles implicaciones (lo que *parece* que está pasando).

3. INTERPRETACIÓN VIRAL:
   - Identifica la “puerta” al morbo, al chisme, al sarcasmo o al drama.
   - Piensa qué historia insinuaría esta imagen en una conversación de amigas.
   - Extrae el punto que podría generar comentarios y debate.
   - Si la imagen da para doble sentido, úsalo (censurado).
   - Si da para sospecha, celos, infidelidad, indirectas, úsalo.

Después de este análisis, genera 3 textos virales estilo Blog Fun para la siguiente categoría.
Cada texto debe ser de 1–2 líneas máximo. 
Los textos NO describen la imagen; la transforman en un meme potente.

${selectedCategoryPrompt}

REQUISITOS:
- Mantén tono femenino mexicano un 80% un 20% tono masculino mexicano, irónico, sarcastico y con humor ácido.
- Censura palabras fuertes así: p4rte, puch4ina, tóxic0, od10,4rm4 etc.
- Cada texto debe sentirse como un meme que genera debate, risa o morbo.
- No describas la imagen: interpreta lo que *emocionalmente está insinuando*.
- No des explicaciones; solo dame los textos finales.
    `;
}

const getPhrasePrompt = (count: number, length: 'muy-corto' | 'corto' | 'largo') => {
    const lengthInstructions = {
        'muy-corto': 'Cada frase debe tener 1 línea de texto, corta y directa como un tweet.',
        'corto': 'Cada frase debe tener entre 1 y 2 líneas de texto, perfectas para un post.',
        'largo': 'Cada frase debe tener entre 3 y 4 líneas, como una reflexión breve pero contundente.',
    };

    const instruction = lengthInstructions[length] || 'Las frases deben ser cortas y directas.';

    return `
**Tu Rol:** Eres un creador de contenido viral experto en redes sociales, especializado en frases que conectan emocionalmente con un público femenino joven y adulto. Tu estilo es como el de 'Blog Fun', 'Zeneida' o 'Jarhat Pacheco': directo, ingenioso, a veces sarcástico y siempre auténtico.

**Misión:** Genera ${count} frases originales y variadas que provoquen una reacción inmediata (risa, identificación, "¡totalmente!").

**Reglas de Oro:**
1.  **Longitud:** ${instruction}
2.  **Tono y Temas:**
    *   **Relaciones:** Amor, desamor, celos, casi algo, ex, expectativas vs. realidad.
    *   **Sarcasmo y Humor:** Situaciones cotidianas de la vida adulta (trabajo, dinero, cansancio) con un toque irónico.
    *   **Indirectas y "Chisme":** Frases que se sientan como un secreto contado entre amigas.
    *   **Reflexiones Irónicas:** Pensamientos sobre la vida, pero sin ser un cliché de superación personal. Más bien, un autoengaño divertido.
3.  **Estilo de Escritura:**
    *   **Autenticidad:** Usa un lenguaje coloquial, como si hablaras con una amiga. Evita ser formal o poético.
    *   **Censura Creativa:** Utiliza jerga de internet y censura sutil para palabras fuertes (ej: "puchaina", "f3liz", "m4l", "la queso", "bby").
    *   **CERO CLICHÉS:** Prohibido usar frases cursis, motivacionales baratas o ideas muy repetidas. Busca siempre un giro inesperado.
    *   **VARIEDAD ABSOLUTA:** Es CRÍTICO que no repitas estructuras (ej: no empezar todas las frases con "Yo cuando..." o "A veces..."). Cada frase debe ser única en su construcción.

**Ejemplos de Calidad (Inspírate, no copies):**
*   “Mi problema no es que me mientas, es que te creo.”
*   “Yo también tuve un ‘quédate, no importa que me hagas pedazos’.”
*   “A veces quisiera ser millonaria para ver si mis problemas de verdad son por dinero.”
*   “Me anda buscando el SAT y también el que juró que no podía vivir sin mí.”
*   “No me quemé, pero qué bien alumbré.”
*   “Te perdono el casi algo, pero devélveme mis ganas de volver a intentar.”
*   “Mi contacto de emergencia es mi mamá para que le diga a mi jefe que no voy a ir a trabajar.”

**Formato de Salida Obligatorio:**
Genera EXACTAMENTE ${count} frases. Clasifica cada una con UNO de los siguientes emojis. Puedes repetir emojis.
💔: [Texto de la frase sobre relaciones o desamor]
😏: [Texto de la frase con chisme, indirecta o sarcasmo de relaciones]
😅: [Texto de la frase con humor sobre la vida cotidiana]
😌: [Texto de la frase con una reflexión irónica o nostálgica]
😤: [Texto de la frase con sarcasmo general, estrés o queja graciosa]
... y así hasta completar las ${count} frases.

Para asegurar la aleatoriedad, usa este número como semilla: ${Math.random()}.
`;
};

const parseMemeTitles = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const titles: Record<string, string> = {};

  lines.forEach(line => {
      // Pareja
      if (line.startsWith('sarcasmo:')) { titles.sarcasmo = line.replace('sarcasmo:', '').trim(); }
      else if (line.startsWith('drama:')) { titles.drama = line.replace('drama:', '').trim(); }
      else if (line.startsWith('indirecta:')) { titles.indirecta = line.replace('indirecta:', '').trim(); }
      // Familia
      else if (line.startsWith('nostalgia:')) { titles.nostalgia = line.replace('nostalgia:', '').trim(); }
      else if (line.startsWith('humor:')) { titles.humor = line.replace('humor:', '').trim(); }
      else if (line.startsWith('ternura:')) { titles.ternura = line.replace('ternura:', '').trim(); }
      // Trabajo
      else if (line.startsWith('sarcasmoTrabajo:')) { titles.sarcasmoTrabajo = line.replace('sarcasmoTrabajo:', '').trim(); }
      else if (line.startsWith('estres:')) { titles.estres = line.replace('estres:', '').trim(); }
      else if (line.startsWith('humorTrabajo:')) { titles.humorTrabajo = line.replace('humorTrabajo:', '').trim(); }
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
            phrases.push({ sarcasmoFrase: line.replace('😤:', '').trim() });
        }
    });

    return phrases;
}

export const generateTitles = async (imageFile: File, apiKey: string, category: string): Promise<Record<string, string>> => {
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
      text: getMemePrompt(category),
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [imagePart, textPart] }],
    });
    
    const parsed = parseMemeTitles(response.text);
    if (Object.keys(parsed).length === 0) {
        // A veces la IA puede responder con el formato `A) ...`, lo intentamos parsear
        const lines = response.text.split('\n');
        const fallbackTitles: Record<string, string[]> = {
            pareja: ['sarcasmo', 'drama', 'indirecta'],
            familia: ['nostalgia', 'humor', 'ternura'],
            trabajo: ['sarcasmoTrabajo', 'estres', 'humorTrabajo'],
        };
        const keys = fallbackTitles[category] || fallbackTitles.pareja;
        const texts = lines.map(l => l.replace(/^[A-C]\)\s*/, '').trim()).filter(Boolean);
        if (texts.length >= keys.length) {
            keys.forEach((key, index) => {
                parsed[key] = texts[index];
            });
        }
    }
    
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
        error: "Error al generar.",
    };
  }
};

// Fix: Add types for function arguments and the Promise return value
export const generatePhrases = async (apiKey: string, count: number, length: 'muy-corto' | 'corto' | 'largo'): Promise<Record<string, string>[]> => {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: getPhrasePrompt(count, length),
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