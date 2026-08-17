function Card({ children }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      {children}
    </div>
  );
}

export default Card;
