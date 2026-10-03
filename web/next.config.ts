import type { NextConfig } from "next";

/* Export statique : Render sert le dossier out/ comme aujourd'hui dist/. */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
