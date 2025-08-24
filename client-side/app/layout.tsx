import type { Metadata } from "next";
import './globals.css'; 

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
      <body
      >
        {children}
      </body>
    </html>
  );
}