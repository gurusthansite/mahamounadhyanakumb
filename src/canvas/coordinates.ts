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
  if (plates > 1000) return 'మహా పోషక చక్రవర్తులు';
  if (plates >= 502) return 'పోషక చక్రవర్తులు';
  if (plates >= 222) return 'మహారాజ పోషకులు';
  if (plates >= 111) return 'రాజపోషకులు';
  if (plates >= 52) return 'సహరాజ పోషకులు';
  return 'పోషకులు';
}

// Text coordinates in percentages for Annaprasadam on Arunachalam.png (900 x 1600)
export const ANNAPRASADAM_TEXT_POSITIONS = {
  // 1. Top Banner: Poshakulu Title & Plates inside dark ornate banner
  title: {
    topPercent: 43.0,     // Center inside dark banner (y: 688/1600)
    centerPercent: 50.0,  // Center horizontally (x: 450/900)
    y: 688,
    x: 450,
  },
  // 2. Bottom Banner: Donor Name inside parchment banner
  name: {
    topPercent: 79.0,    // Center inside cream parchment banner (y: 1276/1600)
    centerPercent: 50.0,  // (x: 450/900)
    y: 1276,
    x: 450,
  },
  // Aliases for compatibility
  line1: {
    topPercent: 43.0,
    centerPercent: 50.0,
    y: 688,
    x: 450,
  },
  line2: {
    topPercent: 43.0,
    centerPercent: 50.0,
    y: 688,
    x: 450,
  },
  line3: {
    topPercent: 79.75,
    centerPercent: 50.0,
    y: 1276,
    x: 450,
  },
  plates: {
    topPercent: 43.0,
    centerPercent: 50.0,
  }
};
