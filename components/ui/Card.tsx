type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  id?: string;
};

export function Card({ children, className = "", title, subtitle, action, id }: CardProps) {
  return (
    <div
      id={id}
      className={`rounded-xl border border-slate-200/80 bg-white shadow-sm ${id ? "scroll-mt-24" : ""} ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={title || action ? "p-5" : "p-5"}>{children}</div>
    </div>
  );
}
