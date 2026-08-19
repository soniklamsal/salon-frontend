import { LoadingLabel, PageHeaderSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the status page renders; the table has its own skeleton too. */
export default function StatusLoading() {
  return (
    <main className="flex-1 bg-[#0a0a0a]">
      <LoadingLabel what="your bookings" />
      <div className="mx-auto w-full max-w-[1100px] px-5 below-header pb-20 sm:px-8 md:pb-28">
        <PageHeaderSkeleton />
        <div aria-hidden className="border-border mt-10 rounded-xl border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-border flex gap-6 border-b p-5 last:border-b-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
