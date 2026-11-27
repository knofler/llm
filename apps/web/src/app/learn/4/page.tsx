"use client";

import { AdultLesson } from "@/components/stage4/adult-lesson";
import { KidsLesson } from "@/components/stage4/kids-lesson";
import { useTrack } from "@/lib/track";

export default function Stage4() {
  const { track } = useTrack();
  return track === "kids" ? <KidsLesson /> : <AdultLesson />;
}
