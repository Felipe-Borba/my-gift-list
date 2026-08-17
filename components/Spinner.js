function Spinner({ size = "size-4" }) {
  return (
    <svg
      className={`${size} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function FullPageSpinner() {
  return (
    <div
      className="flex min-h-screen items-center justify-center text-primary"
      role="status"
      aria-label="Carregando"
    >
      <Spinner size="size-8" />
    </div>
  );
}

export default Spinner;
