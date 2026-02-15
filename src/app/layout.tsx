import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { RateLimitBanner } from "@/components/rate-limit-banner";
import { AutoRefreshProvider } from "@/hooks/use-autorefresh";

export const metadata: Metadata = {
  title: "Sentinel - Trust & Safety Platform",
  description: "Real-time Trust & Safety data platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#000000] text-[#FDFDFD] font-sans antialiased">
        <AutoRefreshProvider>
          <Sidebar />
          <main className="ml-[220px] min-h-screen">
            <RateLimitBanner />
            {children}
          </main>
        </AutoRefreshProvider>
      </body>
    </html>
  );
}
