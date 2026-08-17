import { useId } from "react";

function Select({ label, error, children, ...selectProps }) {
  const generatedId = useId();
  const id = selectProps.id || generatedId;

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={`min-h-11 w-full rounded-lg border bg-surface px-3 text-sm text-text focus:outline-2 focus:outline-offset-1 disabled:cursor-not-allowed disabled:bg-slate-100 ${
          error
            ? "border-danger focus:outline-danger"
            : "border-border focus:outline-primary"
        }`}
        {...selectProps}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;
