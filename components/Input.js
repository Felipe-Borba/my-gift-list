import { useId } from "react";

function Input({ label, error, hint, ...inputProps }) {
  const generatedId = useId();
  const id = inputProps.id || generatedId;

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={`min-h-11 w-full rounded-lg border bg-surface px-3 text-sm text-text placeholder:text-text-muted focus:outline-2 focus:outline-offset-1 disabled:cursor-not-allowed disabled:bg-slate-100 ${
          error
            ? "border-danger focus:outline-danger"
            : "border-border focus:outline-primary"
        }`}
        {...inputProps}
      />
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
