import { createClient } from "@supabase/supabase-js";

// ATENÇÃO: este arquivo só pode ser importado dentro de app/api/**/route.js
// (código de servidor). Nunca importe isso em um componente "use client".
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Verifica se o token do usuário que chamou a API pertence a um super_admin.
export async function verificarSuperAdmin(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const admin = getSupabaseAdmin();
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData?.user) return null;

  const { data: perfil } = await admin
    .from("perfis")
    .select("papel")
    .eq("id", userData.user.id)
    .single();

  if (perfil?.papel !== "super_admin") return null;
  return userData.user;
}
