import {
  BandSkeleton,
  HeroSkeleton,
  LoadingLabel,
} from "@/components/shared/skeletons";

/** Shown while the home page's content is fetched from Django. */
export default function HomeLoading() {
  return (
    <main className="flex-1">
      <LoadingLabel what="the page" />
      <HeroSkeleton />
      <BandSkeleton />
      <BandSkeleton tall />
      <BandSkeleton />
    </main>
  );
}
