import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryClientProvider } from "@/components/providers/QueryProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoggerInit from "@/components/LoggerInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "업무 자동화 시스템",
  description: "문서 자동화, 로그 분석, 알림 시스템을 제공하는 업무 자동화 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <LoggerInit />
        <ErrorBoundary>
          <QueryClientProvider>
            {children}
          </QueryClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

