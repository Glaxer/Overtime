import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCompetitions } from "@/lib/queries/competitions";

export default async function CompetitionsPage({
  searchParams
}: {
  searchParams: Promise<{ title?: string; status?: string }>;
}) {
  const { title, status } = await searchParams;

  const supabase = await createClient();
  const [{ data: titles }, competitions] = await Promise.all([
    supabase.from("titles").select("id, name, slug").order("name"),
    getCompetitions()
  ]);

  const filtered = competitions.filter(
    (c) =>
      (!title || c.title.slug === title) && (!status || c.status === status)
  );

  const link = (params: { title?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params.title) q.set("title", params.title);
    if (params.status) q.set("status", params.status);
    return q.size ? `/competitions?${q}` : "/competitions";
  };

  const chip = (active: boolean) =>
    `rounded px-2 py-1 text-xs ${
      active
        ? "bg-primary text-background"
        : "border border-border hover:bg-surface"
    }`;

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Competitions</h1>
        <Link
          href="/competitions/new"
          className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-background hover:bg-primary-hover"
        >
          Create competition
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-2 flex flex-wrap gap-2">
        <Link href={link({ status })} className={chip(!title)}>
          All games
        </Link>
        {titles?.map((t) => (
          <Link
            key={t.id}
            href={link({ title: t.slug, status })}
            className={chip(title === t.slug)}
          >
            {t.name}
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={link({ title })} className={chip(!status)}>
          Any status
        </Link>
        {["open", "active", "completed"].map((s) => (
          <Link
            key={s}
            href={link({ title, status: s })}
            className={chip(status === s)}
          >
            {s}
          </Link>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link
              href={`/competitions/${c.id}`}
              className="flex items-center justify-between rounded border  border-border p-3 hover:bg-surface"
            >
              <span>
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-sm text-muted">{c.title.name}</span>
              </span>
              <span className="flex gap-2 text-xs">
                <span className="rounded bg-border border-border px-1.5 py-0.5">
                  {c.type}
                </span>
                <span className="rounded bg-border border-border px-1.5 py-0.5">
                  {c.status}
                </span>
              </span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-sm text-muted">
            No competitions match those filters
          </li>
        )}
      </ul>
    </div>
  );
}
