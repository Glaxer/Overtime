import { getMyTeams } from "@/lib/queries/teams";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyPendingInvites } from "@/lib/queries/teams";
import { acceptInvite, declineInvite } from "@/app/teams/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const teams = await getMyTeams(user.id);
  const invites = await getMyPendingInvites(user.id);

  const { data: profile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto mt-16 max-w-2xl">
      <h1 className="text-2xl font-bold">Welcome, {profile?.display_name}!</h1>
      <h2 className="mt-8 mb-2 font-semibold">My teams</h2>
      <ul className="flex flex-col gap-1">
        {teams.map((m) => (
          <li key={m.team.id}>
            <Link
              href={`/teams/${m.team.id}`}
              className="text-sm hover:underline"
            >
              {m.team.name}
              <span className="ml-2 text-gray-500">({m.team.title.name})</span>
              {m.role === "captain" && " ⭐"}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/teams/new"
        className="mt-4 inline-block rounded bg-black px-3 py-1.5 text-sm text-white"
      >
        Create team
      </Link>
      {invites.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold">Team invites</h2>
          <ul className="flex flex-col gap-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <span className="text-sm">
                  <span className="font-medium">{inv.team.name}</span>
                  <span className="text-gray-500">
                    {" "}
                    — invited by {inv.inviter.display_name}
                  </span>
                </span>
                <span className="flex gap-2">
                  <form action={acceptInvite}>
                    <input type="hidden" name="invite_id" value={inv.id} />
                    <button className="rounded bg-black px-3 py-1 text-sm text-white">
                      Accept
                    </button>
                  </form>
                  <form action={declineInvite}>
                    <input type="hidden" name="invite_id" value={inv.id} />
                    <button className="rounded border px-3 py-1 text-sm hover:bg-gray-100">
                      Decline
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
