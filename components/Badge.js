const TONES = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  caution: "bg-caution-soft text-caution",
  danger: "bg-danger-soft text-danger",
};

function Badge({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export default Badge;
