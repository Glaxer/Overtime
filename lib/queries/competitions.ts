import { createClient } from "@/lib/supabase/server";

export async function getCompetitions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("competitions")
    .select(
      `
      id, name, type, status, team_size, created_at,
      title:titles ( id, name, slug )
    `
    )
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getCompetition(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select(
      `
      id, name, type, status, team_size, settings, created_by, created_at,
      title:titles ( id, name, slug ),
      admins:comp_admins ( user:users ( id, display_name ) ),
      signups (
        status,
        team:teams ( id, name )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("getCompetition error:", error);
    return null;
  }
  return data;
}
