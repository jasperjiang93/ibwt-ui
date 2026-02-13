import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the IBWT team. Questions, partnerships, or feedback.",
  openGraph: {
    title: "Contact",
    description:
      "Get in touch with the IBWT team. Questions, partnerships, or feedback.",
    url: "https://www.inbotwetrust.com/contact",
    siteName: "IBWT",
    images: [
      {
        url: "https://www.inbotwetrust.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact",
    description:
      "Get in touch with the IBWT team. Questions, partnerships, or feedback.",
    images: ["https://www.inbotwetrust.com/og-image.png"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
