import { iconResponse } from "@/lib/pwa-icon";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return iconResponse(48, "favicon");
}
