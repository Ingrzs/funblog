
/**
 * Carga una imagen desde una URL y devuelve una promesa que se resuelve con el elemento de imagen.
 * @param {string} src La URL de la imagen a cargar.
 * @returns {Promise<HTMLImageElement>} Una promesa que se resuelve con el elemento HTMLImageElement.
 */
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src}, Error: ${err}`));
        img.src = src;
    });
};

/**
 * Calcula cómo se ajustará el texto en un ancho dado y devuelve las líneas.
 */
const calculateWrappedText = (context, text, maxWidth) => {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && line.length > 0) {
            lines.push(line.trim());
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());
    return lines;
};

/**
 * Dibuja el texto ajustado en el canvas, manejando diferentes alineaciones.
 * @returns {number} La altura total del bloque de texto dibujado.
 */
const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, textAlign) => {
    const lines = calculateWrappedText(ctx, text, maxWidth);
    let currentY = y;

    lines.forEach((line, index) => {
        const isLastLine = index === lines.length - 1;

        if (textAlign === 'justify' && !isLastLine) {
            const words = line.split(' ');
            if (words.length > 1) {
                const totalWordsWidth = words.reduce((sum, word) => sum + ctx.measureText(word).width, 0);
                const totalSpacing = maxWidth - totalWordsWidth;
                const spaceBetween = totalSpacing / (words.length - 1);
                
                let currentX = x;
                ctx.textAlign = 'left';
                words.forEach(word => {
                    ctx.fillText(word, currentX, currentY);
                    currentX += ctx.measureText(word).width + spaceBetween;
                });
            } else {
                 ctx.textAlign = 'left';
                 ctx.fillText(line, x, currentY);
            }
        } else {
            const align = (textAlign === 'justify') ? 'left' : textAlign;
            ctx.textAlign = align;
            let startX = x;
            if (align === 'center') {
                startX = x + maxWidth / 2;
            } else if (align === 'right') {
                startX = x + maxWidth;
            }
            ctx.fillText(line, startX, currentY);
        }
        currentY += lineHeight;
    });
    return lines.length * lineHeight;
};


/**
 * Crea una imagen de meme con formato de publicación de red social, con opciones para el encabezado y la marca de agua.
 * @param {object} memeData Un objeto que contiene todos los datos necesarios para crear el meme.
 * @returns {Promise<string>} Una promesa que se resuelve con la URL de datos de la imagen generada.
 */
export const createMemeImage = async (memeData) => {
    const { design, mainImageUrl, text } = memeData;
    if (!mainImageUrl) throw new Error("La URL de la imagen principal es requerida para crear un meme.");
    
    const { watermark, textAlign } = design;
    
    try {
        const imagePromises = [
            loadImage(mainImageUrl),
            design.showHeader ? loadImage(design.profileAvatarUrl) : Promise.resolve(null),
            (watermark.type === 'image' && watermark.imageUrl) ? loadImage(watermark.imageUrl) : Promise.resolve(null),
        ];

        const [userImg, avatarImg, watermarkImg] = await Promise.all(imagePromises);
        if (!userImg) throw new Error("No se pudo cargar la imagen del usuario.");

        const PADDING = 20;
        const AVATAR_SIZE = 50;
        const HEADER_GAP = 12;
        const TEXT_TOP_MARGIN = 15;
        const IMAGE_TOP_MARGIN = 15;
        const FONT_FAMILY = '"Segoe UI", Roboto, Helvetica, Arial, sans-serif';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo obtener el contexto del canvas.');

        const contentWidth = userImg.width < 400 ? 400 : userImg.width;
        canvas.width = contentWidth + PADDING * 2;

        const textFont = `21px ${FONT_FAMILY}`;
        const textLineHeight = 28;
        ctx.font = textFont;
        const textHeight = calculateWrappedText(ctx, text, contentWidth).length * textLineHeight;

        const scaledUserImgHeight = userImg.height * (contentWidth / userImg.width);
        
        let totalHeight = 0;
        if (design.showHeader) {
            totalHeight += PADDING + AVATAR_SIZE + TEXT_TOP_MARGIN;
        } else {
            totalHeight += PADDING;
        }
        totalHeight += textHeight + IMAGE_TOP_MARGIN + scaledUserImgHeight + PADDING;
        canvas.height = totalHeight;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let currentY = PADDING;

        if (design.showHeader && avatarImg) {
            const avatarX = PADDING;
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + AVATAR_SIZE / 2, currentY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2, true);
            ctx.clip();
            ctx.drawImage(avatarImg, avatarX, currentY, AVATAR_SIZE, AVATAR_SIZE);
            ctx.restore();

            const usernameX = avatarX + AVATAR_SIZE + HEADER_GAP;
            const usernameY = currentY + AVATAR_SIZE / 2 - 6;
            ctx.fillStyle = '#1F2937';
            ctx.font = `bold 18px ${FONT_FAMILY}`;
            ctx.fillText(design.profileName, usernameX, usernameY);

            const handleY = usernameY + 22;
            ctx.fillStyle = '#6B7280';
            ctx.font = `16px ${FONT_FAMILY}`;
            ctx.fillText(design.profileHandle, usernameX, handleY);
            currentY += AVATAR_SIZE + TEXT_TOP_MARGIN;
        }
        
        ctx.fillStyle = '#1F2937';
        ctx.font = textFont;
        const drawnTextHeight = drawWrappedText(ctx, text, PADDING, currentY, contentWidth, textLineHeight, textAlign);
        
        const imageY = currentY + drawnTextHeight - textLineHeight + IMAGE_TOP_MARGIN;
        ctx.drawImage(userImg, PADDING, imageY, contentWidth, scaledUserImgHeight);

        if (watermark.type !== 'none') {
            ctx.save();
            ctx.globalAlpha = watermark.opacity;
            const watermarkX = PADDING + (contentWidth * watermark.x / 100);
            const watermarkY = imageY + (scaledUserImgHeight * watermark.y / 100);

            if (watermark.type === 'text') {
                const fontSize = watermark.size * 5;
                ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const watermarkText = watermark.text.toUpperCase();
                ctx.strokeText(watermarkText, watermarkX, watermarkY);
                ctx.fillText(watermarkText, watermarkX, watermarkY);
            } else if (watermarkImg) {
                const wmWidth = watermark.size * 20;
                const wmHeight = watermarkImg.height * (wmWidth / watermarkImg.width);
                ctx.drawImage(watermarkImg, watermarkX - (wmWidth / 2), watermarkY - (wmHeight / 2), wmWidth, wmHeight);
            }
            ctx.restore();
        }
        
        return canvas.toDataURL('image/png');

    } catch (error) {
        console.error("Error al crear la imagen del meme:", error);
        throw new Error('No se pudo generar la imagen final del meme.');
    }
};

/**
 * Crea una imagen para una frase, con fondo blanco, texto y elementos de diseño opcionales.
 * @param {object} phraseData Un objeto que contiene los datos para crear la imagen de la frase.
 * @returns {Promise<string>} Una promesa que se resuelve con la URL de datos de la imagen generada.
 */
export const createPhraseImage = async (phraseData) => {
    const { design, text } = phraseData;
    const { watermark } = design;

    try {
        const imagePromises = [
            design.showHeader ? loadImage(design.profileAvatarUrl) : Promise.resolve(null),
            (watermark.type === 'image' && watermark.imageUrl) ? loadImage(watermark.imageUrl) : Promise.resolve(null),
        ];

        const [avatarImg, watermarkImg] = await Promise.all(imagePromises);
        
        const CARD_SIZE = 448;
        const PADDING = 16;
        const AVATAR_SIZE = 48;
        const HEADER_GAP = 10;
        const TEXT_TOP_MARGIN = 12;
        const FONT_FAMILY = '"Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        
        const canvas = document.createElement('canvas');
        canvas.width = CARD_SIZE;
        canvas.height = CARD_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo obtener el contexto del canvas.');
        
        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const contentWidth = CARD_SIZE - PADDING * 2;
        let currentY = PADDING;
        
        // Dibujar encabezado si está habilitado
        if (design.showHeader && avatarImg) {
            const avatarX = PADDING;
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + AVATAR_SIZE / 2, currentY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2, true);
            ctx.clip();
            ctx.drawImage(avatarImg, avatarX, currentY, AVATAR_SIZE, AVATAR_SIZE);
            ctx.restore();

            const usernameX = avatarX + AVATAR_SIZE + HEADER_GAP;
            const nameY = currentY + (AVATAR_SIZE / 2) - 10;
            const handleY = nameY + 18;

            ctx.fillStyle = '#1F2937';
            ctx.font = `bold 16px ${FONT_FAMILY}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(design.profileName, usernameX, nameY);

            ctx.fillStyle = '#6B7280';
            ctx.font = `14px ${FONT_FAMILY}`;
            ctx.fillText(design.profileHandle, usernameX, handleY);
            
            currentY += AVATAR_SIZE + TEXT_TOP_MARGIN;
        }

        // Preparar y dibujar texto principal
        ctx.fillStyle = '#111827';
        ctx.font = `bold 28px ${FONT_FAMILY}`;
        const textLineHeight = 40;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const textLines = calculateWrappedText(ctx, text, contentWidth);
        const textBlockHeight = textLines.length * textLineHeight;
        
        const availableHeight = CARD_SIZE - currentY - PADDING;
        const textStartY = currentY + (availableHeight - textBlockHeight) / 2;

        textLines.forEach((line, index) => {
            ctx.fillText(line, PADDING + contentWidth / 2, textStartY + index * textLineHeight);
        });
        
        // Dibujar marca de agua
        if (watermark.type !== 'none') {
            ctx.save();
            ctx.globalAlpha = watermark.opacity;
            
            const watermarkX = (CARD_SIZE * watermark.x / 100);
            const watermarkY = (CARD_SIZE * watermark.y / 100);

            if (watermark.type === 'text') {
                const fontSize = watermark.size * 4;
                ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const watermarkText = watermark.text.toUpperCase();
                ctx.strokeText(watermarkText, watermarkX, watermarkY);
                ctx.fillText(watermarkText, watermarkX, watermarkY);
            } else if (watermarkImg) {
                const wmWidth = watermark.size * 15;
                const wmHeight = watermarkImg.height * (wmWidth / watermarkImg.width);
                ctx.drawImage(watermarkImg, watermarkX - (wmWidth / 2), watermarkY - (wmHeight / 2), wmWidth, wmHeight);
            }
            ctx.restore();
        }
        
        return canvas.toDataURL('image/png');

    } catch (error) {
        console.error("Error al crear la imagen de la frase:", error);
        throw new Error('No se pudo generar la imagen final de la frase.');
    }
};

/**
 * Dibuja un rectángulo con esquinas redondeadas.
 * @param {CanvasRenderingContext2D} ctx El contexto del canvas.
 * @param {number} x La coordenada x.
 * @param {number} y La coordenada y.
 * @param {number} width El ancho.
 * @param {number} height La altura.
 * @param {number} radius El radio de las esquinas.
 */
const drawRoundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
};

/**
 * Crea una imagen con formato de tweet, con un diseño auténtico.
 * @param {object} tweetData Objeto con los datos para crear el tweet.
 * @returns {Promise<string>} Una promesa que se resuelve con la URL de datos de la imagen generada.
 */
export const createTweetImage = async (tweetData) => {
    const { design, text } = tweetData;
    const FONT_STACK = '"TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    try {
        const avatarImg = await loadImage(design.profileAvatarUrl);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context.');
        
        const BG_COLOR = '#16202A';
        const CARD_COLOR = '#FFFFFF';
        const NAME_COLOR = '#0F1419';
        const HANDLE_COLOR = '#536471';
        const TEXT_COLOR = '#0F1419';

        const CARD_WIDTH = 550;
        const HORIZONTAL_PADDING = 30;
        const VERTICAL_PADDING = 30;

        // Card internal padding
        const PADDING = 16;
        const AVATAR_SIZE = 48;
        const HEADER_GAP = 12;
        const TEXT_TOP_MARGIN = 12;

        const contentWidth = CARD_WIDTH - PADDING * 2;
        
        // --- Calculate Text Height ---
        ctx.font = `23px ${FONT_STACK}`;
        const textMaxWidth = contentWidth;
        const textLineHeight = 30;
        const textLines = calculateWrappedText(ctx, text, textMaxWidth);
        const textHeight = textLines.length * textLineHeight;

        let headerBlockHeight = 0;
        if (design.showHeader) {
            headerBlockHeight = AVATAR_SIZE + TEXT_TOP_MARGIN;
        }

        const cardHeight = PADDING + headerBlockHeight + textHeight + PADDING;
        
        canvas.width = CARD_WIDTH + HORIZONTAL_PADDING * 2;
        canvas.height = cardHeight + VERTICAL_PADDING * 2;

        // --- Drawing ---
        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw card
        ctx.fillStyle = CARD_COLOR;
        drawRoundRect(ctx, HORIZONTAL_PADDING, VERTICAL_PADDING, CARD_WIDTH, cardHeight, 16);
        
        const cardX = HORIZONTAL_PADDING;
        const cardY = VERTICAL_PADDING;

        let textY = cardY + PADDING;
        ctx.textBaseline = 'top';

        if (design.showHeader) {
            // Header
            const avatarX = cardX + PADDING;
            const avatarY = cardY + PADDING;
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + AVATAR_SIZE / 2, avatarY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2, true);
            ctx.clip();
            ctx.drawImage(avatarImg, avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE);
            ctx.restore();
            
            const usernameX = avatarX + AVATAR_SIZE + HEADER_GAP;
            const nameY = avatarY + 2;
            const handleY = nameY + 22;
            
            ctx.fillStyle = NAME_COLOR;
            ctx.font = `bold 16px ${FONT_STACK}`;
            ctx.textAlign = 'left';
            ctx.fillText(design.profileName, usernameX, nameY);
            
            ctx.fillStyle = HANDLE_COLOR;
            ctx.font = `15px ${FONT_STACK}`;
            ctx.fillText(design.profileHandle, usernameX, handleY);

            textY = avatarY + AVATAR_SIZE + TEXT_TOP_MARGIN;
        }
        
        // Tweet Text
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = `23px ${FONT_STACK}`;
        
        drawWrappedText(ctx, text, cardX + PADDING, textY, contentWidth, textLineHeight, 'left');

        return canvas.toDataURL('image/png');

    } catch (error) {
        console.error("Error creating tweet image:", error);
        throw new Error('Could not generate the final tweet image.');
    }
};
