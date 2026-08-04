"use client";

import { useEffect, useState } from "react";
import { Package, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { currency, formatDateTime } from "@/lib/utils";
import StatCard from "@/components/StatCard";

export default function DashboardPage() {
  const [produtos, setProdutos] = useState([]);
  const [vendasMes, setVendasMes] = useState([]);
  const [vendasRecentes, setVendasRecentes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);

    const primeiroDiaMes = new Date();
    primeiroDiaMes.setDate(1);
    primeiroDiaMes.setHours(0, 0, 0, 0);

    const [{ data: prods }, { data: vMes }, { data: vRecentes }] = await Promise.all([
      supabase.from("produtos").select("*").eq("ativo", true),
      supabase
        .from("vendas")
        .select("id, total, created_at")
        .gte("created_at", primeiroDiaMes.toISOString()),
      supabase
        .from("vendas")
        .select("id, total, created_at, clientes(nome)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    setProdutos(prods || []);
    setVendasMes(vMes || []);
    setVendasRecentes(vRecentes || []);
    setCarregando(false);
  }

  const valorEmEstoque = produtos.reduce(
    (acc, p) => acc + Number(p.preco_custo || 0) * Number(p.estoque || 0),
    0
  );
  const totalVendasMes = vendasMes.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const estoqueBaixo = produtos.filter((p) => p.estoque <= p.estoque_minimo);

  if (carregando) {
    return <p className="text-muted text-sm">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-cream">Dashboard</h1>
        <p className="text-muted text-sm">Visão geral da sua adega</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Produtos ativos" value={produtos.length} icon={Package} />
        <StatCard
          label="Valor em estoque"
          value={currency(valorEmEstoque)}
          icon={DollarSign}
          tone="sage"
        />
        <StatCard
          label="Vendas do mês"
          value={currency(totalVendasMes)}
          icon={TrendingUp}
          tone="gold"
        />
        <StatCard
          label="Estoque baixo"
          value={estoqueBaixo.length}
          icon={AlertTriangle}
          tone="rust"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-panel border border-white/10 rounded-2xl p-5">
          <h2 className="text-cream text-sm font-medium mb-3">Alertas de estoque baixo</h2>
          {estoqueBaixo.length === 0 ? (
            <p className="text-muted text-sm">Tudo certo por aqui — nenhum produto em falta.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {estoqueBaixo.slice(0, 6).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0"
                >
                  <span className="text-cream">{p.nome}</span>
                  <span className="text-rust">{p.estoque} un.</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-panel border border-white/10 rounded-2xl p-5">
          <h2 className="text-cream text-sm font-medium mb-3">Vendas recentes</h2>
          {vendasRecentes.length === 0 ? (
            <p className="text-muted text-sm">Nenhuma venda registrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {vendasRecentes.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0"
                >
                  <div>
                    <p className="text-cream">{v.clientes?.nome || "Venda avulsa"}</p>
                    <p className="text-muted text-xs">{formatDateTime(v.created_at)}</p>
                  </div>
                  <span className="text-gold">{currency(v.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
