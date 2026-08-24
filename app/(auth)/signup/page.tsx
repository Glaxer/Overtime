// app/(auth)/signup/page.tsx
import Link from "next/link";
import { signup } from "../actions";
import Button from "@/components/ui/Button";

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
          className="rounded border border-border p-2"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border border-border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={6}
          className="rounded border border-border p-2"
        />
        <Button className="w-full">Sign up</Button>
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
