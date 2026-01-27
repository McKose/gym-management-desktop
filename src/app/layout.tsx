"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { GymProvider } from "@/context/GymContext";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <GymProvider>
            <div className="flex flex-col min-h-screen bg-white">
              {/* Navigation Logic */}
              {!isLoginPage && <Sidebar />}

              {/* Background Watermark */}
              <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.03] overflow-hidden">
                <h1 className="text-[12vw] font-black text-black -rotate-12 whitespace-nowrap select-none">
                  Non Stop GYM
                </h1>
              </div>

              <main className="flex-1 w-full max-w-7xl mx-auto px-8 pb-8 pt-64 relative">
                {children}
              </main>
            </div>
          </GymProvider>
        </AuthProvider>
        <div id="modal-root" />
      </body>
    </html>
  );
}
