"use client";

import { AdultLesson } from "@/components/stage3/adult-lesson";
import { KidsLesson } from "@/components/stage3/kids-lesson";
import { useTrack } from "@/lib/track";

export default function Stage3() {
  const { track } = useTrack();
  return track === "kids" ? <KidsLesson /> : <AdultLesson />;
}
