type FormFieldProps = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: "number" | "text";
  suffix?: string;
  prefix?: string;
  placeholder?: string;
  hint?: string;
  min?: number;
  step?: string;
};

export function FormField({
  label,
  id,
  value,
  onChange,
  type = "number",
  suffix,
  prefix,
  placeholder = "0",
  hint,
  min = 0,
  step = "any",
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type={type}
          inputMode={type === "number" ? "decimal" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          step={step}
          className={`block w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-300 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 ${
            prefix ? "pl-7" : "pl-3"
          } ${suffix ? "pr-10" : "pr-3"}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
