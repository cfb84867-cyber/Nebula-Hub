import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'Nebula Hub', template: '%s | Nebula Hub' },
  description: 'Nebula Hub — Your browser-based productivity and entertainment platform. Search, play games, use tools, and more.',
  keywords: ['nebula hub', 'productivity', 'games', 'browser platform', 'entertainment'],
  authors: [{ name: 'Nebula Hub' }],
  themeColor: '#7c3aed',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    title: 'Nebula Hub',
    description: 'Your browser-based productivity and entertainment platform.',
    siteName: 'Nebula Hub',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(26, 17, 48, 0.95)',
              color: '#f1f0f5',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              backdropFilter: 'blur(12px)',
              borderRadius: '10px',
              fontSize: '0.875rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
