"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wine, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function CadastroPage() {
  const router = useRouter();
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (signUpError) {
      setCarregando(false);
      setErro(signUpError.message);
      return;
    }

    // Se a confirmação de e-mail estiver ativada no projeto Supabase,
    // não haverá sessão ainda — pedimos para o usuário confirmar o e-mail.
    if (!signUpData.session) {
      setCarregando(false);
      setErro(
        "Conta criada! Verifique seu e-mail para confirmar antes de entrar."
      );
      return;
    }

    const { error: rpcError } = await supabase.rpc("criar_empresa_e_perfil", {
      nome_empresa: nomeEmpresa,
      nome_usuario: nomeUsuario,
    });

    setCarregando(false);

    if (rpcError) {
      setErro(rpcError.message);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-wine flex items-center justify-center">
            <Wine className="w-6 h-6 text-gold" />
          </div>
          <h1 className="font-display text-2xl text-cream">Criar minha adega</h1>
          <p className="text-muted text-sm text-center">
            Cadastre sua empresa e comece a usar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Nome da adega/loja</label>
            <input
              required
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
              placeholder="Adega do João"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Seu nome</label>
            <input
              required
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
              placeholder="João Silva"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
              placeholder="mínimo 6 caracteres"
            />
          </div>

          {erro && <p className="text-gold text-xs">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 bg-wine hover:bg-wineLight transition-colors text-cream text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {carregando && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar conta
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
