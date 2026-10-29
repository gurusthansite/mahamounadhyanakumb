import type { SupportedLanguage } from '../i18n/annaprasadamTranslations';

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

export interface AnnaprasadamPosterConfig {
  templateWidth: number;
  templateHeight: number;
  photoArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  title: {
    topPercent: number;
    centerPercent: number;
    y: number;
    x: number;
  };
  name: {
    topPercent: number;
    centerPercent: number;
    y: number;
    x: number;
  };
}

export const ANNAPRASADAM_CONFIG_BY_LANG: Record<SupportedLanguage, AnnaprasadamPosterConfig> = {
  te: {
    templateWidth: 900,
    templateHeight: 1600,
    photoArea: { x: 238, y: 776, width: 420, height: 429 },
    title: { topPercent: 43.1, centerPercent: 50.0, y: 690, x: 450 },
    name: { topPercent: 79.0, centerPercent: 50.0, y: 1264, x: 450 },
  },
  en: {
    templateWidth: 900,
    templateHeight: 1600,
    photoArea: { x: 240, y: 801, width: 422, height: 372 },
    title: { topPercent: 45.3, centerPercent: 50.0, y: 725, x: 450 },
    name: { topPercent: 76.3, centerPercent: 50.0, y: 1221, x: 450 },
  },
  ta: {
    templateWidth: 900,
    templateHeight: 1600,
    photoArea: { x: 240, y: 806, width: 415, height: 364 },
    title: { topPercent: 45.6, centerPercent: 50.0, y: 730, x: 450 },
    name: { topPercent: 76.8, centerPercent: 50.0, y: 1230, x: 450 },
  },
  hi: {
    templateWidth: 900,
    templateHeight: 1600,
    photoArea: { x: 239, y: 814, width: 423, height: 349 },
    title: { topPercent: 46.1, centerPercent: 50.0, y: 738, x: 450 },
    name: { topPercent: 76.3, centerPercent: 50.0, y: 1221, x: 450 },
  },
  kn: {
    templateWidth: 900,
    templateHeight: 1600,
    photoArea: { x: 240, y: 787, width: 416, height: 388 },
    title: { topPercent: 44.4, centerPercent: 50.0, y: 710, x: 450 },
    name: { topPercent: 77.1, centerPercent: 50.0, y: 1234, x: 450 },
  },
};

export const MAHAMOUNA_CONFIG_BY_LANG: Record<SupportedLanguage, AnnaprasadamPosterConfig> = {
  te: {
    templateWidth: 900,
    templateHeight: 1600,
    photoArea: { x: 242, y: 774, width: 418, height: 430 },
    title: { topPercent: 43.5, centerPercent: 50.0, y: 697, x: 450 },
    name: { topPercent: 79.0, centerPercent: 50.0, y: 1264, x: 450 },
  },
  en: {
    templateWidth: 941,
    templateHeight: 1672,
    photoArea: { x: 247, y: 839, width: 447, height: 414 },
    title: { topPercent: 45.0, centerPercent: 50.0, y: 753, x: 470 },
    name: { topPercent: 78.95, centerPercent: 50.0, y: 1320, x: 470 },
  },
  ta: {
    templateWidth: 941,
    templateHeight: 1672,
    photoArea: { x: 261, y: 798, width: 418, height: 429 },
    title: { topPercent: 42.7, centerPercent: 50.0, y: 714, x: 470 },
    name: { topPercent: 78.95, centerPercent: 50.0, y: 1320, x: 470 },
  },
  hi: {
    templateWidth: 941,
    templateHeight: 1672,
    photoArea: { x: 247, y: 838, width: 446, height: 415 },
    title: { topPercent: 45.0, centerPercent: 50.0, y: 753, x: 470 },
    name: { topPercent: 78.95, centerPercent: 50.0, y: 1320, x: 470 },
  },
  kn: {
    templateWidth: 900,
    templateHeight: 1600,
    photoArea: { x: 241, y: 765, width: 419, height: 436 },
    title: { topPercent: 42.7, centerPercent: 50.0, y: 684, x: 450 },
    name: { topPercent: 79.0, centerPercent: 50.0, y: 1264, x: 450 },
  },
};

export function getAnnaprasadamPosterConfig(
  lang: SupportedLanguage = 'te', 
  isMahaMouna: boolean = false
): AnnaprasadamPosterConfig {
  if (isMahaMouna) {
    return MAHAMOUNA_CONFIG_BY_LANG[lang] || MAHAMOUNA_CONFIG_BY_LANG.te;
  }
  return ANNAPRASADAM_CONFIG_BY_LANG[lang] || ANNAPRASADAM_CONFIG_BY_LANG.te;
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
