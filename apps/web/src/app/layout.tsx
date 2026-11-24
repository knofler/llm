import type { Metadata, Viewport } from "next";
import { Andika, Fredoka, JetBrains_Mono, Newsreader, Space_Grotesk } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { TopBar } from "@/components/top-bar";
import { VERSION_LABEL } from "@/lib/version";
import { TrackProvider, TrackSurface } from "@/lib/track";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const andika = Andika({ variable: "--font-andika", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "llm · build a language model by hand",
  description: "Build the smallest working language model, one piece at a time. Plain words first, real names once you've earned them.",
  applicationName: "llm",
  appleWebApp: { capable: true, title: "llm", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0b0b0a", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${newsreader.variable} ${jetbrains.variable} ${fredoka.variable} ${andika.variable}`}>
      <body>
        <TrackProvider>
          <TrackSurface>
            <TopBar />
            {children}
          </TrackSurface>
        </TrackProvider>
        <footer className="px-4 py-3 text-center font-mono text-[11px] text-a-cap/70">{VERSION_LABEL}</footer>
        <PwaRegister />
      </body>
    </html>
  );
}
