import BountyDetail from "./bounty-detail";

export default async function BountyDetailPage({
  params,
}: {
  params: Promise<{ bountyId: string }>;
}) {
  const { bountyId } = await params;
  return <BountyDetail bountyId={bountyId} />;
}
