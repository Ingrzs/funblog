
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
 * Calcula cómo se ajustará el texto en un ancho dado y devuelve las líneas y la altura total.
 */
const calculateWrappedText = (context, text, maxWidth, font, lineHeight) => {
    context.font = font;
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

    return { lines, textHeight: lines.length * lineHeight };
};

/**
 * Crea una imagen de meme con formato de publicación de red social, con opciones para el encabezado y la marca de agua.
 * @param {object} memeData Un objeto que contiene todos los datos necesarios para crear el meme.
 * @returns {Promise<string>} Una promesa que se resuelve con la URL de datos de la imagen generada.
 */
export const createMemeImage = async (memeData) => {
    const { design, mainImageUrl, text } = memeData;
    if (!mainImageUrl) throw new Error("La URL de la imagen principal es requerida para crear un meme.");
    
    const { watermark } = design;
    
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
        const { lines, textHeight } = calculateWrappedText(ctx, text, contentWidth, textFont, textLineHeight);
        
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
        lines.forEach(line => {
            ctx.fillText(line, PADDING, currentY);
            currentY += textLineHeight;
        });
        
        const imageY = currentY - textLineHeight + IMAGE_TOP_MARGIN;
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
        
        return canvas.toDataURL('image/jpeg', 0.9);

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
        
        const PADDING = 40;
        const AVATAR_SIZE = 50;
        const HEADER_GAP = 12;
        const FONT_FAMILY = '"Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo obtener el contexto del canvas.');
        
        const contentWidth = 500;
        canvas.width = contentWidth + PADDING * 2;
        
        const textFont = `bold 28px ${FONT_FAMILY}`;
        const textLineHeight = 40;
        const { lines, textHeight } = calculateWrappedText(ctx, text, contentWidth, textFont, textLineHeight);
        
        let headerHeight = 0;
        if (design.showHeader) {
            headerHeight = PADDING + AVATAR_SIZE + PADDING / 2;
        }

        const totalTextHeight = textHeight + PADDING * 2;
        const minHeight = 400;
        let contentHeight = Math.max(minHeight, totalTextHeight);
        
        canvas.height = headerHeight + contentHeight;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let currentY = 0;
        
        if (design.showHeader && avatarImg) {
            currentY = PADDING;
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
            currentY += AVATAR_SIZE;
        }

        ctx.fillStyle = '#111827';
        ctx.font = textFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textBlockY = headerHeight + (contentHeight / 2) - (textHeight / 2);

        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, textBlockY + index * textLineHeight);
        });
        
        if (watermark.type !== 'none') {
            ctx.save();
            ctx.globalAlpha = watermark.opacity;
            
            const watermarkX = (canvas.width * watermark.x / 100);
            const watermarkY = headerHeight + (contentHeight * (watermark.y / 100));

            if (watermark.type === 'text') {
                const fontSize = watermark.size * 4;
                ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
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
        
        return canvas.toDataURL('image/jpeg', 0.9);

    } catch (error) {
        console.error("Error al crear la imagen de la frase:", error);
        throw new Error('No se pudo generar la imagen final de la frase.');
    }
};
