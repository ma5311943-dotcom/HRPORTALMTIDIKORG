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
    default: "Internal HR System | Constituency Human Resources & Analytics System",
    template: "%s | Internal HR System",
  },
  description:
    "Official National Candidate Registry, District Seat Allocation, and Regional Employment Analytics Portal | Government of Pakistan",
  applicationName: "Internal HR System",
  keywords: ["Pakistan", "Constituency", "Human Resources", "Government", "Internal HR System"],
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
