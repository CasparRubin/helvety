import Link from "next/link";

import type {
  Briefing,
  BriefingPerson,
  BriefingPlatforms,
} from "@/content/briefings";

const PLATFORM_LABELS = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
} as const satisfies Record<keyof BriefingPlatforms, string>;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Format `YYYY-MM-DD` as 18 November 2026, identical on server and client. */
function formatBriefingDate(date: string): string {
  const [year, month, day] = date.split("-");
  const monthName = MONTHS[Number(month) - 1];
  if (!year || !day || !monthName) {
    return date;
  }
  return `${Number(day)} ${monthName} ${year}`;
}

const linkClass =
  "text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground";

/** Plain briefing page: the report, its sources, and optional thread notes. */
export function BriefingArticle({ briefing }: { briefing: Briefing }) {
  const platforms = (
    Object.keys(PLATFORM_LABELS) as Array<keyof BriefingPlatforms>
  ).flatMap((key) => {
    const href = briefing.platforms?.[key];
    return href ? [{ key, href, label: PLATFORM_LABELS[key] }] : [];
  });

  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-16">
      <p className="mb-8">
        <Link href="/briefings" className={linkClass}>
          Briefings
        </Link>
      </p>
      <p className="text-muted-foreground text-sm tracking-wide uppercase">
        {briefing.kicker}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {briefing.subject}
      </h1>
      <p className="text-muted-foreground mt-3 text-sm">
        {formatBriefingDate(briefing.date)}
      </p>
      <div className="mt-10 space-y-4 text-lg leading-relaxed">
        {briefing.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <ul className="mt-10 space-y-2">
        <li>
          <a
            href={briefing.source.url}
            className={linkClass}
            rel="noreferrer"
            target="_blank"
          >
            {briefing.source.title}
          </a>
        </li>
        {briefing.source.hnUrl ? (
          <li>
            <a
              href={briefing.source.hnUrl}
              className={linkClass}
              rel="noreferrer"
              target="_blank"
            >
              Hacker News
            </a>
          </li>
        ) : null}
        {platforms.map((platform) => (
          <li key={platform.key}>
            <a
              href={platform.href}
              className={linkClass}
              rel="noreferrer"
              target="_blank"
            >
              {platform.label}
            </a>
          </li>
        ))}
      </ul>
      {briefing.people && briefing.people.length > 0 ? (
        <People people={briefing.people} />
      ) : null}
      {briefing.threadNotes && briefing.threadNotes.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-lg font-semibold">From the Hacker News thread</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            These comments are from the Hacker News discussion. They are not
            checks by Helvety.
          </p>
          <ul className="mt-6 space-y-6">
            {briefing.threadNotes.map((note) => (
              <li key={note.commentUrl}>
                <p className="leading-relaxed">
                  <a
                    href={note.commentUrl}
                    className={linkClass}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {note.by}
                  </a>{" "}
                  {note.line}
                </p>
                {note.links && note.links.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {note.links.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          className={linkClass}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

/** Authors, with the role stated on a university page or their own site. */
function People({ people }: { people: readonly BriefingPerson[] }) {
  return (
    <section className="mt-14">
      <h2 className="text-lg font-semibold">Who is on the paper</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Roles are what each person&apos;s university page or own site says.
        Helvety did not check them.
      </p>
      <ul className="mt-6 space-y-6">
        {people.map((person) => (
          <li key={person.url}>
            <p className="leading-relaxed">
              <a
                href={person.url}
                className={linkClass}
                rel="noreferrer"
                target="_blank"
              >
                {person.name}
              </a>
              . {person.detail}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Index of published briefings. */
export function BriefingIndex({
  briefings,
}: {
  briefings: readonly Briefing[];
}) {
  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Briefings</h1>
      <ul className="mt-10 space-y-8">
        {briefings.map((briefing) => (
          <li key={briefing.slug}>
            <p className="text-muted-foreground text-sm">
              {formatBriefingDate(briefing.date)}
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              <Link href={`/briefings/${briefing.slug}`} className={linkClass}>
                {briefing.subject}
              </Link>
            </h2>
            <p className="mt-2 leading-relaxed">{briefing.lines[0]}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
