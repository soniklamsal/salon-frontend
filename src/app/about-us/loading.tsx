import { BandSkeleton, LoadingLabel } from "@/components/shared/skeletons";

/** Shown while About Us renders. */
export default function AboutUsLoading() {
  return (
    <main className="flex-1 bg-[#0a0a0a] pt-28">
      <LoadingLabel what="About Us" />
      <BandSkeleton />
      <BandSkeleton tall />
    </main>
  );
}