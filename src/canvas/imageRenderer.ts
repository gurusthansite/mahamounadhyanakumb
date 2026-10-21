import type { UserData } from '../types/poster';
import { ANNAPRASADAM_TEXT_POSITIONS } from './coordinates';
import { 
  TRANSLATIONS, 
  getPoshakuluTitleByLang, 
  type SupportedLanguage 
} from '../i18n/annaprasadamTranslations';

export const IMAGE_TEMPLATE_WIDTH = 715;
export const IMAGE_TEMPLATE_HEIGHT = 1280;
export const IMAGE_PHOTO_AREA = { x: 190, y: 323, width: 339, height: 349 };

// Annaprasadam (Arunachalam.png) Dimensions: 1024 x 1536
export const ARUNACHALAM_TEMPLATE_WIDTH = 1024;
export const ARUNACHALAM_TEMPLATE_HEIGHT = 1536;
// Photo Frame coordinates for Arunachalam.png
export const ARUNACHALAM_PHOTO_AREA = { x: 48, y: 604, width: 362, height: 384 };

export const generateImage = async (
  userData: UserData,
  templateUrl: string,
  isAnnaprasadam: boolean = false,
  lang: SupportedLanguage = 'te'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!userData.photoUrl) return reject(new Error("No image provided"));

    const width = isAnnaprasadam ? ARUNACHALAM_TEMPLATE_WIDTH : IMAGE_TEMPLATE_WIDTH;
    const height = isAnnaprasadam ? ARUNACHALAM_TEMPLATE_HEIGHT : IMAGE_TEMPLATE_HEIGHT;
    const photoArea = isAnnaprasadam ? ARUNACHALAM_PHOTO_AREA : IMAGE_PHOTO_AREA;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error("No canvas context"));

    const templateImg = new Image();
    templateImg.crossOrigin = "anonymous";
    templateImg.src = templateUrl;

    templateImg.onload = () => {
      const userImg = new Image();
      userImg.crossOrigin = "anonymous";
      userImg.src = userData.photoUrl!;

      userImg.onload = () => {
        // Draw user photo (already cropped to exact aspect ratio)
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoArea.x, photoArea.y, photoArea.width, photoArea.height);
        ctx.clip();
        ctx.drawImage(userImg, photoArea.x, photoArea.y, photoArea.width, photoArea.height);
        ctx.restore();

        // Draw template overlay
        ctx.drawImage(templateImg, 0, 0, width, height);

        if (isAnnaprasadam) {
          const platesNum = parseInt(userData.plates || '1', 10) || 1;
          const titleText = getPoshakuluTitleByLang(platesNum, lang);
          const t = TRANSLATIONS[lang] || TRANSLATIONS.te;
          const fontFam = lang === 'ta'
            ? '"Noto Sans Tamil", sans-serif'
            : lang === 'hi'
            ? '"Noto Sans Devanagari", sans-serif'
            : lang === 'kn'
            ? '"Noto Sans Kannada", sans-serif'
            : lang === 'en'
            ? '"Noto Sans", sans-serif'
            : '"Noto Sans Telugu", sans-serif';

          // 1. Poshakulu Title inside dark green pill box
          const titleX = Math.round(width * (ANNAPRASADAM_TEXT_POSITIONS.title.centerPercent / 100));
          const titleY = Math.round(height * (ANNAPRASADAM_TEXT_POSITIONS.title.topPercent / 100));
          ctx.font = `bold 44px ${fontFam}`;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(titleText, titleX, titleY);

          // 2. Line 1: Plates count + localized line1Text
          const line1X = Math.round(width * (ANNAPRASADAM_TEXT_POSITIONS.line1.centerPercent / 100));
          const line1Y = Math.round(height * (ANNAPRASADAM_TEXT_POSITIONS.line1.topPercent / 100));
          ctx.font = `bold 40px ${fontFam}`;
          ctx.fillStyle = '#6b1406';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${platesNum} ${t.line1Text}`, line1X, line1Y);

          // 3. Line 2: localized line2Text
          const line2X = Math.round(width * (ANNAPRASADAM_TEXT_POSITIONS.line2.centerPercent / 100));
          const line2Y = Math.round(height * (ANNAPRASADAM_TEXT_POSITIONS.line2.topPercent / 100));
          ctx.font = `bold 34px ${fontFam}`;
          ctx.fillStyle = '#6b1406';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(t.line2Text, line2X, line2Y);

          // 4. Line 3: Donor Name with prefix & suffix
          if (userData.fullName) {
            const line3X = Math.round(width * (ANNAPRASADAM_TEXT_POSITIONS.line3.centerPercent / 100));
            const line3Y = Math.round(height * (ANNAPRASADAM_TEXT_POSITIONS.line3.topPercent / 100));
            const prefix = userData.titlePrefix ? `${userData.titlePrefix} ` : (lang === 'en' ? 'Sri ' : 'శ్రీ ');
            const suffix = t.nameSuffix ? ` ${t.nameSuffix}` : '';
            const displayName = `${prefix}${userData.fullName}${suffix}`;

            // Auto-scale font size if name is long
            let fontSize = 42;
            ctx.font = `bold ${fontSize}px ${fontFam}`;
            const maxNameWidth = 480;
            while (ctx.measureText(displayName).width > maxNameWidth && fontSize > 24) {
              fontSize -= 2;
              ctx.font = `bold ${fontSize}px ${fontFam}`;
            }

            ctx.fillStyle = '#6b1406';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayName, line3X, line3Y);
          }
        } else {
          // Standard Image Template Text
          if (userData.fullName) {
            ctx.font = 'bold 32px "Noto Sans Telugu", sans-serif';
            ctx.fillStyle = '#8b3d0b'; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(userData.fullName, IMAGE_TEMPLATE_WIDTH / 2, Math.round(IMAGE_TEMPLATE_HEIGHT * 0.520)); 
          }

          if (userData.hours) {
            ctx.font = 'bold 36px "Noto Sans Telugu", sans-serif';
            ctx.fillStyle = '#b91c1c';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const hoursX = Math.round(IMAGE_TEMPLATE_WIDTH * 0.420);
            const hoursY = Math.round(IMAGE_TEMPLATE_HEIGHT * 0.640);
            ctx.fillText(userData.hours, hoursX, hoursY); 
          }
        }

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Blob generation failed"));
        }, 'image/png');
      };
      userImg.onerror = () => reject(new Error("Failed to load user image."));
    };
    templateImg.onerror = () => reject(new Error("Failed to load template image."));
  });
};







