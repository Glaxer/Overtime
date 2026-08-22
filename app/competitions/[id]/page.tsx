import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompetition } from "@/lib/queries/competitions";
import { getMyTeams } from "@/lib/queries/teams";
import { signupTeam, setSignupStatus, withdrawSignup } from "../actions";

export default async function CompetitionPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const comp = await getCompetition(id);
  if (!comp) notFound();

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isAdmin = comp.admins.some((a) => a.user.id === user?.id);

  // Teams I captain, for this title, not yet signed up
  const myTeams = user ? await getMyTeams(user.id) : [];
  const signedUpTeamIds = new Set(comp.signups.map((s) => s.team.id));
  const eligibleTeams = myTeams.filter(
    (m) =>
      m.role === "captain" &&
      m.team.title.name === comp.title.name &&
      !signedUpTeamIds.has(m.team.id)
  );
  const mySignups = comp.signups.filter((s) =>
    myTeams.some((m) => m.role === "captain" && m.team.id === s.team.id)
  );

  const accepted = comp.signups.filter((s) => s.status === "accepted");
  const pending = comp.signups.filter((s) => s.status === "pending");

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-gray-500">
        {comp.title.name} · {comp.type} · {comp.status}
      </p>
      <h1 className="mb-6 text-2xl font-bold">{comp.name}</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}

      <h2 className="mb-2 font-semibold">Teams</h2>
      <ul className="mb-8 flex flex-col gap-1">
        {accepted.map((s) => (
          <li key={s.team.id} className="text-sm">
            {s.team.name}
          </li>
        ))}
        {accepted.length === 0 && (
          <li className="text-sm text-gray-500">No teams yet</li>
        )}
      </ul>

      {comp.status === "open" && eligibleTeams.length > 0 && (
        <div className="mb-8 max-w-sm">
          <h2 className="mb-2 font-semibold">Sign up a team</h2>
          <form action={signupTeam} className="flex gap-2">
            <input type="hidden" name="competition_id" value={comp.id} />
            <select
              name="team_id"
              required
              className="flex-1 rounded border p-2 text-sm"
            >
              {eligibleTeams.map((m) => (
                <option key={m.team.id} value={m.team.id}>
                  {m.team.name}
                </option>
              ))}
            </select>
            <button className="rounded bg-black px-3 text-sm text-white">
              Sign up
            </button>
          </form>
        </div>
      )}

      {isAdmin && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Pending signups</h2>
          <ul className="flex flex-col gap-2">
            {pending.map((s) => (
              <li
                key={s.team.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <span className="text-sm font-medium">{s.team.name}</span>
                <span className="flex gap-2">
                  {(["accepted", "rejected"] as const).map((status) => (
                    <form key={status} action={setSignupStatus}>
                      <input
                        type="hidden"
                        name="competition_id"
                        value={comp.id}
                      />
                      <input type="hidden" name="team_id" value={s.team.id} />
                      <input type="hidden" name="status" value={status} />
                      <button
                        className={
                          status === "accepted"
                            ? "rounded bg-black px-3 py-1 text-sm text-white"
                            : "rounded border px-3 py-1 text-sm hover:bg-gray-100"
                        }
                      >
                        {status === "accepted" ? "Accept" : "Reject"}
                      </button>
                    </form>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mySignups.length > 0 && (
        <div className="mb-8 max-w-sm">
          <h2 className="mb-2 font-semibold">Your signups</h2>
          <ul className="flex flex-col gap-2">
            {mySignups.map((s) => (
              <li
                key={s.team.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <span className="text-sm">
                  {s.team.name}
                  <span className="ml-2 text-xs text-gray-500">
                    ({s.status})
                  </span>
                </span>
                <form action={withdrawSignup}>
                  <input type="hidden" name="competition_id" value={comp.id} />
                  <input type="hidden" name="team_id" value={s.team.id} />
                  <button className="rounded border px-3 py-1 text-sm hover:bg-gray-100">
                    Withdraw
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
