"use client";

import { useState } from "react";
import { swapTeams } from "@/app/competitions/actions";

type SwapMatch = {
  id: string;
  round: number;
  team_a: { id: string; name: string };
  team_b: { id: string; name: string };
};

export default function SwapTool({
  matches,
  competitionId
}: {
  matches: SwapMatch[];
  competitionId: string;
}) {
  const slots = matches.flatMap((m) => [
    {
      value: `${m.id}|a`,
      matchId: m.id,
      teamId: m.team_a.id,
      opponentId: m.team_b.id,
      label: `R${m.round}: ${m.team_a.name} (vs ${m.team_b.name})`
    },
    {
      value: `${m.id}|b`,
      matchId: m.id,
      teamId: m.team_b.id,
      opponentId: m.team_a.id,
      label: `R${m.round}: ${m.team_b.name} (vs ${m.team_a.name})`
    }
  ]);

  const [first, setFirst] = useState(slots[0]?.value ?? "");
  const selected = slots.find((s) => s.value === first);

  // Only legal, meaningful targets: different match, different team
  const targets = slots.filter(
    (s) =>
      selected &&
      s.matchId !== selected.matchId && // not the same match
      s.teamId !== selected.teamId && // not the same team (no-op)
      s.teamId !== selected.opponentId && // incoming team ≠ my opponent (your case)
      s.opponentId !== selected.teamId // my team ≠ their opponent (mirror case)
  );

  return (
    <form action={swapTeams} className="flex gap-2">
      <input type="hidden" name="competition_id" value={competitionId} />
      <select
        name="slot_1"
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        className="flex-1 rounded border border-border p-1 text-xs"
      >
        {slots.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        key={first} // reset selection when the first pick changes
        name="slot_2"
        required
        disabled={targets.length === 0}
        className="flex-1 rounded border border-border p-1 text-xs"
      >
        {targets.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button className="rounded border border-border px-2 text-xs hover:bg-surface">
        Swap
      </button>
    </form>
  );
}
