import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROLES = new Set(["admin", "editor", "leitor"]);

type PainelRole = "admin" | "editor" | "leitor";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Não autenticado." }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Sessão inválida." }, 401);

  const callerRole = String(userData.user.app_metadata?.role || "");
  if (callerRole !== "admin") {
    return json({ error: "Apenas administradores podem gerenciar usuários." }, 403);
  }

  const admin = createClient(url, service);
  let payload: {
    action?: string;
    id?: string;
    email?: string;
    password?: string;
    role?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const action = payload.action;

  try {
    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) throw error;
      const users = (data.users || []).map((u) => ({
        id: u.id,
        email: u.email || "",
        role: (u.app_metadata?.role as PainelRole) || "leitor",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));
      return json({ users });
    }

    if (action === "create") {
      const email = String(payload.email || "").trim().toLowerCase();
      const password = String(payload.password || "");
      const role = String(payload.role || "") as PainelRole;
      if (!email || !password) return json({ error: "E-mail e senha são obrigatórios." }, 400);
      if (password.length < 6) return json({ error: "Senha deve ter ao menos 6 caracteres." }, 400);
      if (!ROLES.has(role)) return json({ error: "Função inválida." }, 400);

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role },
      });
      if (error) throw error;
      return json({
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role,
        },
      });
    }

    if (action === "update") {
      const id = String(payload.id || "");
      if (!id) return json({ error: "ID obrigatório." }, 400);

      const { data: existingPack, error: getErr } = await admin.auth.admin.getUserById(id);
      if (getErr) throw getErr;
      const existing = existingPack.user;

      const patch: {
        app_metadata?: Record<string, unknown>;
        password?: string;
        email?: string;
      } = {};

      if (payload.role != null) {
        const role = String(payload.role) as PainelRole;
        if (!ROLES.has(role)) return json({ error: "Função inválida." }, 400);
        if (id === userData.user.id && role !== "admin") {
          return json({ error: "Você não pode remover o próprio acesso de admin." }, 400);
        }
        patch.app_metadata = { ...(existing.app_metadata || {}), role };
      }

      if (payload.password) {
        if (String(payload.password).length < 6) {
          return json({ error: "Senha deve ter ao menos 6 caracteres." }, 400);
        }
        patch.password = String(payload.password);
      }

      if (payload.email) {
        patch.email = String(payload.email).trim().toLowerCase();
      }

      if (!Object.keys(patch).length) return json({ error: "Nada para atualizar." }, 400);

      const { data, error } = await admin.auth.admin.updateUserById(id, patch);
      if (error) throw error;
      return json({
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.app_metadata?.role || "leitor",
        },
      });
    }

    if (action === "delete") {
      const id = String(payload.id || "");
      if (!id) return json({ error: "ID obrigatório." }, 400);
      if (id === userData.user.id) {
        return json({ error: "Você não pode excluir a própria conta." }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 400);
  }
});
