import { NextResponse } from "next/server";
import { getSupabaseAdmin, verificarSuperAdmin } from "@/lib/supabaseAdmin";

export async function GET(req) {
  const user = await verificarSuperAdmin(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: empresas, error } = await admin
    .from("empresas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // conta produtos e vendas por empresa para o dashboard
  const { data: produtosCount } = await admin.from("produtos").select("empresa_id");
  const { data: vendasCount } = await admin.from("vendas").select("empresa_id, total");

  const empresasComStats = empresas.map((e) => ({
    ...e,
    total_produtos: (produtosCount || []).filter((p) => p.empresa_id === e.id).length,
    total_vendas: (vendasCount || [])
      .filter((v) => v.empresa_id === e.id)
      .reduce((acc, v) => acc + Number(v.total), 0),
  }));

  return NextResponse.json({ empresas: empresasComStats });
}
