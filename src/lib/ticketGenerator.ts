'use client';

import QRCode from 'qrcode';

export interface TicketData {
  primaryName: string;
  partyName?: string;
  invitationCode: string;
  attendingCount: number;
  attendingGuestNames: string[];
  djSongTitle?: string;
  lang: 'en' | 'vi';
}

/**
 * Generates a high-resolution luxury digital banquet ticket canvas
 */
export async function generateTicketCanvas(data: TicketData): Promise<HTMLCanvasElement> {
  const width = 800;
  const height = 1200;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Enable high-quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Background Parchment
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#FFFDF8');
  bgGrad.addColorStop(0.5, '#FAF5E8');
  bgGrad.addColorStop(1, '#F3EAD5');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Luxury Outer Double Border
  ctx.strokeStyle = '#C59A3F';
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  ctx.strokeStyle = '#E7C878';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  // 3. Gold Corner Flourish Accents
  const drawCorner = (x: number, y: number, scaleX: number, scaleY: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, scaleY);
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(0, 0);
    ctx.lineTo(40, 0);
    ctx.moveTo(8, 30);
    ctx.lineTo(8, 8);
    ctx.lineTo(30, 8);
    ctx.stroke();

    // Little gold diamond
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(14, 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCorner(44, 44, 1, 1);
  drawCorner(width - 44, 44, -1, 1);
  drawCorner(44, height - 44, 1, -1);
  drawCorner(width - 44, height - 44, -1, -1);

  // 4. Header Seal / Crimson Ribbon
  const crimsonGrad = ctx.createLinearGradient(0, 50, 0, 160);
  crimsonGrad.addColorStop(0, '#981B30');
  crimsonGrad.addColorStop(1, '#6F0D1E');
  ctx.fillStyle = crimsonGrad;
  ctx.beginPath();
  ctx.roundRect(60, 55, width - 120, 95, 20);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Header Text: Clean Couple Wedding Header
  ctx.fillStyle = '#FFEBBA';
  ctx.font = 'bold 28px "Cinzel", "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText("TRANG & ALFREDO'S WEDDING", width / 2, 96);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px "Cinzel", "Times New Roman", serif';
  ctx.fillText(
    data.lang === 'en'
      ? 'SATURDAY, DECEMBER 12, 2026 • TEMPLE CITY, CA'
      : 'THỨ BẢY, 12 THÁNG 12 NĂM 2026 • TEMPLE CITY, CA',
    width / 2,
    128
  );

  // 5. Ticket Perforated Notches (Left & Right Cutouts)
  const notchY = 175;
  ctx.save();
  ctx.beginPath();
  ctx.arc(24, notchY, 16, -Math.PI / 2, Math.PI / 2);
  ctx.arc(width - 24, notchY, 16, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.fillStyle = '#EBE3CF';
  ctx.fill();
  ctx.restore();

  // Dotted perforated line
  ctx.save();
  ctx.strokeStyle = '#C59A3F';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(50, notchY);
  ctx.lineTo(width - 50, notchY);
  ctx.stroke();
  ctx.restore();

  // 6. Guest Name & Seating Details Card
  const cardY = 202;
  const cardHeight = 432;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(60, cardY, width - 120, cardHeight, 24);
  ctx.fill();
  ctx.strokeStyle = '#E5D6B5';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Invitation Code Monospace Badge
  ctx.fillStyle = '#FDF6E2';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 110, cardY + 18, 220, 32, 10);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`CODE: ${data.invitationCode}`, width / 2, cardY + 39);

  // Primary Guest / Party Name
  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 34px "Times New Roman", Georgia, serif';
  ctx.fillText(data.primaryName, width / 2, cardY + 90);

  // Confirmed Headcount Pill
  ctx.fillStyle = '#ECFDF5';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 160, cardY + 108, 320, 32, 10);
  ctx.fill();
  ctx.strokeStyle = '#6EE7B7';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 15px "Times New Roman", sans-serif';
  ctx.fillText(
    data.lang === 'en'
      ? `✓ ${data.attendingCount} Guest${data.attendingCount > 1 ? 's' : ''} Confirmed Attending`
      : `✓ ${data.attendingCount} Khách Xác Nhận Tham Dự`,
    width / 2,
    cardY + 129
  );

  // 7. Attending Names Roster (Dedicated Real Estate for All Names)
  const names = data.attendingGuestNames && data.attendingGuestNames.length > 0
    ? data.attendingGuestNames
    : [data.primaryName];

  const colCount = names.length > 2 ? 2 : 1;
  const badgeHeight = 28;
  const badgeGap = 6;
  const namesStartY = cardY + 158;

  // Render names in 1 or 2 clean columns
  names.slice(0, 8).forEach((name, i) => {
    let bx: number;
    let bw: number;
    let by: number;

    if (colCount === 1) {
      bw = Math.min(380, width - 200);
      bx = (width - bw) / 2;
      by = namesStartY + i * (badgeHeight + badgeGap);
    } else {
      const col = i % 2;
      const row = Math.floor(i / 2);
      bw = 300;
      const totalW = bw * 2 + 16;
      const leftX = (width - totalW) / 2;
      bx = leftX + col * (bw + 16);
      by = namesStartY + row * (badgeHeight + badgeGap);
    }

    ctx.fillStyle = '#FAF6EE';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, badgeHeight, 8);
    ctx.fill();
    ctx.strokeStyle = '#D9C59B';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#292524';
    ctx.font = 'bold 14px "Times New Roman", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, bx + bw / 2, by + 19);
  });

  // Venue & Time (Simplified & Clean)
  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 17px "Times New Roman", Georgia, serif';
  ctx.fillText('Grand Harbor Restaurant', width / 2, cardY + cardHeight - 42);

  ctx.fillStyle = '#78716C';
  ctx.font = '13px sans-serif';
  ctx.fillText('5733 Rosemead Blvd., Temple City, CA 91780 • 5:30 PM', width / 2, cardY + cardHeight - 20);

  // 8. QR Code Section (for reception check-in)
  const qrUrl = `https://wedding.au-tomato.com/rsvp?invite=${encodeURIComponent(data.invitationCode)}`;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, qrUrl, {
    width: 270,
    margin: 1,
    color: {
      dark: '#6F0D1E', // Royal Crimson modules
      light: '#FFFFFF'
    }
  });

  // White rounded backing box for QR
  const qrBoxY = 654;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 160, qrBoxY, 320, 365, 24);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw QR code onto main canvas
  ctx.drawImage(qrCanvas, width / 2 - 135, qrBoxY + 22, 270, 270);

  // Scan instruction
  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(
    data.lang === 'en'
      ? '★ Present this QR Code at Reception Check-in ★'
      : '★ Vui lòng xuất trình mã QR này tại quầy đón khách ★',
    width / 2,
    qrBoxY + 330
  );

  // 9. Footer Signoff
  ctx.fillStyle = '#92400E';
  ctx.font = 'italic 16px "Times New Roman", Georgia, serif';
  ctx.fillText('With all our love & gratitude, Trang & Alfredo', width / 2, 1065);

  ctx.fillStyle = '#A8A29E';
  ctx.font = '11px monospace';
  ctx.fillText('DECEMBER 12, 2026 • TEMPLE CITY, CALIFORNIA', width / 2, 1098);

  return canvas;
}

/**
 * Triggers saving the ticket to the user's Photos / Camera Roll
 * Uses Web Share API if supported (iPhone / Android native save to camera roll),
 * with automatic fallback to direct PNG download.
 */
export async function saveTicketToPhotos(data: TicketData): Promise<{ success: boolean; method: 'shared' | 'downloaded' }> {
  try {
    const canvas = await generateTicketCanvas(data);
    const fileName = `Trang_Alfredo_Wedding_Pass_${data.invitationCode}.png`;

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve({ success: false, method: 'downloaded' });
          return;
        }

        const file = new File([blob], fileName, { type: 'image/png' });

        // 1. Try Native Mobile Share Sheet (iOS Safari & Android Chrome -> "Save Image" to Photos!)
        if (
          typeof navigator !== 'undefined' &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: "Trang & Alfredo's Wedding Banquet Pass",
              text: `VIP Wedding Pass for ${data.primaryName} • Saturday, Dec 12, 2026`
            });
            resolve({ success: true, method: 'shared' });
            return;
          } catch (shareErr: any) {
            // If user simply closed the share sheet, treat as success or fall back
            if (shareErr.name === 'AbortError') {
              resolve({ success: true, method: 'shared' });
              return;
            }
          }
        }

        // 2. Direct PNG Download Fallback (Desktop & non-sharing mobile browsers)
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve({ success: true, method: 'downloaded' });
      }, 'image/png');
    });
  } catch (e) {
    console.error('Failed to save ticket image:', e);
    return { success: false, method: 'downloaded' };
  }
}
