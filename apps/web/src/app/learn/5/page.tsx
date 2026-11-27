"use client";

import { AdultLesson } from "@/components/stage5/adult-lesson";
import { KidsLesson } from "@/components/stage5/kids-lesson";
import { useTrack } from "@/lib/track";

export default function Stage5() {
  const { track } = useTrack();
  return track === "kids" ? <KidsLesson /> : <AdultLesson />;
}
