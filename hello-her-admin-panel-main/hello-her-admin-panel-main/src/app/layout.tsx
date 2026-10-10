import "./globals.css";
import type { Metadata } from "next";
import { Lato } from "next/font/google";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/common/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import ToastProvider from "@/components/common/ToastProvider";
import HydrationGuard from "@/components/common/HydrationGuard";

// Configure Google Font (use CSS variable only)
const lato = Lato({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lato",
  style: ["normal", "italic"],
  weight: ["100", "300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Hello Her - Admin",
  description:
    "Hello Her — where every hello begins a new story. A safe, genuine space for women and men to connect, share, and find relationships that truly matter.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={lato.variable}>
      <body className="font-sans relative antialiased">
        <AuthProvider>
          <HydrationGuard>
            <div className="flex">
              <Sidebar />
              <div className="flex-1 w-[90%] md:w-[93%] lg:w-[83%]">
                <Navbar />
                <main>{children}</main>
                <div id="modal-root"></div>
                <ToastProvider />
              </div>
            </div>
          </HydrationGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
