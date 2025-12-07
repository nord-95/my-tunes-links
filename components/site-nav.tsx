"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Link as LinkIcon, Settings, BarChart3 } from "lucide-react";

const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon?: any }) => {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
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
          <NavLink href="/" label="Dashboard" icon={BarChart3} />
          <NavLink href="/releases" label="Releases" icon={Music} />
          <NavLink href="/releases/new" label="New Release" icon={Music} />
          <NavLink href="/settings" label="Settings" icon={Settings} />
        </nav>
      </div>
    </header>
  );
}


