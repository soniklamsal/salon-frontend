import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * shadcn's class merger: `clsx` for conditionals, `tailwind-merge` so a prop
 * passed in beats the component's own class instead of both landing in the
 * markup and the later one winning by accident.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
