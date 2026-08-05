"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wine, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function CompletarCadastroPage() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

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

      if (perfil) {
        // já tem cadastro completo, não precisa estar aqui
        router.replace(perfil.papel === "super_admin" ? "/admin" : "/dashboard");
        return;
      }
      setVerificando(false);
    })();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (!nomeEmpresa.trim() || !nomeUsuario.trim()) {
      setErro("Preencha os dois campos.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.rpc("criar_empresa_e_perfil", {
      nome_empresa: nomeEmpresa,
      nome_usuario: nomeUsuario,
    });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.replace("/dashboard");
  }

  if (verificando) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-wine flex items-center justify-center">
            <Wine className="w-6 h-6 text-gold" />
          </div>
          <h1 className="font-display text-2xl text-cream text-center">
            Só mais um passo
          </h1>
          <p className="text-muted text-sm text-center">
            Seu e-mail já foi confirmado. Agora finalize o cadastro da sua adega.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Nome da adega/loja</label>
            <input
              autoFocus
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
              placeholder="Adega do João"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Seu nome</label>
            <input
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
              placeholder="João Silva"
            />
          </div>

          {erro && <p className="text-rust text-xs">{erro}</p>}

          <button
            type="submit"
            disabled={salvando}
            className="mt-2 bg-wine hover:bg-wineLight transition-colors text-cream text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
            Concluir cadastro
          </button>
        </form>
      </div>
    </div>
  );
}
