import { Button } from "@/components/ui/button";

// Stage 0 shell. The real lesson pages (adult + kids tracks) are ported in by
// the personal lane; this page only proves the Tailwind v4 + shadcn wiring.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">Stage 0</p>
      <h1 className="text-4xl font-semibold tracking-tight">llm</h1>
      <p className="text-lg text-muted-foreground">
        A tiny GPT built from scratch in Rust, one idea at a time, with an animated lesson for every stage.
      </p>
      <div className="flex gap-3">
        <Button disabled>Adult track (soon)</Button>
        <Button variant="outline" disabled>
          Kids track (soon)
        </Button>
      </div>
    </main>
  );
}
