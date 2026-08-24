import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createCompetition } from "../actions";
import Button from "@/components/ui/Button";

export default async function NewCompetitionPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: titles } = await supabase.from("titles").select("id, name");

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Create a competition</h1>
      <form action={createCompetition} className="flex flex-col gap-3">
        <input
          name="name"
          placeholder="Competition name"
          required
          className="rounded border border-border p-2"
        />
        <select
          name="title_id"
          required
          className="rounded border border-border p-2"
        >
          {titles?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          required
          className="rounded border border-border p-2"
        >
          <option value="league">League</option>
          <option value="tournament">Tournament</option>
        </select>
        <input
          name="team_size"
          type="number"
          min={1}
          max={10}
          defaultValue={3}
          required
          className="rounded border border-border p-2"
        />

        <input
          name="start_date"
          type="date"
          required
          className="rounded border border-border p-2"
        />
        <input
          name="match_times"
          placeholder="Match times, e.g. 19:00, 20:00"
          required
          className="rounded border border-border p-2"
        />
        <input
          name="round_interval_days"
          type="number"
          min={1}
          defaultValue={7}
          required
          className="rounded border border-border p-2"
        />
        <select
          name="best_of"
          required
          className="rounded border border-border p-2"
          defaultValue={3}
        >
          {[1, 3, 5, 7].map((n) => (
            <option key={n} value={n}>
              Best of {n}
            </option>
          ))}
        </select>
        <select
          name="playoff_teams"
          required
          defaultValue={0}
          className="rounded border border-border p-2"
        >
          <option value={0}>No playoffs</option>
          {[2, 4, 8, 16].map((n) => (
            <option key={n} value={n}>
              Top {n}
            </option>
          ))}
        </select>

        <Button className="w-full">Create competition</Button>
      </form>
    </div>
  );
}
