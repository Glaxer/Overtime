import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatch } from "@/lib/queries/matches";
import { getMyTeams } from "@/lib/queries/teams";
import {
  submitResult,
  verifySubmission,
  rejectSubmission,
  forfeitMatch,
  approveReschedule,
  rejectReschedule,
  proposeReschedule
} from "../actions";
import Button from "@/components/ui/Button";
import { toLocalInputValue } from "@/lib/datetime";

export default async function MatchPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Am I an admin of this competition?
  const { data: adminRow } = user
    ? await supabase
        .from("comp_admins")
        .select("user_id")
        .eq("competition_id", match.competition_id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const isAdmin = !!adminRow;

  // Am I a captain of one of the two teams?
  const myTeams = user ? await getMyTeams(user.id) : [];
  const myCaptainTeam = myTeams.find(
    (m) =>
      m.role === "captain" &&
      (m.team.id === match.team_a.id || m.team.id === match.team_b.id)
  )?.team;

  const isParticipantCaptain = !!myCaptainTeam;

  const games = [...match.games].sort((a, b) => a.game_number - b.game_number);
  const seriesA = games.filter((g) => g.score_a > g.score_b).length;
  const seriesB = games.filter((g) => g.score_b > g.score_a).length;

  const pending = match.submissions.filter((s) => s.status === "pending");
  const hasResult = games.length > 0 || !!match.forfeited_by;

  const pendingReschedule = match.reschedules?.find(
    (r) => r.status === "pending"
  );
  const usedReschedule = match.reschedules?.some((r) =>
    ["pending", "approved"].includes(r.status)
  );
  const iRequested = pendingReschedule?.requested_by === user?.id;

  // Max +1 week, for the datetime input's max attribute
  const maxDate = match.scheduled_at
    ? toLocalInputValue(
        new Date(new Date(match.scheduled_at).getTime() + 7 * 864e5)
      )
    : undefined;

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
      <Link
        href={`/competitions/${match.competition_id}`}
        className="text-sm text-muted hover:underline"
      >
        ← {match.competition.name}
      </Link>

      <p className="mt-2 text-sm text-muted">
        Round {match.round} · Best of {match.best_of} ·{" "}
        {fmt(match.scheduled_at)}
      </p>

      <h1 className="mb-6 text-2xl font-bold">
        {match.team_a.name} vs {match.team_b.name}
      </h1>

      {/* Result */}
      {match.forfeited_by ? (
        <p className="mb-8 text-lg">
          Forfeit —{" "}
          {match.forfeited_by === match.team_a.id
            ? match.team_b.name
            : match.team_a.name}{" "}
          wins
        </p>
      ) : games.length > 0 ? (
        <div className="mb-8">
          <p className="text-3xl font-bold">
            {seriesA} – {seriesB}
          </p>
          <ul className="mt-2 flex flex-col gap-0.5 text-sm text-muted">
            {games.map((g) => (
              <li key={g.game_number}>
                Game {g.game_number}: {g.score_a} – {g.score_b}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-8 text-sm text-muted">Not played yet</p>
      )}

      {/* Submit result */}
      {!hasResult && pending.length === 0 && isParticipantCaptain && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Submit result</h2>
          <p className="mb-2 text-xs text-muted">
            Fill in only the games that were played. Left column ={" "}
            {match.team_a.name}.
          </p>
          <form action={submitResult} className="flex flex-col gap-2">
            <input type="hidden" name="match_id" value={match.id} />
            <input type="hidden" name="best_of" value={match.best_of} />
            {Array.from({ length: match.best_of }, (_, i) => i + 1).map((n) => (
              <div key={n} className="flex items-center gap-2 text-sm">
                <span className="w-16 text-muted">Game {n}</span>
                <input
                  type="number"
                  min={0}
                  name={`game_${n}_a`}
                  className="w-16 rounded border border-border p-1"
                />
                <span>–</span>
                <input
                  type="number"
                  min={0}
                  name={`game_${n}_b`}
                  className="w-16 rounded border border-border p-1"
                />
              </div>
            ))}
            <Button className="mt-2 self-start">Submit result</Button>
          </form>
          <form action={forfeitMatch} className="mt-4">
            <input type="hidden" name="match_id" value={match.id} />
            <Button variant="danger">Forfeit as {myCaptainTeam.name}</Button>
            <p className="mt-1 text-xs text-muted">
              {match.team_a.id === myCaptainTeam.id
                ? match.team_b.name
                : match.team_a.name}{" "}
              gets the win. This can&apos;t be undone.
            </p>
          </form>
        </div>
      )}

      {/* Pending submissions */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Pending submissions</h2>
          <ul className="flex flex-col gap-2">
            {pending.map((s) => {
              const payloadGames = (
                s.payload as { games: { a: number; b: number }[] }
              ).games;
              return (
                <li
                  key={s.id}
                  className="rounded border border-border p-3 text-sm"
                >
                  <p className="mb-1 text-muted">
                    by {s.submitter.display_name} · {fmt(s.created_at)}
                  </p>
                  <p className="mb-2">
                    {payloadGames.map((g) => `${g.a}–${g.b}`).join(", ")}
                  </p>
                  {isAdmin && (
                    <span className="flex gap-2">
                      <form action={verifySubmission}>
                        <input type="hidden" name="match_id" value={match.id} />
                        <input
                          type="hidden"
                          name="submission_id"
                          value={s.id}
                        />
                        <Button>Verify</Button>
                      </form>
                      <form action={rejectSubmission}>
                        <input type="hidden" name="match_id" value={match.id} />
                        <input
                          type="hidden"
                          name="submission_id"
                          value={s.id}
                        />
                        <Button variant="secondary">Reject</Button>
                      </form>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {/* Propose a reschedule */}
      {!hasResult && myCaptainTeam && !usedReschedule && match.scheduled_at && (
        <div className="mb-8 max-w-sm">
          <h2 className="mb-2 font-semibold">Propose a new time</h2>
          <p className="mb-2 text-xs text-muted">
            Up to one week later. Needs approval from the opposing captain and
            an admin. Each match can only be moved once.
          </p>
          <form action={proposeReschedule} className="flex gap-2">
            <input type="hidden" name="match_id" value={match.id} />
            <input
              type="datetime-local"
              name="proposed_at"
              required
              min={toLocalInputValue(match.scheduled_at)}
              max={maxDate}
              className="flex-1 rounded border border-border p-1 text-sm"
            />
            <Button>Propose</Button>
          </form>
        </div>
      )}

      {/* Pending reschedule request */}
      {pendingReschedule && (
        <div className="mb-8 max-w-md rounded border border-border p-3">
          <h2 className="mb-1 font-semibold">Reschedule requested</h2>
          <p className="text-sm">
            {pendingReschedule.requester.display_name} proposes{" "}
            <span className="font-medium">
              {fmt(pendingReschedule.proposed_at)}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Opponent:{" "}
            {pendingReschedule.opponent_approved_by ? "✓ approved" : "waiting"}{" "}
            · Admin:{" "}
            {pendingReschedule.admin_approved_by ? "✓ approved" : "waiting"}
          </p>
          {((myCaptainTeam && !iRequested) || isAdmin) && (
            <span className="mt-2 flex gap-2">
              <form action={approveReschedule}>
                <input type="hidden" name="match_id" value={match.id} />
                <input
                  type="hidden"
                  name="reschedule_id"
                  value={pendingReschedule.id}
                />
                <Button>Approve</Button>
              </form>
              <form action={rejectReschedule}>
                <input type="hidden" name="match_id" value={match.id} />
                <input
                  type="hidden"
                  name="reschedule_id"
                  value={pendingReschedule.id}
                />
                <Button variant="secondary">Reject</Button>
              </form>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
