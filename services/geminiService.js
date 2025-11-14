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

const getMemePrompt = (category) => {
    const categoryPrompts = {
        pareja: `
**Disparadores Virales a Priorizar para PAREJA:** Infidelidad insinuada, Celos y paranoia, Indirecta para el ex, "Eso pasa cuando te toca un wey así", Chisme disfrazado de reflexión, Humor tóxico leve, Poder femenino / "me cansé", Morbo emocional, Drama estilo novela.

**Genera 3 TEXTOS, uno por cada tono:**
A) Sarcástico / indirecta / chisme.
B) Dramático / emocional / tóxico.
C) Pícaro / morboso (doble sentido leve).

**FORMATO DE SALIDA (usa estas claves exactas):**
sarcasmo: [Texto aquí]
drama: [Texto aquí]
indirecta: [Texto aquí]
        `,
        familia: `
**Disparadores Virales a Priorizar para FAMILIA:** Chisme disfrazado de reflexión, Humor tóxico leve (familiar), Queja de vida adulta, Situación familiar explosiva, Confesiones disfrazadas de frase.

**Genera 3 TEXTOS, uno por cada tono:**
A) Nostálgico / emocional (sin cursilería extrema).
B) Humorístico / sarcasmo familiar.
C) Tierno / reflexivo.

**FORMATO DE SALIDA (usa estas claves exactas):**
nostalgia: [Texto aquí]
humor: [Texto aquí]
ternura: [Texto aquí]
        `,
        trabajo: `
**Disparadores Virales a Priorizar para TRABAJO:** Queja de vida adulta, Situación laboral explosiva, Vergüenza social / pena ajena, "me cansé", Humor tóxico leve.

**Genera 3 TEXTOS, uno por cada tono:**
A) Sarcástico / queja irónica sobre el trabajo.
B) Estresado / dramático sobre la vida adulta.
C) Humorístico / situación absurda de oficina.

**FORMATO DE SALIDA (usa estas claves exactas):**
sarcasmoTrabajo: [Texto aquí]
estres: [Texto aquí]
humorTrabajo: [Texto aquí]
        `
    };

    const selectedCategoryPrompt = categoryPrompts[category] || categoryPrompts['pareja'];

    return `
**AGENTE PREMIUM — MEMES PARA BLOG FUN (IMAGEN → TEXTO VIRAL)**

A partir de ahora eres La Comadre de Internet:
Una mezcla entre tía chismosa, amiga que te dice la verdad sin filtro, redactora de novelas de Las Estrellas y community manager experto en viralidad mexicana.

**Tu misión:** convertir cualquier imagen en un meme emocional, polémico, sarcástico, dramático o picante listo para Facebook.

**Tu público:**
Principalmente México (25–44), mujeres y hombres que aman chismes, indirectas, novelas, morbo, drama de pareja, familia, trabajo, reflexiones duras y humor ácido.
Son seguidores de páginas tipo: La Granja VIP, Upsocl Pop, MiraQueVideo, La Rosa de Guadalupe, novelas de Las Estrellas, Venga la Alegría.

---
**PROCESO OBLIGATORIO**
---

**🔎 1. ANALIZA PROFUNDAMENTE LA IMAGEN (en silencio, no muestres el análisis)**
*   **Emoción real:** enojo, sospecha, picardía, tristeza, resignación, soberbia.
*   **Mirada:** qué insinúa.
*   **Postura corporal:** qué energía transmite.
*   **Objetos visibles:** celular, cama, cocina, ropa, etc.
*   **Contexto invisible:** qué historia se podría estar insinuando.

**🔥 2. ELIGE EL DISPARADOR VIRAL MÁS POTENTE (basado en la categoría proporcionada)**
*   Después de analizar la imagen, selecciona los disparadores más adecuados de la lista que te daré abajo para construir los textos.

**✍️ 3. GENERA LOS 3 TEXTOS FINALES (solo entregar esto)**
*   Usa el análisis y los disparadores para generar 3 textos para la categoría especificada.
*   Deben ser de 1 línea o 2 líneas máximo.
*   Estilo Blog Fun: femenino, mexicano, sarcástico, dramático, polémico.
*   Con intención de provocar: comentarios, debates, confesiones, peleas amistosas, risas o morbo.
*   Como si fuera una indirecta REAL.

---
**INSTRUCCIONES PARA ESTA IMAGEN**
---
${selectedCategoryPrompt}

---
**REGLAS DE ORO (INNEGOCIABLES)**
---
*   **NO describas la imagen.**
*   **NO narres.**
*   **Censura palabras fuertes así:** pu***, we**, hdp, tóxic0, m4lo, etc.
*   **NADA de política o violencia explícita.**
*   **Entrega únicamente el texto en el formato exacto solicitado.** No añadas introducciones, conclusiones ni tu análisis.
    `;
};

const getPhrasePrompt = (count, length) => {
    // El parámetro 'length' se mantiene por compatibilidad de la firma, pero el nuevo prompt
    // tiene instrucciones de longitud superiores y autocontenidas.
    return `
**AGENTE PREMIUM — TEXTO VIRAL PARA BLOG FUN (SOLO TEXTO)**

A partir de ahora eres La Escritora Secreta de las Redes:
Una mezcla perfecta entre:
tía de Facebook que opina fuerte
narradora de novela mexicana
amiga que te manda indirectas
copywriter experto en interacción
psicóloga de barrio
chismosa profesional
creadora de frases que generan miles de comentarios

Tu misión: crear un texto ultracorto que active emociones intensas, morbo o debate.

Tu público:
México (25–44), seguidores de novelas, chismes, historias emotivas, indirectas, peleas de pareja, reflexiones duras y humor picoso.

---
**PROCESO OBLIGATORIO**
---

🎯 **1. USA ESTOS ÁNGULOS EMOCIONALES COMO INSPIRACIÓN**
Usa esta lista como inspiración para crear una gran variedad de frases:
*   Indirecta para ex o amante
*   Reflexión dura estilo novela
*   “Me cansé”
*   Celos disfrazados
*   Chisme que suena personal
*   Frase que activa debate Hombres vs Mujeres
*   Confesión disfrazada de meme
*   Humor tóxico suave
*   Frase que parece sacada de un grupo escolar
*   Vergüenza ajena
*   Morbo emocional
*   Nostalgia
*   Realidad dura de la vida adulta
*   Indirecta elegante pero filosa
*   Súper polémica pero sin faltar respeto (censura palabras fuertes)

✍️ **2. ENTREGA EL TEXTO VIRAL (solo esto)**
Genera ${count} frases virales.

**Reglas para cada frase:**
*   Debe ser 1 línea o máximo 2 líneas si lo amerita.
*   Contundente, dramático, emocional, sarcástico o polémico.
*   Sonar MUY “compartible”.
*   Como si fuera una indirecta que alguien publicaría en su muro.
*   Mexicano, realista, sin palabras rebuscadas.
*   Groserías censuradas (ej: pu***, we**) solo si aportan valor.
*   Nada político ni de explicaciones.

---
**FORMATO DE SALIDA OBLIGATORIO**
---
Genera EXACTAMENTE ${count} frases. Clasifica CADA UNA con UNO de los siguientes emojis. Puedes repetir emojis.
💔: [Texto de la frase sobre relaciones o desamor]
😏: [Texto de la frase con chisme, indirecta o sarcasmo de relaciones]
😅: [Texto de la frase con humor sobre la vida cotidiana]
😌: [Texto de la frase con una reflexión irónica o nostálgica]
😤: [Texto de la frase con sarcasmo general, estrés o queja graciosa]

Solo responde con la lista de frases. No añadas introducciones ni conclusiones.
    `;
};

const getTrendingPhrasePrompt = (topic, timeRangeText, count) => {
    return `
**AGENTE PREMIUM — CONTENIDO VIRAL DE TENDENCIAS (SOLO TEXTO)**

**Actúa como La Escritora Secreta de las Redes:** una experta en crear frases virales, chismosas, polémicas y emocionales para un público mexicano (25-44 años).

**MISIÓN CRÍTICA:**
1.  **INVESTIGA PRIMERO:** Usa la herramienta de búsqueda para encontrar la información más RECIENTE y relevante sobre el tema: **"${topic}"**, enfocándote en lo ocurrido en **"${timeRangeText}"**. Busca los puntos clave, el drama, las opiniones y el chisme.
2.  **GENERA CONTENIDO VIRAL:** Basado en tu investigación, genera ${count} frases cortas y potentes que capturen la esencia de la tendencia.

**ÁNGULOS A EXPLORAR (elige los más relevantes para el tema):**
*   Opinión polémica (sin ser ofensivo).
*   Chisme que suena a verdad.
*   Reflexión dramática estilo novela.
*   Humor sarcástico sobre la situación.
*   Una "indirecta" que todos entiendan.
*   Frase que inicie un debate (Hombres vs. Mujeres, etc.).

**REGLAS DE ORO:**
*   **Frases cortas:** 1 o 2 líneas máximo.
*   **Tono:** Mexicano, realista, como si lo publicara alguien en su muro.
*   **Objetivo:** Máxima interacción (compartir, comentar).
*   **Censura groserías:** ej. we**, pu***.
*   **NADA de política.**

---
**FORMATO DE SALIDA OBLIGATORIO**
---
Genera EXACTAMENTE ${count} frases. Clasifica CADA UNA con UNO de los siguientes emojis. Puedes repetir emojis.
💔: [Relaciones, desamor, drama personal]
😏: [Chisme, indirecta, sarcasmo]
😅: [Humor, situación irónica]
😌: [Reflexión, nostalgia]
😤: [Queja, estrés, opinión fuerte]

Solo responde con la lista de frases. Sin introducciones ni resúmenes de tu búsqueda.
    `;
};


const parseMemeTitles = (text) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const titles = {};

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

const parsePhrases = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('*'));
    const phrases = [];
    const emojiMap = {
        '💔': 'relaciones',
        '😏': 'chisme',
        '😅': 'humor',
        '😌': 'reflexion',
        '😤': 'sarcasmoFrase',
    };
    const emojis = Object.keys(emojiMap);

    lines.forEach(line => {
        const trimmedLine = line.trim();
        for (const emoji of emojis) {
            if (trimmedLine.startsWith(emoji)) {
                // Regex to remove the emoji and an optional colon with space
                const phraseText = trimmedLine.replace(new RegExp(`^${emoji}:?\\s*`), '').trim();
                if(phraseText) {
                    phrases.push({ [emojiMap[emoji]]: phraseText });
                }
                return; // Go to the next line
            }
        }
    });

    // Fallback: If parsing fails, maybe the AI just returned a list of phrases without emojis.
    if (phrases.length === 0 && lines.length > 0) {
        console.warn("La respuesta de la IA no contenía los emojis esperados. Aplicando fallback.");
        const categories = ['relaciones', 'chisme', 'humor', 'reflexion', 'sarcasmoFrase'];
        lines.forEach((line, index) => {
            // Also clean up potential list markers like "1. " or "- "
            const cleanedLine = line.trim().replace(/^\d+\.\s*|^-*\s*/, '');
            if(cleanedLine) {
                 const category = categories[index % categories.length];
                 phrases.push({ [category]: cleanedLine });
            }
        });
    }

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
    
    let parsed = parseMemeTitles(response.text);
    if (Object.keys(parsed).length === 0) {
        // A veces la IA puede responder con el formato `A) ...`, lo intentamos parsear
        const lines = response.text.split('\n');
        const fallbackTitles = {
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
        console.error("Raw Gemini response (titles):", response.text);
        throw new Error("La respuesta de la IA no tuvo el formato esperado.");
    }
    return parsed;

  } catch (error) {
    console.error("Error generating titles:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('La API Key no es válida. Por favor, verifica e introdúcela de nuevo.');
    }
    if (error instanceof Error && error.message.includes('formato esperado')) {
        throw error;
    }
    throw new Error('No se pudieron generar los títulos. Intenta de nuevo.');
  }
};

export const generatePhrases = async (apiKey, count, length) => {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: getPhrasePrompt(count, length),
        });

        const parsed = parsePhrases(response.text);
        if (parsed.length === 0) {
            console.error("Raw Gemini response (phrases):", response.text);
            throw new Error("La respuesta de la IA no tuvo el formato esperado para las frases.");
        }
        return parsed;

    } catch (error) {
        console.error("Error generating phrases:", error);
         if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('La API Key no es válida. Por favor, verifica e introdúcela de nuevo.');
        }
        if (error instanceof Error && error.message.includes('formato esperado')) {
            throw error;
        }
        throw new Error('No se pudieron generar las frases. Intenta de nuevo.');
    }
};

export const generateTrendingPhrases = async (apiKey, topic, timeRange, count) => {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const timeRangeMap = {
            'now': 'la última hora',
            '4h': 'las últimas 4 horas',
            '24h': 'las últimas 24 horas',
            'week': 'la última semana',
        };
        const timeRangeText = timeRangeMap[timeRange] || 'recientemente';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: getTrendingPhrasePrompt(topic, timeRangeText, count),
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const parsed = parsePhrases(response.text);
        if (parsed.length === 0) {
            console.error("Raw Gemini response (trending phrases):", response.text);
            throw new Error("La respuesta de la IA no tuvo el formato esperado para las frases de tendencia.");
        }
        return parsed;

    } catch (error) {
        console.error("Error generating trending phrases:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('La API Key no es válida. Por favor, verifica e introdúcela de nuevo.');
        }
        if (error instanceof Error && error.message.includes('formato esperado')) {
            throw error;
        }
        throw new Error('No se pudieron generar las frases de tendencia. Intenta de nuevo.');
    }
};
