import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("titles").select("*");
  return <pre>{JSON.stringify({ data, error }, null, 2)}</pre>;
}
