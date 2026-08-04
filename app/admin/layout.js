"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, LogOut, Wine } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data: perfil } = await supabase
        .from("perfis")
        .select("papel")
        .eq("id", session.user.id)
        .single();

      if (perfil?.papel !== "super_admin") {
        router.replace("/dashboard");
        return;
      }
      setCarregando(false);
    })();
  }, [router]);

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-wine flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-gold" />
          </div>
          <div>
            <p className="text-cream text-sm font-medium">Painel Super Admin</p>
            <p className="text-muted text-xs flex items-center gap-1">
              <Wine className="w-3 h-3" /> Adega SaaS
            </p>
          </div>
        </div>
        <button
          onClick={sair}
          className="flex items-center gap-1.5 text-muted hover:text-cream text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </header>
      <main className="p-6 md:p-8 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
