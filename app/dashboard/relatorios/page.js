"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { currency, formatDate } from "@/lib/utils";

const PERIODOS = [
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
  { label: "90 dias", dias: 90 },
];

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState(30);
  const [vendas, setVendas] = useState([]);
  const [itens, setItens] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, [periodo]);

  async function carregar() {
    setCarregando(true);
    const desde = new Date();
    desde.setDate(desde.getDate() - periodo);

    const { data: vendasData } = await supabase
      .from("vendas")
      .select("id, total, created_at")
      .gte("created_at", desde.toISOString())
      .order("created_at");

    const idsVenda = (vendasData || []).map((v) => v.id);
    const { data: itensData } =
      idsVenda.length > 0
        ? await supabase.from("itens_venda").select("*").in("venda_id", idsVenda)
        : { data: [] };

    const { data: prodsData } = await supabase.from("produtos").select("*");

    setVendas(vendasData || []);
    setItens(itensData || []);
    setProdutos(prodsData || []);
    setCarregando(false);
  }

  const receitaTotal = vendas.reduce((acc, v) => acc + Number(v.total), 0);
  const ticketMedio = vendas.length > 0 ? receitaTotal / vendas.length : 0;

  const dadosGrafico = useMemo(() => {
    const porDia = {};
    vendas.forEach((v) => {
      const dia = formatDate(v.created_at);
      porDia[dia] = (porDia[dia] || 0) + Number(v.total);
    });
    return Object.entries(porDia).map(([dia, total]) => ({ dia, total }));
  }, [vendas]);

  const topProdutos = useMemo(() => {
    const porProduto = {};
    itens.forEach((i) => {
      if (!porProduto[i.nome_produto]) {
        porProduto[i.nome_produto] = { nome: i.nome_produto, quantidade: 0, receita: 0 };
      }
      porProduto[i.nome_produto].quantidade += i.quantidade;
      porProduto[i.nome_produto].receita += Number(i.preco_unitario) * i.quantidade;
    });
    return Object.values(porProduto)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 5);
  }, [itens]);

  const estoqueBaixo = produtos.filter((p) => p.ativo && p.estoque <= p.estoque_minimo);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-cream">Relatórios</h1>
          <p className="text-muted text-sm">Desempenho da sua adega</p>
        </div>
        <div className="flex gap-1.5 bg-panel border border-white/10 rounded-lg p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              onClick={() => setPeriodo(p.dias)}
              className={`px-3 py-1.5 rounded-md text-xs ${
                periodo === p.dias ? "bg-wine text-cream" : "text-muted hover:text-cream"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <p className="text-muted text-sm">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-panel border border-white/10 rounded-2xl p-5">
              <p className="text-muted text-xs mb-1">Receita no período</p>
              <p className="text-cream text-2xl font-display">{currency(receitaTotal)}</p>
            </div>
            <div className="bg-panel border border-white/10 rounded-2xl p-5">
              <p className="text-muted text-xs mb-1">Vendas no período</p>
              <p className="text-cream text-2xl font-display">{vendas.length}</p>
            </div>
            <div className="bg-panel border border-white/10 rounded-2xl p-5">
              <p className="text-muted text-xs mb-1">Ticket médio</p>
              <p className="text-cream text-2xl font-display">{currency(ticketMedio)}</p>
            </div>
          </div>

          <div className="bg-panel border border-white/10 rounded-2xl p-5">
            <h2 className="text-cream text-sm font-medium mb-4">Receita por dia</h2>
            {dadosGrafico.length === 0 ? (
              <p className="text-muted text-sm">Sem vendas nesse período.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="dia" stroke="#A9998A" fontSize={12} />
                    <YAxis stroke="#A9998A" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E1815",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        color: "#F3E9D6",
                      }}
                      formatter={(v) => currency(v)}
                    />
                    <Bar dataKey="total" fill="#C6A15B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-panel border border-white/10 rounded-2xl p-5">
              <h2 className="text-cream text-sm font-medium mb-3">Top 5 produtos</h2>
              {topProdutos.length === 0 ? (
                <p className="text-muted text-sm">Sem dados no período.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {topProdutos.map((p) => (
                    <li
                      key={p.nome}
                      className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0"
                    >
                      <span className="text-cream">{p.nome}</span>
                      <span className="text-muted">
                        {p.quantidade} un. · <span className="text-gold">{currency(p.receita)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-panel border border-white/10 rounded-2xl p-5">
              <h2 className="text-cream text-sm font-medium mb-3">Estoque baixo</h2>
              {estoqueBaixo.length === 0 ? (
                <p className="text-muted text-sm">Nenhum produto em falta.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {estoqueBaixo.map((p) => (
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
          </div>
        </>
      )}
    </div>
  );
}
