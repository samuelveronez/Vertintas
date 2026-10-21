import Link from "next/link";

const styles = {
  primary: "bg-forest text-white hover:bg-ink",
  whatsapp: "bg-whatsapp text-white hover:bg-forest",
  outline: "border-2 border-forest text-forest hover:bg-forest hover:text-white",
} as const;

type Props = {
  href: string;
  variant?: keyof typeof styles;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function ButtonLink({
  href,
  variant = "primary",
  external,
  children,
  className = "",
}: Props) {
  const cls = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-bold transition-colors ${styles[variant]} ${className}`;
  return external ? (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export const buttonClass = (variant: keyof typeof styles = "primary") =>
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-bold transition-colors disabled:opacity-50 ${styles[variant]}`;
