import type { Metadata } from "next";
import './globals.css';
import ToastContainerWrapper from "@/components/ToastContainerWrapper";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "SmartHire",
  description: "SmartHire is an AI Powered interview Application which helps students prepare for interviews both technical and HR By providing Reports on performance and areas To improve.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <ToastContainerWrapper/>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}