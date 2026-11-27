"use client";

import { AdultLesson } from "@/components/stage7/adult-lesson";
import { KidsLesson } from "@/components/stage7/kids-lesson";
import { useTrack } from "@/lib/track";

export default function Stage7() {
  const { track } = useTrack();
  return track === "kids" ? <KidsLesson /> : <AdultLesson />;
}
