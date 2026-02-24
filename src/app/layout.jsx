import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { LanguageProvider } from "@/context/LanguageContext";
import { ToastProvider } from "@/context/ToastContext";
import Toast from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FairShare - ကလေးများအတွက် မျှတသောအလှူငွေ ပလက်ဖောင်း",
  description: "ကလေးများဂေဟာများအတွက် မျှတသောအလှူငွေ ပလက်ဖောင်း",
};

export default function RootLayout({ children }) {
  return (
    <html lang="my">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <ToastProvider>
            <Navbar />
            {children}
            <Toast />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
