import type { UserData } from '../types/poster';
import { ANNAPRASADAM_TEXT_POSITIONS } from './coordinates';

export const IMAGE_TEMPLATE_WIDTH = 715;
export const IMAGE_TEMPLATE_HEIGHT = 1280;
export const IMAGE_PHOTO_AREA = { x: 190, y: 323, width: 339, height: 349 };

// Annaprasadam (Arunachalam.png) Dimensions: 1024 x 1536
export const ARUNACHALAM_TEMPLATE_WIDTH = 1024;
export const ARUNACHALAM_TEMPLATE_HEIGHT = 1536;
// Photo Frame coordinates
export const ARUNACHALAM_PHOTO_AREA = { x: 83, y: 618, width: 366, height: 476 };

export const generateImage = async (
  userData: UserData,
  templateUrl: string,
  isAnnaprasadam: boolean = false
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
          // Annaprasadam Custom Text - Dynamically uses ANNAPRASADAM_TEXT_POSITIONS
          // Text details are ONLY drawn if payment has been successfully completed
          if (userData.isPaid) {
            // 1. Plates count + 'ప్లేట్స్ అన్నప్రసాదం'
            if (userData.plates) {
              const platesX = Math.round(width * (ANNAPRASADAM_TEXT_POSITIONS.plates.centerPercent / 100));
              const platesY = Math.round(height * (ANNAPRASADAM_TEXT_POSITIONS.plates.topPercent / 100));
              
              // First measure both texts to center them together
              ctx.font = 'bold 50px "Noto Sans Telugu", sans-serif';
              const platesNumWidth = ctx.measureText(String(userData.plates)).width;
              
              ctx.font = 'bold 44px "Noto Sans Telugu", sans-serif';
              const labelWidth = ctx.measureText(' ప్లేట్స్ అన్నప్రసాదం').width;
              
              const totalWidth = platesNumWidth + labelWidth;
              const startX = platesX - (totalWidth / 2);

              // Draw number in yellow
              ctx.font = 'bold 50px "Noto Sans Telugu", sans-serif';
              ctx.fillStyle = '#ffeb3b'; // vibrant yellow
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(String(userData.plates), startX, platesY);

              // Draw label in white
              ctx.font = 'bold 44px "Noto Sans Telugu", sans-serif';
              ctx.fillStyle = '#ffffff';
              ctx.fillText(' ప్లేట్స్ అన్నప్రసాదం', startX + platesNumWidth, platesY);
            }

            // 2. Donor Name + [గారికి] automatically
            if (userData.fullName) {
              ctx.font = 'bold 38px "Noto Sans Telugu", sans-serif';
              ctx.fillStyle = '#1e3a1e'; // deep dark forest green
              ctx.textAlign = 'right';
              ctx.textBaseline = 'middle';
              const nameX = Math.round(width * (1 - (ANNAPRASADAM_TEXT_POSITIONS.name.rightPercent / 100)));
              const nameY = Math.round(height * (ANNAPRASADAM_TEXT_POSITIONS.name.topPercent / 100));
              const displayName = `${userData.titlePrefix ? userData.titlePrefix + ' ' : 'శ్రీ '}${userData.fullName} గారికి`;
              ctx.fillText(displayName, nameX, nameY);
            }
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







