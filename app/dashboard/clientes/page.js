"use client";

import { useEffect, useState } from "react";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ClientesPage() {
  const [empresaId, setEmpresaId] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
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
    await carregar();
  }

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from("clientes").select("*").order("nome");
    setClientes(data || []);
    setCarregando(false);
  }

  async function excluir(cliente) {
    if (!confirm(`Remover "${cliente.nome}"?`)) return;
    await supabase.from("clientes").delete().eq("id", cliente.id);
    await carregar();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-cream">Clientes</h1>
          <p className="text-muted text-sm">{clientes.length} clientes cadastrados</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-wine hover:bg-wineLight text-cream text-sm rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo cliente
        </button>
      </div>

      <div className="bg-panel border border-white/10 rounded-2xl overflow-hidden">
        {carregando ? (
          <p className="p-5 text-muted text-sm">Carregando...</p>
        ) : clientes.length === 0 ? (
          <p className="p-5 text-muted text-sm">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-white/10">
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="px-4 py-3 font-normal">Telefone</th>
                <th className="px-4 py-3 font-normal">Observações</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-cream">{c.nome}</td>
                  <td className="px-4 py-3 text-muted">{c.telefone || "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.observacoes || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => excluir(c)} className="text-muted hover:text-rust">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <ClienteModal
          empresaId={empresaId}
          onClose={() => setModalAberto(false)}
          onSaved={async () => {
            setModalAberto(false);
            await carregar();
          }}
        />
      )}
    </div>
  );
}

function ClienteModal({ empresaId, onClose, onSaved }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Informe o nome do cliente.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase
      .from("clientes")
      .insert({ empresa_id: empresaId, nome, telefone, observacoes });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-panel border border-white/10 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-cream font-display text-lg">Novo cliente</h2>
          <button onClick={onClose} className="text-muted hover:text-cream">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Nome</label>
            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Telefone</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold resize-none"
            />
          </div>
          {erro && <p className="text-rust text-xs">{erro}</p>}
          <button
            type="submit"
            disabled={salvando}
            className="bg-wine hover:bg-wineLight text-cream text-sm rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}
