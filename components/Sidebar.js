"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wine,
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ITENS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/estoque", label: "Estoque", icon: Boxes },
  { href: "/dashboard/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
];

export default function Sidebar({ nomeEmpresa }) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside className="w-60 shrink-0 bg-panel border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-wine flex items-center justify-center shrink-0">
          <Wine className="w-4 h-4 text-gold" />
        </div>
        <div className="min-w-0">
          <p className="text-cream text-sm font-medium truncate">
            {nomeEmpresa || "Minha adega"}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {ITENS.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                ativo
                  ? "bg-wine text-cream"
                  : "text-muted hover:bg-white/5 hover:text-cream"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={sair}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:bg-white/5 hover:text-cream"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
