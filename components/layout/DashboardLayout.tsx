import { Sidebar } from "./Sidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  activeNav?: string;
  showActions?: boolean;
};

export function DashboardLayout({
  children,
  title,
  subtitle,
  activeNav = "Dashboard",
  showActions = true,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f6f8fa]">
      <Sidebar activeItem={activeNav} />

      <div className="flex flex-1 flex-col lg:ml-0">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8 lg:pl-8">
          <div className="flex items-center justify-between gap-4 pl-12 lg:pl-0">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {showActions && (
                <>
                  <button
                    type="button"
                    className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:inline-flex"
                  >
                    Export Report
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="hidden sm:inline">Add Product</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
