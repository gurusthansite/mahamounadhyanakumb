import type { UserData } from '../types/poster';
import { getAnnaprasadamPosterConfig } from './coordinates';
import { 
  TRANSLATIONS, 
  getPoshakuluTitleByLang, 
  getMahaMounaTitleByLang,
  type SupportedLanguage 
} from '../i18n/annaprasadamTranslations';

export const IMAGE_TEMPLATE_WIDTH = 715;
export const IMAGE_TEMPLATE_HEIGHT = 1280;
export const IMAGE_PHOTO_AREA = { x: 190, y: 323, width: 339, height: 349 };

// Annaprasadam (Arunachalam.png) Dimensions: 900 x 1600
export const ARUNACHALAM_TEMPLATE_WIDTH = 900;
export const ARUNACHALAM_TEMPLATE_HEIGHT = 1600;
// Photo Frame coordinates for Arunachalam.png (exact transparent frame bounds)
export const ARUNACHALAM_PHOTO_AREA = { x: 240, y: 765, width: 420, height: 445 };

export const generateImage = async (
  userData: UserData,
  templateUrl: string,
  isAnnaprasadam: boolean = false,
  lang: SupportedLanguage = 'te'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!userData.photoUrl) return reject(new Error("No image provided"));

    const isMahaMouna = userData.sevaCategory === 'mahamouna';
    const annaprasadamConfig = getAnnaprasadamPosterConfig(lang, isMahaMouna);
    const width = isAnnaprasadam ? annaprasadamConfig.templateWidth : IMAGE_TEMPLATE_WIDTH;
    const height = isAnnaprasadam ? annaprasadamConfig.templateHeight : IMAGE_TEMPLATE_HEIGHT;
    const photoArea = isAnnaprasadam ? annaprasadamConfig.photoArea : IMAGE_PHOTO_AREA;

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
          const isMahaMouna = userData.sevaCategory === 'mahamouna';
          const platesNum = parseInt(userData.plates || '1', 10) || 1;
          const donationAmountNum = parseInt(userData.donationAmount || '1', 10) || 1;
          const titleText = isMahaMouna
            ? getMahaMounaTitleByLang(donationAmountNum, lang)
            : getPoshakuluTitleByLang(platesNum, lang);
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

          // 1. Top Banner: Poshakulu Title inside dark ornate banner (no plates displayed, enlarged text with auto-fit)
          const topText = titleText;
          const titleX = Math.round(width * (annaprasadamConfig.title.centerPercent / 100));
          const titleY = Math.round(height * (annaprasadamConfig.title.topPercent / 100));
          let titleFontSize = lang === 'en' ? 34 : 38;
          ctx.font = `bold ${titleFontSize}px ${fontFam}`;
          const maxTitleWidth = 460;
          while (ctx.measureText(topText).width > maxTitleWidth && titleFontSize > 22) {
            titleFontSize -= 2;
            ctx.font = `bold ${titleFontSize}px ${fontFam}`;
          }
          ctx.fillStyle = '#ffea79';
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 6;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(topText, titleX, titleY);
          ctx.shadowBlur = 0;

          // 2. Bottom Banner: Donor Name with prefix & suffix inside cream parchment banner (enlarged text)
          const isOther = userData.contributionFor === 'other' && Boolean(userData.beneficiaryName?.trim());
          const targetName = isOther ? userData.beneficiaryName!.trim() : userData.fullName;
          if (targetName) {
            const effectiveTopPercent = userData.customNamePosition?.topPercent ?? annaprasadamConfig.name.topPercent;
            const effectiveCenterPercent = userData.customNamePosition?.centerPercent ?? annaprasadamConfig.name.centerPercent;
            const nameX = Math.round(width * (effectiveCenterPercent / 100));
            const nameY = Math.round(height * (effectiveTopPercent / 100));
            const activePrefix = isOther
              ? (userData.beneficiaryTitle ? `${userData.beneficiaryTitle} ` : (lang === 'en' ? 'Smt ' : 'శ్రీమతి '))
              : (userData.titlePrefix ? `${userData.titlePrefix} ` : (lang === 'en' ? 'Sri ' : 'శ్రీ '));
            const suffix = t.nameSuffix ? ` ${t.nameSuffix}` : '';
            const displayName = `${activePrefix}${targetName}${suffix}`;

            // Auto-scale font size if name is long (Inner parchment width is ~500px)
            let fontSize = userData.customNamePosition?.fontSize || 34;
            ctx.font = `bold ${fontSize}px ${fontFam}`;
            const maxNameWidth = Math.round(width * 0.58);
            while (ctx.measureText(displayName).width > maxNameWidth && fontSize > 18) {
              fontSize -= 2;
              ctx.font = `bold ${fontSize}px ${fontFam}`;
            }

            ctx.fillStyle = '#591104';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayName, nameX, nameY);
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







