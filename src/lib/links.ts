/** Extracts the 11-character video id from common YouTube URL shapes, or null. */
export function parseYouTubeId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const match = url.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/);
      id = match?.[2] ?? null;
    }
  }

  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/** True for https://github.com/<owner>[/<repo>...] URLs. */
export function isGitHubUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.replace(/^www\./, "");
    return url.protocol === "https:" && host === "github.com" && url.pathname.split("/").filter(Boolean).length >= 1;
  } catch {
    return false;
  }
}

/** True for Discord invite links (discord.gg/<code> or discord.com/invite/<code>). */
export function isDiscordInviteUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (url.protocol !== "https:") return false;
    if (host === "discord.gg") return url.pathname.length > 1;
    if (host === "discord.com" || host === "discordapp.com") return /^\/invite\/[^/]+/.test(url.pathname);
    return false;
  } catch {
    return false;
  }
}
