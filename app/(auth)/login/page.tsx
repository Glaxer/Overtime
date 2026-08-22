import Link from "next/link";
import { login } from "../actions";

export default async function LoginPage() {
  return (
    <main className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Log in</h1>
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
