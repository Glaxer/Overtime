import Link from "next/link";
import { login } from "../actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Log in</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      {message && <p className="mb-4 text-green-600">{message}</p>}
      <form action={login} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="rounded border p-2"
        />
        <button className="rounded bg-black p-2 text-white">Log in</button>
      </form>
      <p className="mt-4 text-sm">
        No account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
