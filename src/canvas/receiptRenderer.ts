import type { UserData } from '../types/poster';

export const RECEIPT_WIDTH = 1280;
export const RECEIPT_HEIGHT = 853;

export interface ReceiptOffsets {
  receiptNo?: { x: number; y: number };
  date?: { x: number; y: number };
  donorName?: { x: number; y: number };
  location?: { x: number; y: number };
  phone?: { x: number; y: number };
  dob?: { x: number; y: number };
  amountWords?: { x: number; y: number };
  amountBox?: { x: number; y: number };
  paymentRef?: { x: number; y: number };
  sevaDescription?: { x: number; y: number };
}

export interface ReceiptCustomData {
  receiptNo?: string;
  day?: string;
  month?: string;
  year?: string;
  donorName?: string;
  dob?: string;
  plateNumber?: string;
  location?: string;
  phoneNumber?: string;
  amount?: number;
  plates?: number;
  amountWords?: string;
  paymentRef?: string;
  sevaDescription?: string;
  offsets?: ReceiptOffsets;
}

export const DEFAULT_RECEIPT_COORDINATES = {
  receiptNo: { x: 235, y: 308 },
  dateDD: { x: 1052, y: 308 },
  dateMM: { x: 1108, y: 308 },
  dateYYYY: { x: 1192, y: 308 },
  donorName: { x: 385, y: 350 },
  location: { x: 260, y: 386 },
  phone: { x: 745, y: 386 },
  dob: { x: 1010, y: 386 },
  amountWords: { x: 275, y: 428 },
  amountBox: { x: 1145, y: 411 },
  paymentRef: { x: 270, y: 464 },
  sevaDescription: { x: 720, y: 464 }
};

/**
 * Converts a number to words in Indian numbering system
 */
export function numToWords(n: number): string {
  if (n <= 0) return 'Zero Rupees Only';
  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convert(num: number): string {
    if (num === 0) return '';
    if (num < 20) return units[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    if (num < 1000) return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convert(num % 10000000) : '');
  }

  return convert(n).trim() + ' Rupees Only';
}

/**
 * Renders the receipt directly onto an existing HTMLCanvasElement
 */
export async function renderReceiptToCanvas(
  canvas: HTMLCanvasElement,
  userData: UserData,
  customData?: ReceiptCustomData,
  templateUrl: string = '/receipt.png'
): Promise<void> {
  canvas.width = RECEIPT_WIDTH;
  canvas.height = RECEIPT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Ensure fonts are loaded before drawing
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font loading fails
    }
  }

  const templateImg = new Image();
  templateImg.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    templateImg.onload = () => resolve();
    templateImg.onerror = () => reject(new Error('Failed to load receipt template'));
    templateImg.src = templateUrl;
  });

  // Draw background receipt template
  ctx.drawImage(templateImg, 0, 0, RECEIPT_WIDTH, RECEIPT_HEIGHT);

  const plates = customData?.plates !== undefined 
    ? customData.plates 
    : (parseInt(userData.plates || '1', 10) || 1);

  const amount = customData?.amount !== undefined 
    ? customData.amount 
    : (plates * 1);

  const amountWords = customData?.amountWords || `${numToWords(amount)} (${plates} ${plates === 1 ? 'Plate' : 'Plates'})`;

  // Determine receipt date
  const now = new Date();
  const defaultDay = String(now.getDate()).padStart(2, '0');
  const defaultMonth = String(now.getMonth() + 1).padStart(2, '0');
  const defaultYear = String(now.getFullYear());

  const dayStr = customData?.day || defaultDay;
  const monthStr = customData?.month || defaultMonth;
  const yearStr = customData?.year || defaultYear;

  // Deterministic or stored Receipt Number
  const receiptNo =
    customData?.receiptNo ||
    userData.receiptNo ||
    `MK-${defaultDay}${defaultMonth}-${(userData.paymentId || '108').slice(-4).toUpperCase()}`;

  const prefix = userData.titlePrefix ? `${userData.titlePrefix} ` : '';
  const donorName = (customData?.donorName !== undefined ? customData.donorName : `${prefix}${userData.fullName || 'Devotee'}`).trim();

  const phone = customData?.phoneNumber !== undefined 
    ? customData.phoneNumber 
    : (userData.phoneNumber ? `+91 ${userData.phoneNumber.replace(/\D/g, '')}` : '—');

  const location = customData?.location !== undefined 
    ? customData.location 
    : (userData.location || '');

  const payId = customData?.paymentRef !== undefined 
    ? customData.paymentRef 
    : (userData.paymentId ? `Online / ${userData.paymentId}` : 'Online Payment');

  const plateNo = customData?.plateNumber || userData.plateNumber || '';
  const sevaDesc = customData?.sevaDescription !== undefined 
    ? customData.sevaDescription 
    : `Arunachalam Seva (${plates} Plates${plateNo ? ` • Plate #${plateNo}` : ''})`;

  const rawDob = customData?.dob !== undefined ? customData.dob : (userData.dob || '');
  let formattedDob = rawDob;
  if (rawDob && rawDob.includes('-')) {
    const parts = rawDob.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const offsets = customData?.offsets || {};

  // 1. Receipt No Box (Centered on the Receipt No dotted line)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 24px monospace, sans-serif';
  const rNoX = DEFAULT_RECEIPT_COORDINATES.receiptNo.x + (offsets.receiptNo?.x || 0);
  const rNoY = DEFAULT_RECEIPT_COORDINATES.receiptNo.y + (offsets.receiptNo?.y || 0);
  ctx.fillText(receiptNo, rNoX, rNoY);
  ctx.restore();

  // 2. Date Box (DD / MM / YYYY positioned directly atop each date line)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 22px sans-serif';
  const dateOffX = offsets.date?.x || 0;
  const dateOffY = offsets.date?.y || 0;
  ctx.fillText(dayStr, DEFAULT_RECEIPT_COORDINATES.dateDD.x + dateOffX, DEFAULT_RECEIPT_COORDINATES.dateDD.y + dateOffY);
  ctx.fillText(monthStr, DEFAULT_RECEIPT_COORDINATES.dateMM.x + dateOffX, DEFAULT_RECEIPT_COORDINATES.dateMM.y + dateOffY);
  ctx.fillText(yearStr, DEFAULT_RECEIPT_COORDINATES.dateYYYY.x + dateOffX, DEFAULT_RECEIPT_COORDINATES.dateYYYY.y + dateOffY);
  ctx.restore();

  // 3. Donor Name Line (Aligned nicely above the dotted line)
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 24px "Noto Sans Telugu", "Noto Sans", sans-serif';
  const nameX = DEFAULT_RECEIPT_COORDINATES.donorName.x + (offsets.donorName?.x || 0);
  const nameY = DEFAULT_RECEIPT_COORDINATES.donorName.y + (offsets.donorName?.y || 0);
  // Fit wide names within line length
  let nameFont = 24;
  while (ctx.measureText(donorName).width > 800 && nameFont > 14) {
    nameFont -= 1;
    ctx.font = `bold ${nameFont}px "Noto Sans Telugu", "Noto Sans", sans-serif`;
  }
  ctx.fillText(donorName, nameX, nameY);
  ctx.restore();

  // 4. Address / Location Line (if available)
  if (location) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#0f1e4a';
    ctx.font = 'bold 20px "Noto Sans Telugu", "Noto Sans", sans-serif';
    const locX = DEFAULT_RECEIPT_COORDINATES.location.x + (offsets.location?.x || 0);
    const locY = DEFAULT_RECEIPT_COORDINATES.location.y + (offsets.location?.y || 0);
    ctx.fillText(location, locX, locY);
    ctx.restore();
  }

  // 5. Contact No Line (Right-aligned dotted line after Contact prompt)
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 22px sans-serif';
  const phoneX = DEFAULT_RECEIPT_COORDINATES.phone.x + (offsets.phone?.x || 0);
  const phoneY = DEFAULT_RECEIPT_COORDINATES.phone.y + (offsets.phone?.y || 0);
  ctx.fillText(phone, phoneX, phoneY);
  ctx.restore();

  // 5b. Date of Birth (D.O.B.) if available
  if (formattedDob) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#0f1e4a';
    ctx.font = 'bold 20px sans-serif';
    const dobX = DEFAULT_RECEIPT_COORDINATES.dob.x + (offsets.dob?.x || 0);
    const dobY = DEFAULT_RECEIPT_COORDINATES.dob.y + (offsets.dob?.y || 0);
    ctx.fillText(`DOB: ${formattedDob}`, dobX, dobY);
    ctx.restore();
  }

  // 6. Sum of Rupees (In Words) Line
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 18px sans-serif';
  const wordsX = DEFAULT_RECEIPT_COORDINATES.amountWords.x + (offsets.amountWords?.x || 0);
  const wordsY = DEFAULT_RECEIPT_COORDINATES.amountWords.y + (offsets.amountWords?.y || 0);
  // If words are too long, fit them within 680px
  let wordsFont = 18;
  while (ctx.measureText(amountWords).width > 680 && wordsFont > 12) {
    wordsFont -= 1;
    ctx.font = `bold ${wordsFont}px sans-serif`;
  }
  ctx.fillText(amountWords, wordsX, wordsY);
  ctx.restore();

  // 7. Rs. Box (Vertically and horizontally centered in white amount box)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 30px sans-serif';
  const boxX = DEFAULT_RECEIPT_COORDINATES.amountBox.x + (offsets.amountBox?.x || 0);
  const boxY = DEFAULT_RECEIPT_COORDINATES.amountBox.y + (offsets.amountBox?.y || 0);
  ctx.fillText(`${amount.toLocaleString('en-IN')}/-`, boxX, boxY);
  ctx.restore();

  // 8. by Cash / Online / UTR No Line
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 17px monospace, sans-serif';
  const payX = DEFAULT_RECEIPT_COORDINATES.paymentRef.x + (offsets.paymentRef?.x || 0);
  const payY = DEFAULT_RECEIPT_COORDINATES.paymentRef.y + (offsets.paymentRef?.y || 0);
  ctx.fillText(payId, payX, payY);
  ctx.restore();

  // 9. Cheque No. & Dt. / Bank Name Line
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 18px sans-serif';
  const sevaX = DEFAULT_RECEIPT_COORDINATES.sevaDescription.x + (offsets.sevaDescription?.x || 0);
  const sevaY = DEFAULT_RECEIPT_COORDINATES.sevaDescription.y + (offsets.sevaDescription?.y || 0);
  ctx.fillText(sevaDesc, sevaX, sevaY);
  ctx.restore();
}

/**
 * Generates the filled receipt as a downloadable/shareable PNG Blob
 */
export async function generateReceipt(
  userData: UserData,
  customData?: ReceiptCustomData,
  templateUrl: string = '/receipt.png'
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderReceiptToCanvas(canvas, userData, customData, templateUrl);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create receipt PNG blob'));
    }, 'image/png');
  });
}
