import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://prettypiggie.com'),
  title: 'PrettyPiggie.com — Immersive 3D Virtual Makeup Boutique',
  description:
    'Explore Pretty Piggie Makeup’s mobile-first 3D virtual beauty world. Step into our blush-pink luxury showroom, inspect 360° 3D lipsticks and compacts, try live shades, and shop effortlessly.',
  openGraph: {
    title: 'PrettyPiggie.com — 3D Virtual Makeup Boutique',
    description:
      'Step inside Pretty Piggie Makeup’s futuristic blush-pink & rose-gold 3D makeup store.',
    type: 'website',
    url: 'https://prettypiggie.com',
    siteName: 'Pretty Piggie Makeup',
    images: [
      {
        url: '/design-reference/rotunda-chandelier.png',
        width: 1200,
        height: 630,
        alt: 'Pretty Piggie Makeup 3D Virtual Boutique Rotunda',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrettyPiggie.com — 3D Virtual Makeup Boutique',
    description:
      'Step inside Pretty Piggie Makeup’s futuristic blush-pink & rose-gold 3D makeup store.',
    images: ['/design-reference/rotunda-chandelier.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#F4B6CB',
};

const EXTENSION_ERROR_GUARD = `
(function() {
  if (typeof window === 'undefined') return;
  function isExtensionOrMetaMaskError(msg, stack) {
    var s = String(msg || '') + ' ' + String(stack || '');
    return (
      s.indexOf('Failed to connect to MetaMask') !== -1 ||
      s.indexOf('chrome-extension://') !== -1 ||
      s.indexOf('moz-extension://') !== -1 ||
      s.indexOf('nkbihfbeogaeaoehlefnkodbefgpgknn') !== -1
    );
  }
  window.addEventListener(
    'error',
    function(event) {
      var msg = event && (event.message || (event.error && event.error.message));
      var stack = event && (event.filename || (event.error && event.error.stack));
      if (isExtensionOrMetaMaskError(msg, stack)) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    },
    true
  );
  window.addEventListener(
    'unhandledrejection',
    function(event) {
      var reason = event && event.reason;
      var msg = reason && (reason.message || String(reason));
      var stack = reason && reason.stack;
      if (isExtensionOrMetaMaskError(msg, stack)) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    },
    true
  );
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: EXTENSION_ERROR_GUARD }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
