import { redirect } from "next/navigation";

export default function AdminBackupRedirectPage() {
  redirect("/admin?tab=backups");
}
