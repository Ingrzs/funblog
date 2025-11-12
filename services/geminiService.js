

import { GoogleGenAI } from "@google/genai";

const fileToBase64 = (file) => {
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

const PROMPT_PAREJA = `
Analiza la imagen y genera 3 frases tipo meme virales que encajen visualmente con ella.
El tono debe ser sarcástico, irónico, emocional o con doble sentido sobre relaciones de pareja, celos, infidelidad, deseo, o indirectas románticas.
Las frases deben sonar naturales, como si una mujer hablara en tono de chisme o reflexión con sarcasmo.
Evita palabras explícitas; usa sustituciones o censura creativa (ejemplo: “puchaina”, “f30”, “bby”, “solté la pantufla”).
Cada frase debe tener entre 1 y 2 líneas, ser clara, entendible y visualmente fuerte.

Ejemplo de estilo:
- Yo: viendo como mi ex jura que ya cambió y sigue con la misma.
- Yo: después de besarme la puchaina y decir que no siente nada.
- Yo: pensando que era el amor de mi vida y solo era mi trauma favorito.

Dame 3 versiones diferentes del texto, cada una con un tono distinto, siguiendo este formato EXACTO:
😏 Sarcasmo: [Texto aquí]
😭 Drama: [Texto aquí]
🤫 Indirecta: [Texto aquí]
`;

const PROMPT_FAMILIA = `
Analiza la imagen y crea 3 frases tipo meme o reflexión corta con tono emocional, sarcástico o nostálgico sobre familia, madres, hijos, hermanos o momentos de la vida adulta.
Las frases deben conectar con emociones reales, con toques de humor o ternura, como si hablara una persona con empatía o cansancio de la vida diaria.
Usa un lenguaje cotidiano, realista y cálido, pero con ese toque irónico que genera identificación.

Ejemplo de estilo:
- Tener una mamá que aún te cuide aunque ya seas adulta, eso no tiene precio.
- Yo: diciendo que no voy a volver, mientras mi mamá ya me tiene la sopa servida.
- A veces solo quiero regresar a la cocina de mi abuela y no salir nunca más.

Dame 3 versiones diferentes del texto, cada una con un tono distinto, siguiendo este formato EXACTO:
😌 Nostalgia: [Texto aquí]
😅 Humor: [Texto aquí]
❤️ Ternura: [Texto aquí]
`;

const PROMPT_TRABAJO = `
Analiza la imagen y crea 3 frases tipo meme con humor, sarcasmo o ironía sobre trabajo, escuela, responsabilidades o la vida adulta en general.
Deben sonar como pensamientos internos o quejas graciosas que la gente comparta porque se identifica.
Puedes usar expresiones coloquiales o exageradas, pero evita groserías directas.

Ejemplo de estilo:
- Yo: sobreviviendo otro día laboral sin llorar (por fuera).
- A veces solo quiero renunciar... pero no tengo ni para renunciar.
- Me metí a este trabajo por voluntad propia, y ahora no sé qué voluntad fue esa.

Dame 3 versiones diferentes del texto, cada una con un tono distinto, siguiendo este formato EXACTO:
😤 Sarcasmo: [Texto aquí]
😫 Estrés: [Texto aquí]
😂 Humor: [Texto aquí]
`;

const getMemePrompt = (category) => {
    switch (category) {
        case 'pareja': return PROMPT_PAREJA;
        case 'familia': return PROMPT_FAMILIA;
        case 'trabajo': return PROMPT_TRABAJO;
        default: return PROMPT_PAREJA;
    }
}

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


const parseMemeTitles = (text) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const titles = {};

  lines.forEach(line => {
      // Pareja
      if (line.startsWith('😏 Sarcasmo:')) { titles.sarcasmo = line.replace('😏 Sarcasmo:', '').trim(); }
      else if (line.startsWith('😭 Drama:')) { titles.drama = line.replace('😭 Drama:', '').trim(); }
      else if (line.startsWith('🤫 Indirecta:')) { titles.indirecta = line.replace('🤫 Indirecta:', '').trim(); }
      // Familia
      else if (line.startsWith('😌 Nostalgia:')) { titles.nostalgia = line.replace('😌 Nostalgia:', '').trim(); }
      else if (line.startsWith('😅 Humor:')) { titles.humor = line.replace('😅 Humor:', '').trim(); }
      else if (line.startsWith('❤️ Ternura:')) { titles.ternura = line.replace('❤️ Ternura:', '').trim(); }
      // Trabajo
      else if (line.startsWith('😤 Sarcasmo:')) { titles.sarcasmoTrabajo = line.replace('😤 Sarcasmo:', '').trim(); }
      else if (line.startsWith('😫 Estrés:')) { titles.estres = line.replace('😫 Estrés:', '').trim(); }
      else if (line.startsWith('😂 Humor:')) { titles.humorTrabajo = line.replace('😂 Humor:', '').trim(); }
  });

  return titles;
}

const parsePhrases = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const phrases = [];

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

export const generateTitles = async (imageFile, apiKey, category) => {
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
        throw new Error("La respuesta de la IA no tuvo el formato esperado.");
    }
    return parsed;

  } catch (error) {
    console.error("Error generating titles:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('La API Key no es válida. Por favor, verifica e introdúcela de nuevo.');
    }
    throw new Error('Error al generar los títulos desde la IA.');
  }
};

export const generatePhrases = async (apiKey) => {
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
        throw new Error('No se pudieron generar las frases. Intenta de nuevo.');
    }
};
