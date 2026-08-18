import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTeam } from "@/lib/queries/teams";
import { addMember } from "../actions";

export default async function TeamPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const team = await getTeam(id);
  if (!team) notFound();

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isCaptain = team.members.some(
    (m) => m.user.id === user?.id && m.role === "captain"
  );

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-gray-500">{team.title.name}</p>
      <h1 className="mb-6 text-2xl font-bold">{team.name}</h1>

      <h2 className="mb-2 font-semibold">Roster</h2>
      <ul className="mb-8 flex flex-col gap-1">
        {team.members.map((m) => (
          <li key={m.user.id} className="flex items-center gap-2 text-sm">
            {m.user.display_name}
            {m.role === "captain" && (
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">
                Captain
              </span>
            )}
          </li>
        ))}
      </ul>

      {isCaptain && (
        <div className="max-w-sm">
          <h2 className="mb-2 font-semibold">Add member</h2>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <form action={addMember} className="flex gap-2">
            <input type="hidden" name="team_id" value={team.id} />
            <input
              name="display_name"
              placeholder="Display name"
              required
              className="flex-1 rounded border p-2 text-sm"
            />
            <button className="rounded bg-black px-3 text-sm text-white">
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
