"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitResult(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const matchId = formData.get("match_id") as string;
  const bestOf = Number(formData.get("best_of"));

  const games: { a: number; b: number }[] = [];
  for (let i = 1; i <= bestOf; i++) {
    const a = formData.get(`game_${i}_a`) as string;
    const b = formData.get(`game_${i}_b`) as string;
    if (a === "" || b === "") continue;
    games.push({ a: Number(a), b: Number(b) });
  }

  if (games.length === 0) {
    redirect(
      `/matches/${matchId}?error=${encodeURIComponent("Enter at least one game score")}`
    );
  }

  const wins = games.filter((g) => g.a > g.b).length;
  const losses = games.filter((g) => g.b > g.a).length;
  const needed = Math.ceil(bestOf / 2);
  if (wins < needed && losses < needed) {
    redirect(
      `/matches/${matchId}?error=${encodeURIComponent(`Neither team reached ${needed} wins`)}`
    );
  }

  const { error } = await supabase.from("submissions").insert({
    match_id: matchId,
    submitted_by: user.id,
    payload: { games }
  });

  if (error)
    redirect(`/matches/${matchId}?error=${encodeURIComponent(error.message)}`);
  redirect(
    `/matches/${matchId}?success=${encodeURIComponent("Result submitted — awaiting verification")}`
  );
}

export async function verifySubmission(formData: FormData) {
  const supabase = await createClient();
  const matchId = formData.get("match_id") as string;

  const { error } = await supabase.rpc("verify_submission", {
    p_submission_id: formData.get("submission_id") as string
  });

  if (error)
    redirect(`/matches/${matchId}?error=${encodeURIComponent(error.message)}`);
  redirect(
    `/matches/${matchId}?success=${encodeURIComponent("Result verified")}`
  );
}

export async function rejectSubmission(formData: FormData) {
  const supabase = await createClient();
  const matchId = formData.get("match_id") as string;

  const { error } = await supabase
    .from("submissions")
    .update({ status: "rejected" })
    .eq("id", formData.get("submission_id") as string);

  if (error)
    redirect(`/matches/${matchId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/matches/${matchId}`);
}

export async function forfeitMatch(formData: FormData) {
  const supabase = await createClient();
  const matchId = formData.get("match_id") as string;

  const { error } = await supabase.rpc("forfeit_match", {
    p_match_id: matchId
  });

  if (error)
    redirect(`/matches/${matchId}?error=${encodeURIComponent(error.message)}`);
  redirect(
    `/matches/${matchId}?success=${encodeURIComponent("Match forfeited")}`
  );
}
