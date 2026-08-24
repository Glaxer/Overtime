import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold">Overtime</h1>
      <p className="mb-6 text-gray-500">
        Tournaments and leagues for Rocket League — and whatever you play next.
      </p>
      <Link
        href="/competitions"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Browse competitions
      </Link>
    </div>
  );
}
