import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter } from "./fonts";
import { DevDatePicker } from "./components/dev-date-picker";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1e293b",
};

export const metadata: Metadata = {
  title: "Chorizo",
  description: "Track chores for kids",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chorizo",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body>
        {children}
        <DevDatePicker />
      </body>
    </html>
  );
}
