"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wine, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setCarregando(false);
    if (error) {
      setErro(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message
      );
      return;
    }
    router.replace("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-wine flex items-center justify-center">
            <Wine className="w-6 h-6 text-gold" />
          </div>
          <h1 className="font-display text-2xl text-cream">Adega SaaS</h1>
          <p className="text-muted text-sm">Entre na sua conta</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
        >
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
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>

          {erro && <p className="text-rust text-xs">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 bg-wine hover:bg-wineLight transition-colors text-cream text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {carregando && <Loader2 className="w-4 h-4 animate-spin" />}
            Entrar
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-gold hover:underline">
            Criar minha adega
          </Link>
        </p>
      </div>
    </div>
  );
}
