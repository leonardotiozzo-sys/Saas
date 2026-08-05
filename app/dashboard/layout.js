"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: perfil } = await supabase
        .from("perfis")
        .select("empresa_id, papel")
        .eq("id", session.user.id)
        .single();

       if (!perfil) {
        router.replace("/completar-cadastro");
        return;
      }
      
      if (perfil.papel === "super_admin") {
        router.replace("/admin");
        return;
      }

      const { data: empresaData } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", perfil.empresa_id)
        .single();

      if (empresaData?.status !== "ativo") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setEmpresa(empresaData);
      setCarregando(false);
    })();
  }, [router]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex">
      <Sidebar nomeEmpresa={empresa?.nome} />
      <main className="flex-1 p-6 md:p-8 max-w-6xl">{children}</main>
    </div>
  );
}
