export default async function TitlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <h1 className="text-2xl font-bold">{slug}</h1>;
}
