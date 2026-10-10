import type { UserData } from '../types/poster';
import { POSTER_WIDTH, POSTER_HEIGHT, PHOTO_AREA, TEXT_AREA } from './coordinates';

export const drawPoster = async (
  canvas: HTMLCanvasElement, 
  userData: UserData, 
  posterImageSrc: string
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Load the template image
  const templateImg = await loadImage(posterImageSrc);
  
  // Set canvas dimensions to match the poster exactly
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  
  // Draw template first
  ctx.drawImage(templateImg, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  
  // If user has a photo, draw it
  if (userData.photoUrl) {
    try {
      const userImg = await loadImage(userData.photoUrl);
      
      // Calculate crop to 'cover' the area
      const scale = Math.max(PHOTO_AREA.width / userImg.width, PHOTO_AREA.height / userImg.height);
      const scaledWidth = userImg.width * scale;
      const scaledHeight = userImg.height * scale;
      
      const dx = PHOTO_AREA.x + (PHOTO_AREA.width - scaledWidth) / 2;
      const dy = PHOTO_AREA.y + (PHOTO_AREA.height - scaledHeight) / 2;
      
      // Clip to the photo area
      ctx.save();
      ctx.beginPath();
      // Shrink clip area slightly to keep the original white border look
      const borderSize = 4;
      ctx.rect(
        PHOTO_AREA.x + borderSize, 
        PHOTO_AREA.y + borderSize, 
        PHOTO_AREA.width - borderSize * 2, 
        PHOTO_AREA.height - borderSize * 2
      );
      ctx.clip();
      
      ctx.drawImage(userImg, dx, dy, scaledWidth, scaledHeight);
      
      ctx.restore();
    } catch (e) {
      console.error("Failed to load user photo onto canvas", e);
    }
  }

  // Draw user name and location in the text area pill
  if (userData.fullName || userData.location) {
    ctx.save();
    
    const textCenterY = TEXT_AREA.y + (TEXT_AREA.height / 2);
    const textCenterX = TEXT_AREA.x + (TEXT_AREA.width / 2);
    
    // Configure text styling
    ctx.fillStyle = "white"; // White text to contrast with dark green pill
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const hasBoth = userData.fullName && userData.location;
    
    if (hasBoth) {
      // Draw name slightly higher, location slightly lower
      ctx.font = "bold 24px 'Poppins', sans-serif";
      ctx.fillText(userData.fullName, textCenterX, textCenterY - 12);
      
      ctx.font = "600 18px 'Poppins', sans-serif";
      // Use a slight opacity or yellow color for location to differentiate
      ctx.fillStyle = "#fef08a"; // Tailwind yellow-200
      ctx.fillText(userData.location, textCenterX, textCenterY + 14);
    } else {
      // Draw just the one available centered
      ctx.font = "bold 26px 'Poppins', sans-serif";
      const text = userData.fullName || userData.location;
      ctx.fillText(text, textCenterX, textCenterY);
    }
    
    ctx.restore();
  }
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};
