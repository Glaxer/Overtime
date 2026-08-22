import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyTeams, getMyPendingInvites } from "@/lib/queries/teams";
import {
  getMyUpcomingMatches,
  getRescheduleRequestsForMe
} from "@/lib/queries/matches";
import { acceptInvite, declineInvite } from "@/app/teams/actions";
import { approveReschedule, rejectReschedule } from "@/app/matches/actions";
import Button from "@/components/ui/Button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [teams, invites, upcoming, reschedules, { data: profile }] =
    await Promise.all([
      getMyTeams(user.id),
      getMyPendingInvites(user.id),
      getMyUpcomingMatches(user.id),
      getRescheduleRequestsForMe(user.id),
      supabase.from("users").select("display_name").eq("id", user.id).single()
    ]);

  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("da-DK", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Europe/Copenhagen"
        })
      : "TBD";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Welcome, {profile?.display_name}!</h1>

      {/* Awaiting your approval */}
      {reschedules.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold">Awaiting your approval</h2>
          <ul className="flex flex-col gap-2">
            {reschedules.map((r) => (
              <li key={r.id} className="rounded border p-3 text-sm">
                <p>
                  <Link
                    href={`/matches/${r.match.id}`}
                    className="font-medium hover:underline"
                  >
                    {r.match.team_a.name} vs {r.match.team_b.name}
                  </Link>
                </p>
                <p className="mt-1 text-gray-500">
                  {r.requester.display_name} wants to move it from{" "}
                  {fmt(r.match.scheduled_at)} to{" "}
                  <span className="font-medium">{fmt(r.proposed_at)}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Opponent: {r.opponent_approved_by ? "✓" : "waiting"} · Admin:{" "}
                  {r.admin_approved_by ? "✓" : "waiting"}
                </p>
                <span className="mt-2 flex gap-2">
                  <form action={approveReschedule}>
                    <input type="hidden" name="match_id" value={r.match.id} />
                    <input type="hidden" name="reschedule_id" value={r.id} />
                    <Button>Approve</Button>
                  </form>
                  <form action={rejectReschedule}>
                    <input type="hidden" name="match_id" value={r.match.id} />
                    <input type="hidden" name="reschedule_id" value={r.id} />
                    <Button variant="secondary">Reject</Button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Your next matches */}
      {upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold">Your next matches</h2>
          <ul className="flex flex-col gap-2">
            {upcoming.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <span>
                  <Link
                    href={`/matches/${m.id}`}
                    className="font-medium hover:underline"
                  >
                    {m.team_a.name} vs {m.team_b.name}
                  </Link>
                  <span className="ml-2 text-gray-500">
                    {m.competition.name} · Round {m.round}
                  </span>
                </span>
                <span className="text-gray-500">{fmt(m.scheduled_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Team invites */}
      {invites.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold">Team invites</h2>
          <ul className="flex flex-col gap-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <span className="text-sm">
                  <span className="font-medium">{inv.team.name}</span>
                  <span className="text-gray-500">
                    {" "}
                    — invited by {inv.inviter.display_name}
                  </span>
                </span>
                <span className="flex gap-2">
                  <form action={acceptInvite}>
                    <input type="hidden" name="invite_id" value={inv.id} />
                    <Button>Accept</Button>
                  </form>
                  <form action={declineInvite}>
                    <input type="hidden" name="invite_id" value={inv.id} />
                    <Button variant="secondary">Decline</Button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* My teams */}
      <section className="mt-8">
        <h2 className="mb-2 font-semibold">My teams</h2>
        <ul className="flex flex-col gap-1">
          {teams.map((m) => (
            <li key={m.team.id}>
              <Link
                href={`/teams/${m.team.id}`}
                className="text-sm hover:underline"
              >
                {m.team.name}
                <span className="ml-2 text-gray-500">
                  ({m.team.title.name})
                </span>
                {m.role === "captain" && " ⭐"}
              </Link>
            </li>
          ))}
          {teams.length === 0 && (
            <li className="text-sm text-gray-500">No teams yet</li>
          )}
        </ul>
        <Link
          href="/teams/new"
          className="mt-4 inline-block rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          Create team
        </Link>
      </section>
    </div>
  );
}
