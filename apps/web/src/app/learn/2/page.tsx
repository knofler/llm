"use client";

import { AdultLesson } from "@/components/stage2/adult-lesson";
import { KidsLesson } from "@/components/stage2/kids-lesson";
import { useTrack } from "@/lib/track";

export default function Stage2() {
  const { track } = useTrack();
  return track === "kids" ? <KidsLesson /> : <AdultLesson />;
}
