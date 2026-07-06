import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShowTracker",
  description: "Track watched TV series and movies, episode by episode.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "ShowTracker",
    statusBarStyle: "default",
  },
  // Next.js emits the standardized `mobile-web-app-capable`; older iOS Safari
  // still relies on the Apple-prefixed tag for standalone launch.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
