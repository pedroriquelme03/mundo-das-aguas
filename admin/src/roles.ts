export type PainelRole = 'admin' | 'editor' | 'leitor';

export const ROLE_LABEL: Record<PainelRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  leitor: 'Leitor'
};

export const ROLE_HINT: Record<PainelRole, string> = {
  admin: 'Acesso total, inclusive usuários',
  editor: 'Edita conteúdo; não gerencia usuários',
  leitor: 'Somente visualização'
};

let currentRole: PainelRole = 'leitor';
let currentUserId = '';
let currentUserEmail = '';

export function getRole(): PainelRole {
  return currentRole;
}

export function getUserId(): string {
  return currentUserId;
}

export function getUserEmail(): string {
  return currentUserEmail;
}

export function canWrite(): boolean {
  return currentRole === 'admin' || currentRole === 'editor';
}

export function canManageUsers(): boolean {
  return currentRole === 'admin';
}

export function parseRole(raw: unknown): PainelRole {
  const r = String(raw || '').toLowerCase();
  if (r === 'admin' || r === 'editor' || r === 'leitor') return r;
  return 'leitor';
}

export function setSessionUser(user: {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
} | null): void {
  if (!user) {
    currentRole = 'leitor';
    currentUserId = '';
    currentUserEmail = '';
    return;
  }
  currentUserId = user.id;
  currentUserEmail = user.email || '';
  currentRole = parseRole(user.app_metadata?.role);
}
