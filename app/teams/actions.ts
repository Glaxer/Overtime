"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTeam(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: (formData.get("name") as string).trim(),
      title_id: formData.get("title_id") as string,
      created_by: user.id
    })
    .select("id")
    .single();

  if (error) {
    const message =
      error.code === "23505"
        ? "A team with that name already exists for this game"
        : error.message;
    redirect("/teams/new?error=" + encodeURIComponent(message));
  }
  redirect(`/teams/${data.id}`);
}

export async function addMember(formData: FormData) {
  const supabase = await createClient();
  const teamId = formData.get("team_id") as string;
  const displayName = (formData.get("display_name") as string).trim();

  const { data: target } = await supabase
    .from("users")
    .select("id")
    .eq("display_name", displayName)
    .single();

  if (!target) {
    redirect(
      `/teams/${teamId}?error=${encodeURIComponent("No user with that display name")}`
    );
  }

  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, user_id: target.id, role: "member" });

  if (error)
    redirect(`/teams/${teamId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/teams/${teamId}`);
}

export async function acceptInvite(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_team_invite", {
    invite_id: formData.get("invite_id") as string
  });
  if (error) redirect("/dashboard?error=" + encodeURIComponent(error.message));
  revalidatePath("/dashboard");
}

export async function declineInvite(formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("team_invites")
    .update({ status: "declined" })
    .eq("id", formData.get("invite_id") as string);
  revalidatePath("/dashboard");
}
