"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Barcode, Plus, Minus, Trash2, Loader2, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { currency, formatDateTime } from "@/lib/utils";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function VendasPage() {
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState([]); // [{produto, quantidade}]
  const [clienteId, setClienteId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const [{ data: prods }, { data: clis }, { data: hist }] = await Promise.all([
      supabase.from("produtos").select("*").eq("ativo", true).order("nome"),
      supabase.from("clientes").select("*").order("nome"),
      supabase
        .from("vendas")
        .select("id, total, created_at, clientes(nome)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setProdutos(prods || []);
    setClientes(clis || []);
    setHistorico(hist || []);
  }

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return produtos
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          (p.codigo_barras || "").includes(termo)
      )
      .slice(0, 6);
  }, [busca, produtos]);

  function adicionarAoCarrinho(produto) {
    setAviso("");
    setCarrinho((c) => {
      const existente = c.find((i) => i.produto.id === produto.id);
      const qtdAtual = existente ? existente.quantidade : 0;
      if (qtdAtual + 1 > produto.estoque) {
        setAviso(`Estoque insuficiente de "${produto.nome}".`);
        return c;
      }
      if (existente) {
        return c.map((i) =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...c, { produto, quantidade: 1 }];
    });
    setBusca("");
  }

  function alterarQuantidade(produtoId, delta) {
    setAviso("");
    setCarrinho((c) =>
      c
        .map((i) => {
          if (i.produto.id !== produtoId) return i;
          const nova = i.quantidade + delta;
          if (nova > i.produto.estoque) {
            setAviso(`Estoque insuficiente de "${i.produto.nome}".`);
            return i;
          }
          return { ...i, quantidade: nova };
        })
        .filter((i) => i.quantidade > 0)
    );
  }

  function removerItem(produtoId) {
    setCarrinho((c) => c.filter((i) => i.produto.id !== produtoId));
  }

  function handleBarcodeDetected(codigo) {
    setScanning(false);
    const produto = produtos.find((p) => p.codigo_barras === codigo);
    if (produto) {
      adicionarAoCarrinho(produto);
    } else {
      setAviso(`Nenhum produto com o código "${codigo}" encontrado.`);
    }
  }

  const total = carrinho.reduce(
    (acc, i) => acc + Number(i.produto.preco_venda) * i.quantidade,
    0
  );

  async function finalizarVenda() {
    if (carrinho.length === 0) return;
    setErro("");
    setFinalizando(true);
    try {
      const itens = carrinho.map((i) => ({
        produto_id: i.produto.id,
        nome_produto: i.produto.nome,
        quantidade: i.quantidade,
        preco_unitario: Number(i.produto.preco_venda),
      }));
      const { error } = await supabase.rpc("finalizar_venda", {
        cliente_id_param: clienteId || null,
        itens_json: itens,
      });
      if (error) throw error;
      setCarrinho([]);
      setClienteId("");
      await carregar();
    } catch (err) {
      setErro(err.message || "Erro ao finalizar venda.");
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-cream">Vendas (PDV)</h1>
        <p className="text-muted text-sm">Registre uma nova venda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto por nome ou código..."
              className="w-full bg-panel border border-white/10 rounded-lg pl-9 pr-24 py-2.5 text-sm text-cream outline-none focus:border-gold"
            />
            <button
              onClick={() => setScanning(true)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-wine hover:bg-wineLight text-cream text-xs rounded-md px-2.5 py-1.5 flex items-center gap-1"
            >
              <Barcode className="w-3.5 h-3.5" />
              Escanear
            </button>
          </div>

          {resultados.length > 0 && (
            <div className="bg-panel border border-white/10 rounded-xl overflow-hidden">
              {resultados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => adicionarAoCarrinho(p)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5 border-b border-white/5 last:border-0"
                >
                  <span className="text-cream">{p.nome}</span>
                  <span className="text-muted">{currency(p.preco_venda)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="bg-panel border border-white/10 rounded-2xl p-5">
            <h2 className="text-cream text-sm font-medium mb-3">Últimas vendas</h2>
            {historico.length === 0 ? (
              <p className="text-muted text-sm">Nenhuma venda ainda.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {historico.map((v) => (
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

        <div className="lg:col-span-2">
          <div className="bg-panel border border-white/10 rounded-2xl p-5 flex flex-col gap-4 sticky top-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-gold" />
              <h2 className="text-cream text-sm font-medium">Carrinho</h2>
            </div>

            {carrinho.length === 0 ? (
              <p className="text-muted text-sm">Nenhum item adicionado.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {carrinho.map((i) => (
                  <li key={i.produto.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-cream text-sm truncate">{i.produto.nome}</p>
                      <p className="text-muted text-xs">{currency(i.produto.preco_venda)} un.</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => alterarQuantidade(i.produto.id, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-white/5 rounded text-cream hover:bg-white/10"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-cream text-sm w-5 text-center">{i.quantidade}</span>
                      <button
                        onClick={() => alterarQuantidade(i.produto.id, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white/5 rounded text-cream hover:bg-white/10"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removerItem(i.produto.id)}
                        className="text-muted hover:text-rust ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {aviso && <p className="text-gold text-xs">{aviso}</p>}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">Cliente (opcional)</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
              >
                <option value="">Venda avulsa</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
              <span className="text-muted text-sm">Total</span>
              <span className="text-cream font-display text-xl">{currency(total)}</span>
            </div>

            {erro && <p className="text-rust text-xs">{erro}</p>}

            <button
              onClick={finalizarVenda}
              disabled={carrinho.length === 0 || finalizando}
              className="bg-wine hover:bg-wineLight text-cream text-sm rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {finalizando && <Loader2 className="w-4 h-4 animate-spin" />}
              Finalizar venda
            </button>
          </div>
        </div>
      </div>

      {scanning && (
        <BarcodeScanner onDetect={handleBarcodeDetected} onClose={() => setScanning(false)} />
      )}
    </div>
  );
}
