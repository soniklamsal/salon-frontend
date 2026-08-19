import { BandSkeleton, LoadingLabel } from "@/components/shared/skeletons";

/** Shown while About Us renders. */
export default function AboutUsLoading() {
  return (
    <main className="below-header flex-1 bg-[#0a0a0a]">
      <LoadingLabel what="About Us" />
      <BandSkeleton />
      <BandSkeleton tall />
    </main>
  );
}