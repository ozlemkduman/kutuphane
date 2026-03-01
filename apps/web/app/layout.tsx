import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Bir Kitap Aldım - Okul Kütüphane Yönetim Sistemi",
    template: "%s | Bir Kitap Aldım",
  },
  description:
    "Okul kütüphanelerini dijitalleştiren platform. Kitapları keşfet, ödünç al, oku. Öğrenciler ve öğretmenler için kolay kütüphane yönetimi.",
  keywords: [
    "kütüphane",
    "okul kütüphanesi",
    "kitap",
    "ödünç al",
    "dijital kütüphane",
    "kütüphane yönetim sistemi",
    "bir kitap aldım",
  ],
  authors: [{ name: "Bir Kitap Aldım" }],
  metadataBase: new URL("https://birkitapaldim.com"),
  openGraph: {
    title: "Bir Kitap Aldım - Okul Kütüphane Yönetim Sistemi",
    description:
      "Okul kütüphanelerini dijitalleştiren platform. Kitapları keşfet, ödünç al, oku.",
    url: "https://birkitapaldim.com",
    siteName: "Bir Kitap Aldım",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/logo-kitap.png",
        width: 512,
        height: 512,
        alt: "Bir Kitap Aldım Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Bir Kitap Aldım - Okul Kütüphane Yönetim Sistemi",
    description:
      "Okul kütüphanelerini dijitalleştiren platform. Kitapları keşfet, ödünç al, oku.",
    images: ["/logo-kitap.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/site.webmanifest",
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
