"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NavLink = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      {label}
    </Link>
  );
};

export default function SiteNav() {
  return (
    <header className="border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl flex items-center justify-between h-14 px-4">
        <Link href="/" className="font-semibold">
          My Tunes
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/" label="Home" />
          <NavLink href="/settings" label="Settings" />
        </nav>
      </div>
    </header>
  );
}


