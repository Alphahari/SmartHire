import type { Metadata } from "next";
import './globals.css';
import ToastContainerWrapper from "@/components/ToastContainerWrapper";
import { SessionProviderWrapper } from "@/components/Auth/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "SmartHire",
  description: "SmartHire is an AI Powered interview Application which helps students prepare for interviews both technical and HR By providing Reports on performance and areas To improve.",
    icons: {
    icon: "/icon.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body>
        <SessionProviderWrapper>
          <ToastContainerWrapper/>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}