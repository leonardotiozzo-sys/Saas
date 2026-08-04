"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { currency } from "@/lib/utils";
import ProductFormModal from "@/components/ProductFormModal";

export default function ProdutosPage() {
  const [empresaId, setEmpresaId] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(null); // produto ou null
  const [modalAberto, setModalAberto] = useState(false);

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
    await carregarProdutos();
  }

  async function carregarProdutos() {
    setCarregando(true);
    const { data } = await supabase
      .from("produtos")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    setProdutos(data || []);
    setCarregando(false);
  }

  async function salvarProduto(dados) {
    if (editando) {
      const { error } = await supabase
        .from("produtos")
        .update(dados)
        .eq("id", editando.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("produtos")
        .insert({ ...dados, empresa_id: empresaId });
      if (error) throw error;
    }
    setModalAberto(false);
    setEditando(null);
    await carregarProdutos();
  }

  async function excluirProduto(produto) {
    if (!confirm(`Remover "${produto.nome}"?`)) return;
    await supabase.from("produtos").update({ ativo: false }).eq("id", produto.id);
    await carregarProdutos();
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtos;
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        (p.codigo_barras || "").includes(termo)
    );
  }, [produtos, busca]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-cream">Produtos</h1>
          <p className="text-muted text-sm">{produtos.length} produtos cadastrados</p>
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setModalAberto(true);
          }}
          className="bg-wine hover:bg-wineLight text-cream text-sm rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo produto
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou código de barras..."
          className="w-full bg-panel border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-cream outline-none focus:border-gold"
        />
      </div>

      <div className="bg-panel border border-white/10 rounded-2xl overflow-hidden">
        {carregando ? (
          <p className="p-5 text-muted text-sm">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p className="p-5 text-muted text-sm">Nenhum produto encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-white/10">
                <th className="px-4 py-3 font-normal">Produto</th>
                <th className="px-4 py-3 font-normal">Tipo</th>
                <th className="px-4 py-3 font-normal">Preço</th>
                <th className="px-4 py-3 font-normal">Estoque</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const baixo = p.estoque <= p.estoque_minimo;
                return (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-cream">{p.nome}</p>
                      <p className="text-muted text-xs font-mono">
                        {p.codigo_barras || "sem código"}
                        {p.safra ? ` · safra ${p.safra}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.tipo}</td>
                    <td className="px-4 py-3 text-cream">{currency(p.preco_venda)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          baixo ? "text-rust" : "text-sage"
                        }`}
                      >
                        {baixo && <AlertTriangle className="w-3.5 h-3.5" />}
                        {p.estoque} un.
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setEditando(p);
                            setModalAberto(true);
                          }}
                          className="text-muted hover:text-gold"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => excluirProduto(p)}
                          className="text-muted hover:text-rust"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <ProductFormModal
          produto={editando}
          onSave={salvarProduto}
          onClose={() => {
            setModalAberto(false);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}
