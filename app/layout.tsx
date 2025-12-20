import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chosen — decide faster",
  description: "Create swipeable boards to get quick feedback. Let your audience help you choose the best option.",
  openGraph: {
    title: "Chosen — decide faster",
    description: "Create swipeable boards to get quick feedback. Let your audience help you choose the best option.",
    type: "website",
    siteName: "Chosen",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chosen — decide faster",
    description: "Create swipeable boards to get quick feedback. Let your audience help you choose the best option.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

