function Table({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}

Table.Head = function TableHead({ children }) {
  return (
    <thead className="bg-slate-50 text-left text-xs tracking-wide text-text-muted uppercase">
      <tr>{children}</tr>
    </thead>
  );
};

Table.Column = function TableColumn({ children }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
};

Table.Body = function TableBody({ children }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
};

Table.Row = function TableRow({ children }) {
  return <tr className="hover:bg-slate-50">{children}</tr>;
};

Table.Cell = function TableCell({ children }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
};

Table.Empty = function TableEmpty({ colSpan, children }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-10 text-center text-sm text-text-muted"
      >
        {children}
      </td>
    </tr>
  );
};

export default Table;
