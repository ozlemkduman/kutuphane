import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Kütüphane Yönetim Sistemi",
  description: "Kitapları keşfet, ödünç al, oku.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}>
        <a href="#main-content" className="skip-link">
          Ana içeriğe atla
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
