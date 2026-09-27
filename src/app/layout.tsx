import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '株ウォッチAI - 株式特化型インテリジェント情報センター',
  description: '全社適時開示、Googleニュース、財務指標、信用倍率をリアルタイム一元集約。Gemini 1.5 Flash AIが株価影響6項目・提携深掘り・意味検索を自動解析。',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  }
};

export const viewport: Viewport = {
  themeColor: '#0B0F19',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-[#0B0F19] text-gray-100 min-h-screen pb-20 md:pb-8 flex flex-col font-sans antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
