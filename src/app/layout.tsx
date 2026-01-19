import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import "./gov/tokens.css";
import "./gov/styles.css";
import "./gov/layout.css";
import "./gov/components.css";
import "./gov/templates/styles.css";
import "./gov/templates/tokens.css";
import Header from "@/components/Header";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Musíme si pomáhat",
  description: "Musíme si pomáhat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" data-theme="light">
      <body
        className={`${roboto.className} antialiased relative flex flex-col justify-between items-center min-h-screen w-screen overflow-x-hidden`}
      >
        <Header></Header>
        {children}
      </body>
    </html>
  );
}
