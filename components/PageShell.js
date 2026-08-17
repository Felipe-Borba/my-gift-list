function PageShell({ children }) {
  return <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</div>;
}

PageShell.Header = function PageShellHeader({ title, subtitle, actions }) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
};

PageShell.Content = function PageShellContent({ children }) {
  return <main className="flex flex-col gap-6">{children}</main>;
};

PageShell.Section = function PageShellSection({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
};

export default PageShell;
