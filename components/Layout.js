import Link from "next/link";
import { useRouter } from "next/router";

const ROLE_LABELS = {
  admin: "Administrador",
  teacher: "Professor",
  student: "Aluno",
};

function navItemsFor(user) {
  if (user.role === "student") {
    return [{ href: `/students/${user.username}`, label: "Minha evolução" }];
  }

  return [
    { href: "/evaluations", label: "Avaliações" },
    { href: "/users", label: user.role === "teacher" ? "Alunos" : "Usuários" },
  ];
}

function Layout({ user, onLogout, children }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="text-lg font-bold text-primary">
            IMC Manager
          </Link>

          <nav className="order-last flex w-full gap-1 sm:order-none sm:w-auto sm:flex-1">
            {navItemsFor(user).map((item) => {
              const isActive = router.pathname.startsWith(
                item.href.split("/").slice(0, 2).join("/"),
              );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:bg-slate-100 hover:text-text"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3 sm:ml-0">
            <div className="text-right">
              <p className="text-sm font-medium text-text">{user.name}</p>
              <p className="text-xs text-text-muted">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-11 cursor-pointer rounded-lg px-3 text-sm font-medium text-text-muted transition-colors hover:bg-slate-100 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

export default Layout;
