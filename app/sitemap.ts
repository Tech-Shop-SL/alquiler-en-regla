import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/demo", "/legal/aviso-legal", "/legal/privacidad", "/legal/condiciones"].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/demo" ? 0.8 : 0.3,
  }));
}
