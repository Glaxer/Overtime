import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold">Overtime</h1>
      <p className="mb-6 text-text-default">
        Tournaments and leagues for Rocket League — and whatever you play next.
      </p>
      <Link
        href="/competitions"
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-on-accent hover:bg-primary-hover"
      >
        Browse competitions
      </Link>
    </div>
  );
}
