import { redirect } from "next/navigation";

import { Setup } from "@/components/setup";
import { hasDatabase } from "@/lib/db";

export default function SetupPage() {
  if (hasDatabase) redirect("/");
  return <Setup />;
}
