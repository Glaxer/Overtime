import Link from "next/link";
import { getCompetitions } from "@/lib/queries/competitions";

export default async function CompetitionsPage() {
  const competitions = await getCompetitions();

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Competitions</h1>
        <Link
          href="/competitions/new"
          className="rounded bg-black px-3 py-1.5 text-sm text-white"
        >
          Create competition
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {competitions.map((c) => (
          <li key={c.id}>
            <Link
              href={`/competitions/${c.id}`}
              className="flex items-center justify-between rounded border p-3 hover:bg-gray-50"
            >
              <span>
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {c.title.name}
                </span>
              </span>
              <span className="flex gap-2 text-xs">
                <span className="rounded bg-gray-200 px-1.5 py-0.5">
                  {c.type}
                </span>
                <span className="rounded bg-gray-200 px-1.5 py-0.5">
                  {c.status}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
