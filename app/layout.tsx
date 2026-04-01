import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.adamspalletplus.ca"),
  title: {
    default: "Adams Pallet Plus Inc.",
    template: "%s | Adams Pallet Plus Inc.",
  },
  description:
    "Industrial pallet tracking and logistics management for transfers, reporting, audit logs, backups, and administration.",
  applicationName: "Adams Pallet Plus Portal",
  keywords: [
    "Adams Pallet Plus",
    "pallet tracking",
    "pallet transfers",
    "logistics",
    "industrial pallet management",
    "Kingsville Ontario",
  ],
  authors: [{ name: "Adams Pallet Plus Inc." }],
  creator: "Adams Pallet Plus Inc.",
  publisher: "Adams Pallet Plus Inc.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Adams Pallet Plus Inc.",
    description:
      "Industrial pallet tracking and logistics management for transfers, reporting, audit logs, backups, and administration.",
    url: "https://www.adamspalletplus.ca",
    siteName: "Adams Pallet Plus Inc.",
    locale: "en_CA",
    type: "website",
    images: [
      {
        url: "/adams-logo.png",
        width: 1200,
        height: 1200,
        alt: "Adams Pallet Plus Inc. logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adams Pallet Plus Inc.",
    description:
      "Industrial pallet tracking and logistics management for transfers, reporting, audit logs, backups, and administration.",
    images: ["/adams-logo.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
