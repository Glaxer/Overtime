// app/(auth)/signup/page.tsx
import Link from "next/link";
import { signup } from "../actions";

export default async function SignupPage() {
  return (
    <main className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign up</h1>
      <form action={signup} className="flex flex-col gap-3">
        <input
          name="display_name"
          type="text"
          placeholder="Display name"
          required
          className="rounded border p-2"
        />
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
          minLength={6}
          className="rounded border p-2"
        />
        <button className="rounded bg-black p-2 text-white">Sign up</button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
