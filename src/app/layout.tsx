import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HR Portal MMTI | DHQ Teaching Hospital D.I. Khan",
    template: "%s | HR Portal MMTI",
  },
  description:
    "HR Portal MMTI — Official Staff Recruitment, Verification, and Quota Ledger System for DHQ Teaching Hospital D.I. Khan | Government of Khyber Pakhtunkhwa",
  applicationName: "HR Portal MMTI",
  keywords: ["MMTI", "DHQ Hospital", "HR Portal", "Dera Ismail Khan", "Khyber Pakhtunkhwa"],
};

export const viewport: Viewport = {
  themeColor: "#046a38",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <body className="antialiased min-h-screen bg-[#f7f8f6] text-slate-900 font-sans selection:bg-emerald-700 selection:text-white">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: "font-sans text-sm",
          }}
        />
      </body>
    </html>
  );
}
