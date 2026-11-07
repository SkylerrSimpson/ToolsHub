import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tools.skylerrsimpson.com"),
  title: { default: "Tools by Skyler Simpson", template: "%s | Skyler’s tools" },
  description:
    "A dictionary, GitHub profile finder, to-do list and tip calculator by Skyler Simpson. Use the modern tools or explore their original versions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
