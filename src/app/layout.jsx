import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

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
  description: "ကလေးများခိုလှုံရာအိမ်များအတွက် မျှတသောအလှူငွေ ပလက်ဖောင်း",
};

export default function RootLayout({ children }) {
  return (
    <html lang="my">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
