"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, AlertTriangle, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatDateTime } from "@/lib/utils";

export default function EstoquePage() {
  const [empresaId, setEmpresaId] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [ajuste, setAjuste] = useState(null); // { produto, tipo }

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    const { data: perfil } = await supabase
      .from("perfis")
      .select("empresa_id")
      .eq("id", userId)
      .single();
    setEmpresaId(perfil?.empresa_id);
    await carregar();
  }

  async function carregar() {
    setCarregando(true);
    const [{ data: prods }, { data: movs }] = await Promise.all([
      supabase.from("produtos").select("*").eq("ativo", true).order("nome"),
      supabase
        .from("movimentos_estoque")
        .select("*, produtos(nome)")
        .order("created_at", { ascending: false })
        .limit(15),
    ]);
    setProdutos(prods || []);
    setMovimentos(movs || []);
    setCarregando(false);
  }

  async function confirmarAjuste(quantidade, motivo) {
    const { produto, tipo } = ajuste;
    const novoEstoque =
      tipo === "entrada" ? produto.estoque + quantidade : produto.estoque - quantidade;

    if (novoEstoque < 0) {
      throw new Error("Estoque não pode ficar negativo.");
    }

    const { error: err1 } = await supabase
      .from("produtos")
      .update({ estoque: novoEstoque })
      .eq("id", produto.id);
    if (err1) throw err1;

    const { error: err2 } = await supabase.from("movimentos_estoque").insert({
      empresa_id: empresaId,
      produto_id: produto.id,
      tipo,
      quantidade,
      motivo,
    });
    if (err2) throw err2;

    setAjuste(null);
    await carregar();
  }

  const estoqueBaixo = produtos.filter((p) => p.estoque <= p.estoque_minimo);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-cream">Estoque</h1>
        <p className="text-muted text-sm">Ajuste entradas e saídas de produtos</p>
      </div>

      {estoqueBaixo.length > 0 && (
        <div className="bg-rust/10 border border-rust/30 rounded-2xl p-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rust mt-0.5 shrink-0" />
          <p className="text-sm text-cream">
            {estoqueBaixo.length} produto(s) com estoque abaixo do mínimo:{" "}
            <span className="text-rust">
              {estoqueBaixo.map((p) => p.nome).join(", ")}
            </span>
          </p>
        </div>
      )}

      <div className="bg-panel border border-white/10 rounded-2xl overflow-hidden">
        {carregando ? (
          <p className="p-5 text-muted text-sm">Carregando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-white/10">
                <th className="px-4 py-3 font-normal">Produto</th>
                <th className="px-4 py-3 font-normal">Estoque atual</th>
                <th className="px-4 py-3 font-normal">Mínimo</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-cream">{p.nome}</td>
                  <td className="px-4 py-3">
                    <span className={p.estoque <= p.estoque_minimo ? "text-rust" : "text-cream"}>
                      {p.estoque} un.
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.estoque_minimo} un.</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setAjuste({ produto: p, tipo: "entrada" })}
                        className="flex items-center gap-1 text-xs bg-sage/20 text-sage rounded-lg px-2.5 py-1.5 hover:bg-sage/30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        Entrada
                      </button>
                      <button
                        onClick={() => setAjuste({ produto: p, tipo: "saida" })}
                        className="flex items-center gap-1 text-xs bg-rust/20 text-rust rounded-lg px-2.5 py-1.5 hover:bg-rust/30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        Saída
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-panel border border-white/10 rounded-2xl p-5">
        <h2 className="text-cream text-sm font-medium mb-3">Últimas movimentações</h2>
        {movimentos.length === 0 ? (
          <p className="text-muted text-sm">Nenhuma movimentação registrada.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {movimentos.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0"
              >
                <div className="flex items-center gap-2">
                  {m.tipo === "entrada" ? (
                    <ArrowUp className="w-3.5 h-3.5 text-sage" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 text-rust" />
                  )}
                  <span className="text-cream">{m.produtos?.nome}</span>
                  <span className="text-muted text-xs">{m.motivo}</span>
                </div>
                <div className="text-right">
                  <p className="text-cream">{m.quantidade} un.</p>
                  <p className="text-muted text-xs">{formatDateTime(m.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {ajuste && (
        <AjusteModal
          ajuste={ajuste}
          onConfirm={confirmarAjuste}
          onClose={() => setAjuste(null)}
        />
      )}
    </div>
  );
}

function AjusteModal({ ajuste, onConfirm, onClose }) {
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const { produto, tipo } = ajuste;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    const qtd = Number(quantidade);
    if (!qtd || qtd <= 0) {
      setErro("Informe uma quantidade válida.");
      return;
    }
    setSalvando(true);
    try {
      await onConfirm(qtd, motivo || (tipo === "entrada" ? "Reposição" : "Ajuste"));
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-panel border border-white/10 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-cream font-display text-lg">
            {tipo === "entrada" ? "Entrada de estoque" : "Saída de estoque"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-cream">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <p className="text-sm text-cream">{produto.nome}</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Quantidade</label>
            <input
              type="number"
              min="1"
              autoFocus
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Motivo (opcional)</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={tipo === "entrada" ? "Compra, reposição..." : "Perda, avaria..."}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
            />
          </div>
          {erro && <p className="text-rust text-xs">{erro}</p>}
          <button
            type="submit"
            disabled={salvando}
            className="bg-wine hover:bg-wineLight text-cream text-sm rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar
          </button>
        </form>
      </div>
    </div>
  );
}
