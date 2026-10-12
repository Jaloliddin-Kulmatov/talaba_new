/**
 * Deployment-dependent settings, in one place.
 *
 * API_BASE
 *   - NEXT_PUBLIC_API_URL set  → call the backend directly (needs CORS: FRONTEND_URL on the backend).
 *   - unset, production build  → "/api" on the same origin; next.config.mjs proxies it to BACKEND_URL
 *     (no CORS, works on every Vercel preview URL).
 *   - unset, development       → the local Flask server.
 * SITE_URL is the canonical public origin (sitemap, robots, Open Graph, JSON-LD).
 */
const rawApi = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE = (
  rawApi || (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5001/api")
).replace(/\/+$/, "");

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://talaba.uz").replace(/\/+$/, "");
