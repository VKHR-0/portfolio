import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portfolio",
    short_name: "Portfolio",
    description: "My Portfolio",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#f4f4f5",
    icons: [
      {
        type: "image/png",
        sizes: "32x32",
        src: "/favicon-32x32.png",
      },
      {
        type: "image/png",
        sizes: "16x16",
        src: "/favicon-16x16.png",
      },
      {
        sizes: "180x180",
        src: "/apple-touch-icon.png",
      },
    ],
  };
}
