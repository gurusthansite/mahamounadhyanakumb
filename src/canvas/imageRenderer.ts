import type { UserData } from '../types/poster';

export const IMAGE_TEMPLATE_WIDTH = 715;
export const IMAGE_TEMPLATE_HEIGHT = 1280;
export const IMAGE_PHOTO_AREA = { x: 190, y: 323, width: 339, height: 349 };

export const generateImage = async (
  userData: UserData,
  templateUrl: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!userData.photoUrl) return reject(new Error("No image provided"));

    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_TEMPLATE_WIDTH;
    canvas.height = IMAGE_TEMPLATE_HEIGHT;
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
        ctx.rect(IMAGE_PHOTO_AREA.x, IMAGE_PHOTO_AREA.y, IMAGE_PHOTO_AREA.width, IMAGE_PHOTO_AREA.height);
        ctx.clip();
        ctx.drawImage(userImg, IMAGE_PHOTO_AREA.x, IMAGE_PHOTO_AREA.y, IMAGE_PHOTO_AREA.width, IMAGE_PHOTO_AREA.height);
        ctx.restore();

        // Draw template overlay
        ctx.drawImage(templateImg, 0, 0, IMAGE_TEMPLATE_WIDTH, IMAGE_TEMPLATE_HEIGHT);

        // Draw text
        if (userData.fullName) {
          ctx.font = 'bold 32px "Noto Sans Telugu", sans-serif';
          ctx.fillStyle = '#8b3d0b'; 
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          // 52.0% of 1280 is ~666
          ctx.fillText(userData.fullName, IMAGE_TEMPLATE_WIDTH / 2, Math.round(IMAGE_TEMPLATE_HEIGHT * 0.520)); 
        }

        if (userData.hours) {
          ctx.font = 'bold 36px "Noto Sans Telugu", sans-serif';
          ctx.fillStyle = '#b91c1c';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // 42.0% of 715 is 300, 64.0% of 1280 is 819
          const hoursX = Math.round(IMAGE_TEMPLATE_WIDTH * 0.420);
          const hoursY = Math.round(IMAGE_TEMPLATE_HEIGHT * 0.640);
          ctx.fillText(userData.hours, hoursX, hoursY); 
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







