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
  const crimsonGrad = ctx.createLinearGradient(0, 60, 0, 180);
  crimsonGrad.addColorStop(0, '#981B30');
  crimsonGrad.addColorStop(1, '#6F0D1E');
  ctx.fillStyle = crimsonGrad;
  ctx.beginPath();
  ctx.roundRect(60, 65, width - 120, 110, 20);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Header Text
  ctx.fillStyle = '#FFEBBA';
  ctx.font = 'bold 24px "Cinzel", "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText("TRANG & ALFREDO'S WEDDING", width / 2, 110);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px "Cinzel", "Times New Roman", serif';
  ctx.fillText(
    data.lang === 'en'
      ? '★ OFFICIAL VIP BANQUET PASS ★'
      : '★ THẺ THAM DỰ DẠ TIỆC THÀNH HÔN ★',
    width / 2,
    145
  );

  // 5. Date & Time Ribbon
  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 16px "Times New Roman", serif';
  ctx.fillText(
    data.lang === 'en'
      ? 'SATURDAY, DECEMBER 12, 2026 • 5:30 PM RECEPTION'
      : 'THỨ BẢY, 12 THÁNG 12 NĂM 2026 • 17:30 ĐÓN KHÁCH',
    width / 2,
    215
  );

  // 6. Ticket Perforated Notches (Left & Right Cutouts)
  const notchY = 245;
  ctx.save();
  ctx.beginPath();
  ctx.arc(24, notchY, 18, -Math.PI / 2, Math.PI / 2);
  ctx.arc(width - 24, notchY, 18, Math.PI / 2, (Math.PI * 3) / 2);
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

  // 7. Guest Name & Seating Details Card
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(60, 275, width - 120, 310, 24);
  ctx.fill();
  ctx.strokeStyle = '#E5D6B5';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Invitation Code Monospace Badge
  ctx.fillStyle = '#FDF6E2';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 100, 295, 200, 34, 10);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`CODE: ${data.invitationCode}`, width / 2, 318);

  // Guest Name
  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 36px "Times New Roman", Georgia, serif';
  ctx.fillText(data.primaryName, width / 2, 375);

  // Confirmed Headcount Pill
  ctx.fillStyle = '#ECFDF5';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 150, 400, 300, 38, 12);
  ctx.fill();
  ctx.strokeStyle = '#6EE7B7';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 16px "Times New Roman", sans-serif';
  ctx.fillText(
    data.lang === 'en'
      ? `✓ ${data.attendingCount} Guest${data.attendingCount > 1 ? 's' : ''} Confirmed Attending`
      : `✓ ${data.attendingCount} Khách Xác Nhận Tham Dự`,
    width / 2,
    425
  );

  // Attending Names List
  if (data.attendingGuestNames && data.attendingGuestNames.length > 0) {
    ctx.fillStyle = '#57534E';
    ctx.font = 'italic 14px "Times New Roman", sans-serif';
    const namesStr = data.attendingGuestNames.slice(0, 4).join(' • ');
    ctx.fillText(namesStr, width / 2, 465);
  }

  // Venue & Program
  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
  ctx.fillText('Grand Harbor Restaurant • 8-Course Banquet Feast', width / 2, 510);

  ctx.fillStyle = '#78716C';
  ctx.font = '13px sans-serif';
  ctx.fillText('5733 Rosemead Blvd., Temple City, CA 91780', width / 2, 535);

  ctx.fillStyle = '#991B1B';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Hosted Bar & Cocktails • Traditional Chào Bàn • Hora Loca', width / 2, 560);

  // 8. QR Code Section (for reception check-in)
  const qrUrl = `https://wedding.au-tomato.com/rsvp?invite=${encodeURIComponent(data.invitationCode)}`;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, qrUrl, {
    width: 280,
    margin: 1,
    color: {
      dark: '#6F0D1E', // Deep royal crimson modules
      light: '#FFFFFF'
    }
  });

  // White rounded backing box for QR
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 160, 615, 320, 360, 24);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw QR code onto main canvas
  ctx.drawImage(qrCanvas, width / 2 - 140, 635, 280, 280);

  // Scan instruction
  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(
    data.lang === 'en'
      ? '★ Present this QR Code at Reception Check-in ★'
      : '★ Vui lòng xuất trình mã QR này tại quầy đón khách ★',
    width / 2,
    945
  );

  // 9. DJ Song Request (if provided)
  if (data.djSongTitle) {
    ctx.fillStyle = '#FEF2F2';
    ctx.beginPath();
    ctx.roundRect(80, 995, width - 160, 44, 12);
    ctx.fill();
    ctx.strokeStyle = '#FECACA';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#991B1B';
    ctx.font = 'bold 13px "Times New Roman", sans-serif';
    ctx.fillText(`♫ Requested DJ Track: "${data.djSongTitle}"`, width / 2, 1022);
  }

  // 10. Footer Signoff
  ctx.fillStyle = '#92400E';
  ctx.font = 'italic 15px "Times New Roman", Georgia, serif';
  ctx.fillText('With all our love & gratitude, Trang & Alfredo', width / 2, 1080);

  ctx.fillStyle = '#A8A29E';
  ctx.font = '11px monospace';
  ctx.fillText('DECEMBER 12, 2026 • TEMPLE CITY, CALIFORNIA', width / 2, 1115);

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
