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
  dob?: string;
  plateNumber?: string;
  plateLockToken?: string;
  isPlateLocked?: boolean;
  hours?: string;
  plates?: string;
  donationAmount?: string;
  sevaCategory?: 'guruprasadam' | 'mahamouna';
  titlePrefix?: string;
  isPaid?: boolean;
  paymentId?: string;
  receiptNo?: string;
  receiptDate?: string;
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
