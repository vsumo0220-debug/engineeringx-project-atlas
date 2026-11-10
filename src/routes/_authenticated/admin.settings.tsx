import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSiteSettings } from "@/lib/projects.functions";
import { siteSettingsSchema } from "@/lib/project-schema";
import { siteSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data, isLoading } = useQuery(siteSettingsQuery());
  const save = useServerFn(updateSiteSettings);
  const queryClient = useQueryClient();
  const [discordUrl, setDiscordUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setDiscordUrl(data.discord_url);
  }, [data]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = siteSettingsSchema.safeParse({ discord_url: discordUrl });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid link");
      return;
    }
    setSaving(true);
    try {
      await save({ data: parsed.data });
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="eyebrow text-signal">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Website settings</h1>
      </div>
      <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-md border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="discord">Discord invitation URL</Label>
          <Input
            id="discord"
            type="url"
            placeholder="https://discord.gg/your-invite"
            value={discordUrl}
            disabled={isLoading}
            onChange={(e) => setDiscordUrl(e.target.value)}
          />
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Used by every “Join Our Discord” button on the website.</p>
          )}
        </div>
        <Button type="submit" disabled={saving || isLoading}>
          {saving && <Loader2 className="animate-spin" />}
          Save settings
        </Button>
      </form>
    </div>
  );
}
