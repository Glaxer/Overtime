import { createClient } from "@/lib/supabase/server";

export type TeamWithRoster = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  title: { id: string; name: string; slug: string };
  members: {
    role: "captain" | "member";
    user: { id: string; display_name: string };
  }[];
};

export type MyTeamMembership = {
  role: "captain" | "member";
  team: { id: string; name: string; title: { name: string } };
};

export type PendingInvite = {
  id: string;
  team: { id: string; name: string };
  inviter: { display_name: string };
};

export async function getTeam(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select(
      `
      id, name, created_by, created_at,
      title:titles ( id, name, slug ),
      members:team_members (
        role,
        user:users ( id, display_name )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("getTeam error:", error);
    return null;
  }
  return data;
}

export async function getMyTeams(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select(
      `
      role,
      team:teams ( id, name, title:titles ( name ) )
    `
    )
    .eq("user_id", userId);

  return data ?? [];
}

export async function getMyPendingInvites(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_invites")
    .select(
      `
      id,
      team:teams ( id, name ),
      inviter:users!team_invites_invited_by_fkey ( display_name )
    `
    )
    .eq("user_id", userId)
    .eq("status", "pending");

  return data ?? [];
}
