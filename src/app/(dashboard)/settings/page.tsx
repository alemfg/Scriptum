import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsClient } from "@/components/layout/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();

  const aiSettings = await db.aISettings.findUnique({
    where: { userId: session!.user.id },
  });

  return <SettingsClient user={session!.user} aiSettings={aiSettings} />;
}
