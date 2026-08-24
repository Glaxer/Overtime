import Link from "next/link";
import Button from "@/components/ui/Button";
import { updateMatchTime } from "@/app/competitions/actions";
import { toLocalInputValue } from "@/lib/datetime";

type MatchRowProps = {
  match: {
    id: string;
    round: number;
    scheduled_at: string | null;
    forfeited_by: string | null;
    team_a: { id: string; name: string };
    team_b: { id: string; name: string };
    games: { score_a: number; score_b: number }[];
  };
  competitionId: string;
  editable: boolean;
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("da-DK", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Copenhagen"
      })
    : "TBD";

export default function MatchRow({
  match,
  competitionId,
  editable
}: MatchRowProps) {
  const gamesA = match.games.filter((g) => g.score_a > g.score_b).length;
  const gamesB = match.games.filter((g) => g.score_b > g.score_a).length;

  const played = match.games.length > 0 || !!match.forfeited_by;

  return (
    <li className="flex items-center justify-between rounded border border-border p-3 text-sm">
      <span className="flex items-center gap-2">
        <Link href={`/matches/${match.id}`} className="hover:underline">
          {match.team_a.name} vs {match.team_b.name}
        </Link>
        {match.forfeited_by ? (
          <span className="text-muted">
            FF —{" "}
            {match.forfeited_by === match.team_a.id
              ? match.team_b.name
              : match.team_a.name}{" "}
            wins
          </span>
        ) : match.games.length > 0 ? (
          <span className="text-muted">
            {gamesA}–{gamesB}
          </span>
        ) : null}
      </span>

      {editable && !played ? (
        <form action={updateMatchTime} className="flex items-center gap-2">
          <input type="hidden" name="competition_id" value={competitionId} />
          <input type="hidden" name="match_id" value={match.id} />
          <input
            type="datetime-local"
            name="scheduled_at"
            defaultValue={
              match.scheduled_at ? toLocalInputValue(match.scheduled_at) : ""
            }
            min={toLocalInputValue(new Date())}
            className="rounded border border-border p-1 text-xs"
          />
          <Button variant="secondary" className="text-xs">
            Save
          </Button>
        </form>
      ) : (
        <span className="text-muted">{fmt(match.scheduled_at)}</span>
      )}
    </li>
  );
}
