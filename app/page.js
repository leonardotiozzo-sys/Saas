"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wine } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

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

     if (!perfil) {
        router.replace("/completar-cadastro");
      } else if (perfil.papel === "super_admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
      setChecking(false);
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-cream">
      <Wine className="w-10 h-10 text-gold animate-pulse" />
      <p className="text-muted font-sans text-sm">
        {checking ? "Carregando sua conta..." : "Redirecionando..."}
      </p>
    </div>
  );
}
