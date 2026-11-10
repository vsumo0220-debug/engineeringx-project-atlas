import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { siteSettingsQuery } from "@/lib/queries";
import { DEFAULT_DISCORD_URL } from "@/lib/site";

export function useDiscordUrl() {
  const { data } = useQuery(siteSettingsQuery());
  return data?.discord_url ?? DEFAULT_DISCORD_URL;
}

export function DiscordButton({
  variant = "signal",
  size = "lg",
  className,
  label = "Join Our Discord",
}: Pick<ButtonProps, "variant" | "size" | "className"> & { label?: string }) {
  const url = useDiscordUrl();
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {label}
        <ArrowUpRight />
      </a>
    </Button>
  );
}
