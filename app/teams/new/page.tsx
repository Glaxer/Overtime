import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createTeam } from "../actions";
import Button from "@/components/ui/Button";

export default async function NewTeamPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: titles } = await supabase.from("titles").select("id, name");

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Create a team</h1>
      <form action={createTeam} className="flex flex-col gap-3">
        <input
          name="name"
          placeholder="Team name"
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
        <Button className="w-full">Create team</Button>
      </form>
    </div>
  );
}
