const TONES = {
  danger: "border-danger bg-danger-soft text-danger",
  success: "border-success bg-success-soft text-success",
  info: "border-info bg-info-soft text-info",
};

function Alert({ tone = "info", message, action }) {
  return (
    <div
      role="alert"
      className={`rounded-lg border-l-4 p-3 text-sm ${TONES[tone]}`}
    >
      <p className="font-medium">{message}</p>
      {action && <p className="mt-1 opacity-80">{action}</p>}
    </div>
  );
}

export default Alert;
