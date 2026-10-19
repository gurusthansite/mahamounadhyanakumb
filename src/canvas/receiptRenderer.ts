import type { UserData } from '../types/poster';

export const RECEIPT_WIDTH = 1280;
export const RECEIPT_HEIGHT = 853;

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

  const plates = parseInt(userData.plates || '1', 10) || 1;
  const amount = plates * 51;
  const amountWords = `${numToWords(amount)} (${plates} ${plates === 1 ? 'Plate' : 'Plates'})`;

  // Determine receipt date
  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, '0');
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const yearStr = String(now.getFullYear());

  // Deterministic or stored Receipt Number
  const receiptNo =
    userData.receiptNo ||
    `MK-${dayStr}${monthStr}-${(userData.paymentId || '108').slice(-4).toUpperCase()}`;

  // 1. Receipt No Box
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 24px monospace, sans-serif';
  ctx.fillText(receiptNo, 244, 308);
  ctx.restore();

  // 2. Date Box (DD / MM / YYYY)
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(dayStr, 1045, 300);
  ctx.fillText(monthStr, 1108, 300);
  ctx.fillText(yearStr, 1170, 300);
  ctx.restore();

  // 3. Donor Name Line
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 24px "Noto Sans Telugu", "Noto Sans", sans-serif';
  const prefix = userData.titlePrefix ? `${userData.titlePrefix} ` : '';
  const donorName = `${prefix}${userData.fullName || 'Devotee'}`.trim();
  ctx.fillText(donorName, 395, 320);
  ctx.restore();

  // 4. Contact No Line
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 22px sans-serif';
  const phone = userData.phoneNumber ? `+91 ${userData.phoneNumber.replace(/\D/g, '')}` : '—';
  ctx.fillText(phone, 725, 360);
  ctx.restore();

  // 5. Sum of Rupees (In Words) Line
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 18px sans-serif';
  // If words are too long, fit them within 700px
  let wordsFont = 18;
  while (ctx.measureText(amountWords).width > 700 && wordsFont > 12) {
    wordsFont -= 1;
    ctx.font = `bold ${wordsFont}px sans-serif`;
  }
  ctx.fillText(amountWords, 275, 402);
  ctx.restore();

  // 6. Rs. Box (Centered in white amount box)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`${amount.toLocaleString('en-IN')}/-`, 1150, 416);
  ctx.restore();

  // 7. by Cash / Online / UTR No Line
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 18px monospace, sans-serif';
  const payId = userData.paymentId ? `Online / ${userData.paymentId}` : 'Online Payment';
  ctx.fillText(payId, 272, 442);
  ctx.restore();

  // 8. Cheque No. & Dt. / Bank Name Line
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f1e4a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`Arunachalam Seva (${plates} Plates)`, 810, 442);
  ctx.restore();
}

/**
 * Generates the filled receipt as a downloadable/shareable PNG Blob
 */
export async function generateReceipt(
  userData: UserData,
  templateUrl: string = '/receipt.png'
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderReceiptToCanvas(canvas, userData, templateUrl);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create receipt PNG blob'));
    }, 'image/png');
  });
}
