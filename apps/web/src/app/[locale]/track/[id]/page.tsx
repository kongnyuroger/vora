import { TrackScreen } from "@/components/vora/track/track-screen";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TrackScreen rideId={id} />;
}
