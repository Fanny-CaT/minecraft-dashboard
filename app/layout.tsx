import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeowTopia — Minecraft Control Panel",
  description:
    "Private server control panel for MeowTopia — manage your Minecraft server, players, plugins, and files from one place.",
  applicationName: "MeowTopia Panel",
  authors: [{ name: "MeowTopia" }],
  keywords: ["Minecraft", "server", "control panel", "PufferPanel", "MeowTopia"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/meow_icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "MeowTopia Panel",
    title: "MeowTopia — Minecraft Control Panel",
    description:
      "Private server control panel for MeowTopia. Monitor CPU, RAM, players, plugins and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MeowTopia Minecraft Control Panel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MeowTopia — Minecraft Control Panel",
    description: "Private Minecraft server control panel.",
    images: ["/og-image.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "100%", backgroundColor: "#1a1a1a" }}>
      <body style={{ margin: 0, padding: 0, height: "100%", backgroundColor: "#1a1a1a" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
