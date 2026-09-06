import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Konvert",
    short_name: "Konvert",
    description: "Do pedido ao lucro.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#176BFF",
    icons: [
      { src: "/icons/konvert-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/konvert-app-icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/konvert-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
