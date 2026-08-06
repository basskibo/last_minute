import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poslednji Trenutak — Last minute putovanja na jednom mestu",
  description:
    "Pretraži last minute ponude smeštaja i paket aranžmana sa više sajtova odjednom — unesi destinaciju, period i broj osoba.",
};

export const viewport: Viewport = {
  themeColor: "#0b0f19",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Theme
          appearance="dark"
          accentColor="sky"
          grayColor="slate"
          radius="large"
          panelBackground="solid"
          className="min-h-full flex flex-col flex-1"
        >
          {children}
        </Theme>
      </body>
    </html>
  );
}
