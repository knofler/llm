import { STAGES } from "@/content/ladder";
import { cn } from "@/lib/utils";

/** Adults' sidebar: the model as a column of boxes, one box per stage. */
export function ModelSoFar({ now }: { now: number }) {
  return (
    <aside aria-label="Your model so far" className="grid content-start gap-3.5 border-b border-a-rule bg-a-alt px-[22px] py-7 md:border-r md:border-b-0">
      <h2 className="font-mono text-[11px] font-medium uppercase leading-none tracking-[0.1em] text-a-cap">Your model so far</h2>
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-1 md:gap-3.5">
        {STAGES.map((s) => {
          const state = s.n === now ? "now" : s.n < now ? "built" : "later";
          return (
            <li
              key={s.n}
              className={cn(
                "relative grid gap-px rounded-md border px-3 py-[9px]",
                "md:[&:not(:last-child)]:after:absolute md:[&:not(:last-child)]:after:top-full md:[&:not(:last-child)]:after:left-[22px] md:[&:not(:last-child)]:after:h-3.5 md:[&:not(:last-child)]:after:w-px md:[&:not(:last-child)]:after:bg-a-wire md:[&:not(:last-child)]:after:content-['']",
                state === "now" && "border-a-acc bg-a-node shadow-[0_0_0_4px] shadow-a-acc/15",
                state === "built" && "border-a-wire bg-a-node",
                state === "later" && "border-dashed border-a-wire",
              )}
            >
              <b className={cn("font-display text-[13.5px] leading-tight", state === "later" ? "font-normal text-a-cap" : "font-medium")}>{s.plain}</b>
              <i className={cn("font-mono text-[11px] not-italic leading-snug", state === "now" ? "text-a-acc" : "text-a-cap")}>
                {state === "now" ? "building now" : state === "built" ? `✓ stage ${s.n}` : `stage ${s.n}`}
              </i>
            </li>
          );
        })}
      </ol>
      <p className="mt-1.5 text-sm leading-normal text-a-cap">
        Each stage adds one box. By stage 6 this diagram is a complete language model, and you&apos;ll have built every box in it.
      </p>
    </aside>
  );
}
