import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeeProfilesManager } from "@/components/settings/FeeProfilesManager";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      subtitle="Configure your seller dashboard preferences"
      activeNav="Settings"
      showActions={false}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        

        <FeeProfilesManager />
      </div>
    </DashboardLayout>
  );
}
