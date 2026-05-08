import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
import "./globals.css";

const lato = Lato({
  weight: ["400", "700"],
  variable: "--font-lato",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  weight: ["700", "800"],
  variable: "--font-reward",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Referidos Sointem",
  description: "Formulario de registro de prospectos para Sointem",
  icons: {
    icon: "/apple-icon.png",
    shortcut: "/apple-icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${lato.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
