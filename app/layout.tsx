import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { APP_NAME, RIGHTS_HOLDER } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "A progressive document studio by The Palace Tech House.",
  applicationName: APP_NAME,
  authors: [{ name: RIGHTS_HOLDER }],
  creator: RIGHTS_HOLDER,
  publisher: RIGHTS_HOLDER,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1020",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
