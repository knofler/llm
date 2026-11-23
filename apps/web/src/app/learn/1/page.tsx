"use client";

import { AdultLesson } from "@/components/stage1/adult-lesson";
import { KidsLesson } from "@/components/stage1/kids-lesson";
import { useTrack } from "@/lib/track";

export default function Stage1() {
  const { track } = useTrack();
  return track === "kids" ? <KidsLesson /> : <AdultLesson />;
}
