export interface UserData {
  fullName: string;
  phoneNumber: string;
  location: string;
  hours?: string;
  photoUrl: string | null;
  templateType: 'video' | 'image';
  videoOffset?: { x: number; y: number };
  videoScale?: number;
  videoStartTime?: number;
  videoEndTime?: number;
}
