import { cn } from "@/lib/utils";

export function ChannelPill({ canal }: { canal: "whatsapp" | "email" | "portal" }) {
  const map = {
    whatsapp: { label: "WhatsApp", cls: "bg-[var(--whatsapp)]/15 text-[var(--whatsapp)]" },
    email: { label: "E-mail", cls: "bg-[var(--email)]/15 text-[var(--email)]" },
    portal: { label: "Portal", cls: "bg-[var(--portal-channel)]/15 text-[var(--portal-channel)]" },
  } as const;
  const c = map[canal];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", c.cls)}>
      {c.label}
    </span>
  );
}
