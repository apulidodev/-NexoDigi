import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexoDigi",
    short_name: "NexoDigi",
    description: "El Digivice vivo de la comunidad.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e7",
    theme_color: "#fdcc48",
    icons: [{ src: "/icon.png", type: "image/png" }],
  };
}