import type { NextConfig } from "next";

/* Export statique : Render sert le dossier out/ (copié dans dist/). */
const nextConfig: NextConfig = {
  output: "export",
  /* version de l'app, jointe aux erreurs signalées (lib/mesure.ts) */
  env: { NEXT_PUBLIC_VERSION: (process.env.RENDER_GIT_COMMIT || "dev").slice(0, 8) },
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
