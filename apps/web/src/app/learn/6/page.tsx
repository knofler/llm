"use client";

import { AdultLesson } from "@/components/stage6/adult-lesson";
import { KidsLesson } from "@/components/stage6/kids-lesson";
import { useTrack } from "@/lib/track";

export default function Stage6() {
  const { track } = useTrack();
  return track === "kids" ? <KidsLesson /> : <AdultLesson />;
}
