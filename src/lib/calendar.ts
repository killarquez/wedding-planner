/**
 * Helper to generate an .ics iCalendar file string for the wedding event
 */
export function generateWeddingIcsFile(guestName?: string): string {
  const title = "Trang & Alfredo's Wedding Celebration";
  const description = `We said 'I do,' now let's celebrate!\nWe're so excited to welcome you to our wedding celebration! Join us for an intimate, joy-filled evening with family and friends, featuring a delicious multi-course banquet, heartfelt toasts, music, and lasting memories.\nGuest: ${guestName || 'Valued Guest'}\nDress Code: Traditional Áo Dài, Festive Glam, or Semi-Formal.\nDrinks & Bar are hosted by the couple!`;
  const location = "Grand Harbor Restaurant, 5733 Rosemead Blvd., Temple City, CA 91780";
  
  // Dec 5, 2026 17:30:00 PST (UTC-8) -> 20261206T013000Z
  // End Dec 5, 2026 23:30:00 PST -> 20261206T073000Z
  const startTimeUtc = "20261206T013000Z";
  const endTimeUtc = "20261206T073000Z";
  const uid = `wedding-trang-alfredo-20261205-${Date.now()}@weddingplanner.local`;
  const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trang & Alfredo Wedding Operations//Wedding Celebration 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startTimeUtc}`,
    `DTEND:${endTimeUtc}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Trang & Alfredo's Wedding Celebration tomorrow!",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Trang & Alfredo's Wedding starts in 2 hours at Grand Harbor Restaurant!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

export function downloadIcsFile(guestName?: string) {
  if (typeof window === 'undefined') return;
  const icsData = generateWeddingIcsFile(guestName);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Trang_Alfredo_Wedding_Dec_5_2026.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
