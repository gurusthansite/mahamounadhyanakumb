export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UserData {
  fullName: string;
  phoneNumber: string;
  location: string;
  hours?: string;
  plates?: string;
  titlePrefix?: string;
  photoUrl: string | null;
  rawMediaUrl?: string | null;
  cropArea?: CropArea;
  cropPixels?: CropArea;
  templateType: 'video' | 'image';
  videoOffset?: { x: number; y: number };
  videoScale?: number;
  videoStartTime?: number;
  videoEndTime?: number;
}
