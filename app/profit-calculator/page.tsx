import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProfitCalculator } from "@/components/profit-calculator/ProfitCalculator";

export default function ProfitCalculatorPage() {
  return (
    <DashboardLayout
      title="Profit Calculator"
      subtitle="Calculate per-unit profit across Amazon, Flipkart, and Meesho"
      activeNav="Profit Calculator"
      showActions={false}
    >
      <ProfitCalculator />
    </DashboardLayout>
  );
}
