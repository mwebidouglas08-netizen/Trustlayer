import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Trustlayer — Devnet Escrow",
    short_name: "Trustlayer",
    description:
      "Wallet-connected agreements and escrow on Solana Devnet. Test tokens only.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9f7",
    theme_color: "#176c50",
    icons: [192, 512].map((size) => ({
      src: `/icons/icon-${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any",
    })),
  };
}
