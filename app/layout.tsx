import type { Metadata } from 'next';
import { Inter, Merriweather, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const merriweather = Merriweather({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-merriweather',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'BI Feasibility Study - Professional Feasibility Studies in Minutes',
  description:
    'Generate investor-ready feasibility studies with AI. Just describe your project and receive a complete, professional analysis.',
  keywords: [
    'feasibility study',
    'business plan',
    'AI',
    'startup',
    'investment',
    'financial analysis',
  ],
  authors: [{ name: 'BI Feasibility Study' }],
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'BI Feasibility Study - Professional Feasibility Studies in Minutes',
    description:
      'Generate investor-ready feasibility studies with AI. Just describe your project and receive a complete, professional analysis.',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'BI Feasibility Study',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${merriweather.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
