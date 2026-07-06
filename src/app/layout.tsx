import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

// iOS launch screens: device pixel size, logical (CSS) size, and pixel ratio.
// `apple-touch-startup-image` is the only mechanism that supports
// `prefers-color-scheme`, unlike the manifest's static background_color.
interface SplashDevice {
  pixels: [number, number];
  logical: [number, number];
  ratio: number;
}

const SPLASH_DEVICES: SplashDevice[] = [
  { pixels: [1179, 2556], logical: [393, 852], ratio: 3 }, // iPhone 14 Pro / 15 / 16
  { pixels: [1290, 2796], logical: [430, 932], ratio: 3 }, // iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max
  { pixels: [1170, 2532], logical: [390, 844], ratio: 3 }, // iPhone 12 / 13 / 14
  { pixels: [1284, 2778], logical: [428, 926], ratio: 3 }, // iPhone 12/13 Pro Max, 14 Plus
  { pixels: [1125, 2436], logical: [375, 812], ratio: 3 }, // iPhone X / XS / 11 Pro / 12 mini
  { pixels: [1242, 2688], logical: [414, 896], ratio: 3 }, // iPhone XS Max / 11 Pro Max
  { pixels: [828, 1792], logical: [414, 896], ratio: 2 }, // iPhone XR / 11
  { pixels: [750, 1334], logical: [375, 667], ratio: 2 }, // iPhone SE 2/3, 8, 7, 6s
  { pixels: [1242, 2208], logical: [414, 736], ratio: 3 }, // iPhone 8 Plus / 7 Plus
];

const startupImage = SPLASH_DEVICES.flatMap(({ pixels, logical, ratio }) => {
  const [pw, ph] = pixels;
  const [lw, lh] = logical;
  const query = `(device-width: ${lw}px) and (device-height: ${lh}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`;
  return [
    {
      url: `/splash/splash-${pw}x${ph}-light.png`,
      media: `${query} and (prefers-color-scheme: light)`,
    },
    {
      url: `/splash/splash-${pw}x${ph}-dark.png`,
      media: `${query} and (prefers-color-scheme: dark)`,
    },
  ];
});

export const metadata: Metadata = {
  title: "ShowTracker",
  description: "Track watched TV series and movies, episode by episode.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "ShowTracker",
    statusBarStyle: "default",
    startupImage,
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
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
