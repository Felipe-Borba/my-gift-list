import Link from "next/link";

function TextLink({ href, children }) {
  return (
    <Link
      href={href}
      className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </Link>
  );
}

export default TextLink;
