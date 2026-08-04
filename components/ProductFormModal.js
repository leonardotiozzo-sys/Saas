"use client";

import { useState } from "react";
import { X, Barcode, Loader2 } from "lucide-react";
import { WINE_TYPES } from "@/lib/utils";
import BarcodeScanner from "./BarcodeScanner";

const VAZIO = {
  nome: "",
  tipo: "Tinto",
  safra: "",
  regiao: "",
  fornecedor: "",
  codigo_barras: "",
  preco_custo: "",
  preco_venda: "",
  estoque: "",
  estoque_minimo: "",
};

export default function ProductFormModal({ produto, onSave, onClose }) {
  const [form, setForm] = useState(
    produto
      ? {
          ...VAZIO,
          ...produto,
          safra: produto.safra ?? "",
          preco_custo: produto.preco_custo ?? "",
          preco_venda: produto.preco_venda ?? "",
        }
      : VAZIO
  );
  const [scanning, setScanning] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (!form.nome.trim()) {
      setErro("Informe o nome do produto.");
      return;
    }
    setSalvando(true);
    try {
      await onSave({
        ...form,
        safra: form.safra ? Number(form.safra) : null,
        preco_custo: Number(form.preco_custo) || 0,
        preco_venda: Number(form.preco_venda) || 0,
        estoque: Number(form.estoque) || 0,
        estoque_minimo: Number(form.estoque_minimo) || 0,
      });
    } catch (err) {
      setErro(err.message || "Erro ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-panel border border-white/10 rounded-2xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-cream font-display text-lg">
            {produto ? "Editar produto" : "Novo produto"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-cream">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <Campo label="Nome do vinho">
            <input
              required
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              className="input"
              placeholder="Ex: Malbec Reserva 2021"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Tipo">
              <select
                value={form.tipo}
                onChange={(e) => set("tipo", e.target.value)}
                className="input"
              >
                {WINE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Safra">
              <input
                type="number"
                value={form.safra}
                onChange={(e) => set("safra", e.target.value)}
                className="input"
                placeholder="2021"
              />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Região">
              <input
                value={form.regiao}
                onChange={(e) => set("regiao", e.target.value)}
                className="input"
                placeholder="Vale dos Vinhedos"
              />
            </Campo>
            <Campo label="Fornecedor">
              <input
                value={form.fornecedor}
                onChange={(e) => set("fornecedor", e.target.value)}
                className="input"
                placeholder="Distribuidora X"
              />
            </Campo>
          </div>

          <Campo label="Código de barras">
            <div className="flex gap-2">
              <input
                value={form.codigo_barras}
                onChange={(e) => set("codigo_barras", e.target.value)}
                className="input flex-1 font-mono"
                placeholder="Digite ou escaneie"
              />
              <button
                type="button"
                onClick={() => setScanning(true)}
                className="shrink-0 bg-wine hover:bg-wineLight text-cream rounded-lg px-3 flex items-center gap-1.5 text-sm"
              >
                <Barcode className="w-4 h-4" />
                Escanear
              </button>
            </div>
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Preço de custo (R$)">
              <input
                type="number"
                step="0.01"
                value={form.preco_custo}
                onChange={(e) => set("preco_custo", e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Preço de venda (R$)">
              <input
                type="number"
                step="0.01"
                required
                value={form.preco_venda}
                onChange={(e) => set("preco_venda", e.target.value)}
                className="input"
              />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Estoque atual">
              <input
                type="number"
                value={form.estoque}
                onChange={(e) => set("estoque", e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Estoque mínimo">
              <input
                type="number"
                value={form.estoque_minimo}
                onChange={(e) => set("estoque_minimo", e.target.value)}
                className="input"
              />
            </Campo>
          </div>

          {erro && <p className="text-rust text-xs">{erro}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-muted hover:text-cream"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 rounded-lg text-sm bg-wine hover:bg-wineLight text-cream flex items-center gap-2 disabled:opacity-60"
            >
              {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </div>

      {scanning && (
        <BarcodeScanner
          onDetect={(codigo) => {
            set("codigo_barras", codigo);
            setScanning(false);
          }}
          onClose={() => setScanning(false)}
        />
      )}

      <style jsx global>{`
        .input {
          background-color: #17120f;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          color: #f3e9d6;
          font-size: 0.875rem;
          outline: none;
          width: 100%;
        }
        .input:focus {
          border-color: #c6a15b;
        }
      `}</style>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}
