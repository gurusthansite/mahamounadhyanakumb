export const POSTER_WIDTH = 720;
export const POSTER_HEIGHT = 1280;

export const PHOTO_AREA = {
  x: 31,
  y: 385,
  width: 659,
  height: 567,
};

export const TEXT_AREA = {
  x: 31,
  y: 1000,
  width: 659,
  height: 60,
};

// Donor tier titles based on plate count for Annaprasadam Seva
export function getPoshakuluTitle(plates: number): string {
  if (plates >= 222) return 'మహారాజ పోషకులు';
  if (plates >= 112) return 'రాజ పోషకులు';
  if (plates >= 52) return 'సహస్రాజ పోషకులు';
  return 'పోషకులు';
}

// Text coordinates in percentages for Annaprasadam on Arunachalam.png (1024 x 1536)
export const ANNAPRASADAM_TEXT_POSITIONS = {
  // 1. Dark Green Pill Box: Poshakulu Title
  title: {
    topPercent: 42.35,   // Center inside the green box (y: 650/1536)
    centerPercent: 70.0, // Center horizontally in green box (x: 716/1024)
    y: 650,
    x: 716,
  },
  // 2. Line 1: Plates Count + 'ప్లేట్స్ అన్నప్రసాదం'
  line1: {
    topPercent: 49.15,   // Center of line 1 (y: 755/1536)
    centerPercent: 70.0, // (x: 716/1024)
    y: 755,
    x: 716,
  },
  // 3. Line 2: 'అందిస్తున్నందుకు'
  line2: {
    topPercent: 54.06,   // Center of line 2 (y: 815/1536)
    centerPercent: 70.0, // (x: 716/1024)
    y: 815,
    x: 716,
  },
  // 4. Line 3: Donor Name + 'గారికి'
  line3: {
    topPercent: 58.29,   // Center of line 3 (y: 880/1536)
    centerPercent: 70.0, // (x: 716/1024)
    y: 880,
    x: 716,
  },
  // Legacy aliases
  plates: {
    topPercent: 49.15,
    centerPercent: 70.0,
  },
  name: {
    topPercent: 57.29,
    centerPercent: 70.0,
    rightPercent: 12.0,
  }
};
