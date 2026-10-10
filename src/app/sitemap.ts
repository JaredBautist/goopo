import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticPaths = [
    "",
    "/competencias",
    "/ranking",
    "/reglas",
    "/juego-responsable",
    "/acerca",
    "/ingresar",
    "/registro",
  ];
  return staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: p === "" || p === "/competencias" ? "hourly" : "monthly",
    priority: p === "" ? 1 : p === "/competencias" ? 0.9 : 0.5,
  }));
}
