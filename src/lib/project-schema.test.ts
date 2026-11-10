import { describe, expect, it } from "vitest";
import { projectInputSchema, siteSettingsSchema } from "./project-schema";
import { parseYouTubeId } from "./links";

const valid = {
  title: "Line-following robot",
  short_description: "A small robot that follows a track.",
  full_description: "Details here.",
  image_path: "abc.jpg",
};

describe("project form rules", () => {
  it("requires a title, short description, full description and cover image", () => {
    const result = projectInputSchema.safeParse({ title: "", short_description: "", full_description: "", image_path: "" });
    expect(result.success).toBe(false);
    const fields = result.success ? [] : result.error.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["title", "short_description", "full_description", "image_path"]));
  });

  it("treats YouTube and GitHub links as optional", () => {
    const result = projectInputSchema.parse({ ...valid, youtube_url: "", github_url: "" });
    expect(result.youtube_url).toBeNull();
    expect(result.github_url).toBeNull();
  });

  it("rejects a non-GitHub repository link", () => {
    expect(projectInputSchema.safeParse({ ...valid, github_url: "https://gitlab.com/x/y" }).success).toBe(false);
  });

  it("rejects a non-YouTube video link", () => {
    expect(projectInputSchema.safeParse({ ...valid, youtube_url: "https://vimeo.com/123" }).success).toBe(false);
  });

  it("reads the video id from youtu.be and watch links", () => {
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("dQw4w9WgXcQ");
  });

  it("only accepts Discord invite links for the Discord button", () => {
    expect(siteSettingsSchema.safeParse({ discord_url: "https://discord.gg/abc123" }).success).toBe(true);
    expect(siteSettingsSchema.safeParse({ discord_url: "https://example.com/abc" }).success).toBe(false);
  });
});
