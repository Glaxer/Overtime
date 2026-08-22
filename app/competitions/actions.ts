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
      created_by: user.id,
      settings: {
        start_date: formData.get("start_date") as string,
        round_interval_days: Number(formData.get("round_interval_days")),
        match_times: (formData.get("match_times") as string)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        best_of: Number(formData.get("best_of")),
        playoff_teams: Number(formData.get("playoff_teams"))
      }
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

export async function startCompetition(formData: FormData) {
  const supabase = await createClient();
  const compId = formData.get("competition_id") as string;
  const { error } = await supabase.rpc("start_competition", {
    p_comp_id: compId
  });
  if (error)
    redirect(
      `/competitions/${compId}?error=${encodeURIComponent(error.message)}`
    );
  revalidatePath(`/competitions/${compId}`);
}

export async function publishSchedule(formData: FormData) {
  const supabase = await createClient();
  const compId = formData.get("competition_id") as string;
  const { error } = await supabase.rpc("publish_schedule", {
    p_comp_id: compId
  });
  if (error)
    redirect(
      `/competitions/${compId}?error=${encodeURIComponent(error.message)}`
    );
  revalidatePath(`/competitions/${compId}`);
}

export async function updateMatchTime(formData: FormData) {
  const supabase = await createClient();
  const compId = formData.get("competition_id") as string;
  const { error } = await supabase
    .from("matches")
    .update({
      scheduled_at: new Date(
        formData.get("scheduled_at") as string
      ).toISOString()
    })
    .eq("id", formData.get("match_id") as string);
  if (error)
    redirect(
      `/competitions/${compId}?error=${encodeURIComponent(error.message)}`
    );
  revalidatePath(`/competitions/${compId}`);
}

export async function swapTeams(formData: FormData) {
  const supabase = await createClient();
  const compId = formData.get("competition_id") as string;
  const [matchA, slotA] = (formData.get("slot_1") as string).split("|");
  const [matchB, slotB] = (formData.get("slot_2") as string).split("|");

  const { error } = await supabase.rpc("swap_match_teams", {
    p_match_a: matchA,
    p_slot_a: slotA,
    p_match_b: matchB,
    p_slot_b: slotB
  });
  if (error) {
    const message = error.message.includes("matches_check")
      ? "Can't swap a team with its own opponent"
      : error.message;
    redirect(`/competitions/${compId}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath(`/competitions/${compId}`);
}

export async function updatePlayoffTeams(formData: FormData) {
  const supabase = await createClient();
  const compId = formData.get("competition_id") as string;

  const { data: comp } = await supabase
    .from("competitions")
    .select("settings, status")
    .eq("id", compId)
    .single();

  if (!comp || comp.status !== "draft") {
    redirect(
      `/competitions/${compId}?error=${encodeURIComponent("Playoff size only editable in draft")}`
    );
  }

  const settings = {
    ...(comp.settings as object),
    playoff_teams: Number(formData.get("playoff_teams"))
  };
  const { error } = await supabase
    .from("competitions")
    .update({ settings })
    .eq("id", compId);
  if (error)
    redirect(
      `/competitions/${compId}?error=${encodeURIComponent(error.message)}`
    );
  revalidatePath(`/competitions/${compId}`);
}

export async function reopenCompetition(formData: FormData) {
  const supabase = await createClient();
  const compId = formData.get("competition_id") as string;
  const { error } = await supabase.rpc("reopen_competition", {
    p_comp_id: compId
  });
  if (error)
    redirect(
      `/competitions/${compId}?error=${encodeURIComponent(error.message)}`
    );
  revalidatePath(`/competitions/${compId}`);
}
