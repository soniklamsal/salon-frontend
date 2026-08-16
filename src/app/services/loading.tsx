import { LoadingLabel, PageHeaderSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the services and barbers are fetched for the booking form. */
export default function ServicesLoading() {
  return (
    <main className="flex-1 bg-[#0a0a0a]">
      <LoadingLabel what="the booking form" />
      <div className="mx-auto w-full max-w-[1000px] px-5 pt-28 pb-20 sm:px-8 sm:pt-32 md:pt-40 md:pb-28">
        <PageHeaderSkeleton />
        <div
          aria-hidden
          className="border-border mt-12 rounded-2xl border p-5 sm:mt-14 sm:p-8 md:p-10"
        >
          {/* The step bar, then the service cards it starts on. */}
          <div className="mb-10 flex flex-wrap gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-full" />
            ))}
          </div>
          <Skeleton className="mb-6 h-8 w-64" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
