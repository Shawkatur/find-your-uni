import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Find Your University",
  description: "Smart university matching for Bangladeshi students. Get ranked results based on your grades, scores, and budget — and apply in one place.",
  metadataBase: new URL("https://findyouruni.com"),
  openGraph: {
    title: "Find Your University",
    description: "Smart university matching for Bangladeshi students. Get ranked results and apply — all in one place.",
    siteName: "Find Your Uni",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your University",
    description: "Smart university matching for Bangladeshi students.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body className={`${plusJakarta.variable} antialiased bg-[#F8F9FA] text-[#333]`}>
        {children}
        <Toaster position="top-right" theme="light" richColors />
      </body>
    </html>
  );
}
