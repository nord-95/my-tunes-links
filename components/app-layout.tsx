"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { LayoutDashboard, Link2, Music, Users, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/releases", label: "Releases", icon: Music },
  { href: "/artists", label: "Artists", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

export default function AppLayout({ children, title, action }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <span className="font-semibold text-gray-900 text-sm tracking-tight">My Tunes</span>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          {userEmail && (
            <p className="text-xs text-gray-400 truncate px-3 mb-1">{userEmail}</p>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {(title || action) && (
          <header className="h-14 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
            {title && <h1 className="text-sm font-semibold text-gray-900">{title}</h1>}
            {action && <div>{action}</div>}
          </header>
        )}
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
