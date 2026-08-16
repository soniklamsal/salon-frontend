import {
  FormSkeleton,
  LoadingLabel,
  PageHeaderSkeleton,
} from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the contact details are fetched from the CMS. */
export default function ContactLoading() {
  return (
    <main className="flex-1 bg-[#0a0a0a]">
      <LoadingLabel what="contact details" />
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-28 pb-16 sm:px-10 sm:pt-32 md:pt-40 md:pb-20 xl:px-16">
        <PageHeaderSkeleton />
        {/* The map band, then the two columns under it. */}
        <Skeleton aria-hidden className="mt-10 aspect-[16/9] w-full md:aspect-[21/9]" />
        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div aria-hidden className="space-y-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-4 h-6 w-40" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </div>
            ))}
          </div>
          <FormSkeleton />
        </div>
      </div>
    </main>
  );
}
