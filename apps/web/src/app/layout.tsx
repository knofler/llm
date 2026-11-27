import type { Metadata, Viewport } from "next";
import { Andika, Fredoka, JetBrains_Mono, Newsreader, Space_Grotesk } from "next/font/google";
import { auth0Enabled, getOptionalSession } from "@/auth";
import { PwaRegister } from "@/components/pwa-register";
import { TopBar } from "@/components/top-bar";
import { VERSION_LABEL } from "@/lib/version";
import { TrackProvider, TrackSurface } from "@/lib/track";
import "./globals.css";

export const dynamic = "force-dynamic";

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const andika = Andika({ variable: "--font-andika", subsets: ["latin"], weight: ["400", "700"] });

const SITE_URL = "https://llm.bluegreyboxes.com";
const SITE_TITLE = "llm · build a language model by hand";
const SITE_DESCRIPTION =
  "Build the smallest working language model, one piece at a time. Plain words first, real names once you've earned them.";

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "llm",
  url: SITE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  description: SITE_DESCRIPTION,
  image: `${SITE_URL}/opengraph-image`,
  publisher: {
    "@type": "Organization",
    name: "Blue Grey Boxes",
    url: "https://bluegreyboxes.com",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · llm",
  },
  description: SITE_DESCRIPTION,
  applicationName: "llm",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "/",
    siteName: "llm",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, title: "llm", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0b0b0a", viewportFit: "cover" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const authEnabled = auth0Enabled();
  const session = authEnabled ? await getOptionalSession() : null;
  const userLabel = session?.user?.name ?? session?.user?.email ?? null;

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${newsreader.variable} ${jetbrains.variable} ${fredoka.variable} ${andika.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body>
        <TrackProvider>
          <TrackSurface>
            <TopBar authEnabled={authEnabled} userLabel={userLabel} />
            {children}
          </TrackSurface>
        </TrackProvider>
        <footer className="px-4 py-3 text-center font-mono text-[11px] text-a-cap/70">{VERSION_LABEL}</footer>
        <PwaRegister />
      </body>
    </html>
  );
}
