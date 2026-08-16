import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // NOT `bg-accent`, shadcn's default: in this project that token is the
        // salon's bright green, so a stock skeleton pulses as a lime block. A
        // faint wash of the foreground reads as "loading" on the near-black
        // surfaces these sit on.
        "animate-pulse rounded-md bg-white/10",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
