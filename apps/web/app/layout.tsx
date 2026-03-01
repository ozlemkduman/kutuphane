import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Bir Kitap Aldım",
  description: "Kitapları keşfet, ödünç al, oku.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head />
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}>
        {process.env.NEXT_PUBLIC_API_URL?.includes('staging') && (
          <div style={{ background: '#f59e0b', color: '#000', textAlign: 'center', padding: '4px', fontSize: '13px', fontWeight: 600 }}>
            STAGING ORTAMI - Test amaçlıdır
          </div>
        )}
        <a href="#main-content" className="skip-link">
          Ana içeriğe atla
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
