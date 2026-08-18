import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export default async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? null;
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r p-4">
      {/* Logo */}
      <Link href="/" className="mb-8 text-xl font-bold">
        Overtime
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        <Link
          href="/titles"
          className="rounded px-2 py-1.5 text-sm hover:bg-gray-100"
        >
          Titles
        </Link>
        {user && (
          <Link
            href="/dashboard"
            className="rounded px-2 py-1.5 text-sm hover:bg-gray-100"
          >
            Dashboard
          </Link>
        )}
      </nav>

      {/* Auth section — pinned to the bottom */}
      <div className="mt-auto flex flex-col gap-2 border-t pt-4">
        {user ? (
          <>
            <span className="px-2 text-sm text-gray-600">{displayName}</span>
            <form action={logout}>
              <button className="w-full rounded border px-2 py-1.5 text-left text-sm hover:bg-gray-100">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded px-2 py-1.5 text-sm hover:bg-gray-100"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded bg-black px-2 py-1.5 text-center text-sm text-white"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
