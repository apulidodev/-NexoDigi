import type { Metadata } from "next";
import { PwaRegistration } from "@/components/pwa/pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoDigi - El Digivice vivo",
  description: "Explora el Mundo Digital desde tu Digivice.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><PwaRegistration />{children}</body></html>;
}