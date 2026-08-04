"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { currency, formatDate } from "@/lib/utils";
import StatCard from "@/components/StatCard";

export default function AdminPage() {
  const [empresas, setEmpresas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [alternando, setAlternando] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  }

  async function carregar() {
    setCarregando(true);
    const token = await getToken();
    const res = await fetch("/api/admin/empresas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setEmpresas(data.empresas || []);
    setCarregando(false);
  }

  async function alternarStatus(empresa) {
    setAlternando(empresa.id);
    const token = await getToken();
    const novoStatus = empresa.status === "ativo" ? "suspenso" : "ativo";
    await fetch("/api/admin/empresas/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ empresaId: empresa.id, status: novoStatus }),
    });
    setAlternando(null);
    await carregar();
  }

  const ativas = empresas.filter((e) => e.status === "ativo");
  const faturamentoTotal = empresas.reduce((acc, e) => acc + e.total_vendas, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-cream">Empresas cadastradas</h1>
        <p className="text-muted text-sm">Gerencie os comerciantes da plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total de empresas" value={empresas.length} icon={Building2} />
        <StatCard label="Empresas ativas" value={ativas.length} icon={CheckCircle2} tone="sage" />
        <StatCard
          label="Faturamento total (GMV)"
          value={currency(faturamentoTotal)}
          tone="gold"
        />
      </div>

      <div className="bg-panel border border-white/10 rounded-2xl overflow-hidden">
        {carregando ? (
          <p className="p-5 text-muted text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </p>
        ) : empresas.length === 0 ? (
          <p className="p-5 text-muted text-sm">Nenhuma empresa cadastrada ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-white/10">
                <th className="px-4 py-3 font-normal">Empresa</th>
                <th className="px-4 py-3 font-normal">Plano</th>
                <th className="px-4 py-3 font-normal">Produtos</th>
                <th className="px-4 py-3 font-normal">Vendas (total)</th>
                <th className="px-4 py-3 font-normal">Criada em</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e) => (
                <tr key={e.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-cream">{e.nome}</p>
                    <p className="text-muted text-xs">{e.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted capitalize">{e.plano}</td>
                  <td className="px-4 py-3 text-muted">{e.total_produtos}</td>
                  <td className="px-4 py-3 text-cream">{currency(e.total_vendas)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(e.created_at)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        e.status === "ativo"
                          ? "bg-sage/20 text-sage"
                          : "bg-rust/20 text-rust"
                      }`}
                    >
                      {e.status === "ativo" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alternarStatus(e)}
                      disabled={alternando === e.id}
                      className="text-xs text-gold hover:underline disabled:opacity-50"
                    >
                      {e.status === "ativo" ? "Suspender" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
