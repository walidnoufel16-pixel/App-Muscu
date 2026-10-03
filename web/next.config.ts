import type { NextConfig } from "next";

/* Export statique : Render sert le dossier out/ (copié dans dist/). */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  /* React Compiler : mémoïsation automatique des composants (tableau des
     séries, schéma du corps…), sans useMemo / useCallback à la main. */
  reactCompiler: true,
  /* Liens et router.push vérifiés au build : un écran qui n'existe pas
     devient une erreur de compilation. */
  typedRoutes: true,
  experimental: {
    /* Phosphor exporte des milliers d'icônes : on n'embarque que celles utilisées. */
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;
