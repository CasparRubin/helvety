import type { JSX } from "react";

/** Shared popup chrome: extension icon, product name, optional version. */
export function PopupHeader({
  displayName,
  version,
  iconSrc,
  iconAlt = "",
}: {
  displayName: string;
  version?: string;
  iconSrc: string;
  iconAlt?: string;
}): JSX.Element {
  const versionLabel =
    version && version !== "—" ? (
      <span className="text-[11px] leading-tight text-muted-foreground">v{version}</span>
    ) : null;

  return (
    <header className="mb-2 flex select-none items-center gap-2.5 border-b border-border/60 pb-2">
      <img
        src={iconSrc}
        alt={iconAlt}
        width={48}
        height={48}
        className="size-12 shrink-0"
        aria-hidden={iconAlt === ""}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {displayName}
        </span>
        {versionLabel}
      </div>
    </header>
  );
}
