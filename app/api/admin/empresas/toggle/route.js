import { NextResponse } from "next/server";
import { getSupabaseAdmin, verificarSuperAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const user = await verificarSuperAdmin(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { empresaId, status } = await req.json();
  if (!empresaId || !["ativo", "suspenso", "bloqueado"].includes(status)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("empresas").update({ status }).eq("id", empresaId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
