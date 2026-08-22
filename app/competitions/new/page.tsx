import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createCompetition } from "../actions";

export default async function NewCompetitionPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: titles } = await supabase.from("titles").select("id, name");

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Create a competition</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <form action={createCompetition} className="flex flex-col gap-3">
        <input
          name="name"
          placeholder="Competition name"
          required
          className="rounded border p-2"
        />
        <select name="title_id" required className="rounded border p-2">
          {titles?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select name="type" required className="rounded border p-2">
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
          className="rounded border p-2"
        />

        <button className="rounded bg-black p-2 text-white">
          Create competition
        </button>
      </form>
    </div>
  );
}
