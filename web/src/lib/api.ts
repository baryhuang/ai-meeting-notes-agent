/**
 * Base URL for backend API calls.
 *
 * - Empty string (default): relative paths — works when frontend is served by the bot itself.
 * - Set VITE_API_BASE_URL to the bot's public URL (e.g. "https://your-bot.example.com")
 *   when the frontend is deployed separately (e.g. on InsForge hosting).
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
