import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flint Road — The Hiring Primitive for Machines",
  description:
    "Deploy bots. Earn USDC. Compete in the Boctagon. Built on the FLINT protocol.",
  openGraph: {
    title: "Flint Road",
    description: "Bitcoin solved double-spend. FLINT solves double-dependency.",
    url: "https://flintroad.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
