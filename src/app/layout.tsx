import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import { MusicPlayerWidget } from '@/components/public/MusicPlayerWidget';

export const metadata: Metadata = {
  title: "Trang & Alfredo's Wedding Celebration | Dec 12, 2026",
  description: "Official Guest Portal & Wedding Operations Platform for Trang & Alfredo's Wedding Celebration.",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>囍</text></svg>'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#faf8f5] text-stone-900 selection:bg-crimson-100 selection:text-crimson-900">
        <LanguageProvider>
          {children}
          <MusicPlayerWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
