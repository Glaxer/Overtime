"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCompetition(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("competitions")
    .insert({
      name: (formData.get("name") as string).trim(),
      title_id: formData.get("title_id") as string,
      type: formData.get("type") as "league" | "tournament",
      team_size: Number(formData.get("team_size")),
      status: "open",
      created_by: user.id
    })
    .select("id")
    .single();

  if (error)
    redirect("/competitions/new?error=" + encodeURIComponent(error.message));
  redirect(`/competitions/${data.id}`);
}

export async function signupTeam(formData: FormData) {
  const supabase = await createClient();
  const competitionId = formData.get("competition_id") as string;

  const { error } = await supabase.from("signups").insert({
    competition_id: competitionId,
    team_id: formData.get("team_id") as string
  });

  if (error) {
    const message =
      error.code === "23505" ? "That team is already signed up" : error.message;
    redirect(
      `/competitions/${competitionId}?error=${encodeURIComponent(message)}`
    );
  }
  revalidatePath(`/competitions/${competitionId}`);
}

export async function setSignupStatus(formData: FormData) {
  const supabase = await createClient();
  const competitionId = formData.get("competition_id") as string;

  const { error } = await supabase
    .from("signups")
    .update({ status: formData.get("status") as "accepted" | "rejected" })
    .eq("competition_id", competitionId)
    .eq("team_id", formData.get("team_id") as string);

  if (error)
    redirect(
      `/competitions/${competitionId}?error=${encodeURIComponent(error.message)}`
    );
  revalidatePath(`/competitions/${competitionId}`);
}

export async function withdrawSignup(formData: FormData) {
  const supabase = await createClient();
  const competitionId = formData.get("competition_id") as string;

  const { error } = await supabase
    .from("signups")
    .delete()
    .eq("competition_id", competitionId)
    .eq("team_id", formData.get("team_id") as string);

  if (error)
    redirect(
      `/competitions/${competitionId}?error=${encodeURIComponent(error.message)}`
    );
  revalidatePath(`/competitions/${competitionId}`);
}
