# CLAUDE.md - Aide-mémoire projet VAULTY

**INSTRUCTION : Toujours consulter ce fichier au début de chaque session et le mettre à jour quand de nouvelles découvertes sont faites.**

## Architecture

- **Next.js App Router** avec `@supabase/ssr`, CSS Modules, déployé sur **Netlify**
- `/@username` rewrite dans `next.config.ts` → `/creator-page/[username]`

## Points critiques

### Le browser Supabase client est CASSÉ
- `createBrowserClient` de `@supabase/ssr` hang sur `getSession()`
- **TOUTES** les opérations de données doivent passer par des **server actions** ou des **server components**
- Ne JAMAIS utiliser le browser client pour des queries directes

### RLS (Row Level Security)
- Les updates sans policy RLS échouent SILENCIEUSEMENT (0 rows affected, aucune erreur)
- Toujours utiliser `createAdminClient()` (service role key) pour les opérations d'écriture dans les server actions
- L'user est vérifié via `supabase.auth.getUser()` AVANT d'utiliser le admin client

### Storage / Upload de fichiers
- **Stratégie qui fonctionne** : `createSignedUploadUrl` (server action, admin client) → `uploadFileWithProgress` (client-side XHR PUT)
- Le helper `uploadFileWithProgress` dans `src/lib/helpers/storage.ts` est la méthode prouvée fonctionnelle
- Les buckets doivent exister dans Supabase. `createSignedUploadUrl` crée auto le bucket s'il n'existe pas
- Buckets utilisés : `post-media`, `avatars`, `banners`
- Toujours utiliser `upsert: true` ou `x-upsert: true` header pour les re-uploads

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/lib/supabase/server.ts` | Client Supabase SSR (cookies, anon key) |
| `src/lib/supabase/admin.ts` | Client admin (service role, bypass RLS) |
| `src/lib/supabase/client.ts` | Client browser (CASSÉ pour getSession) |
| `src/lib/actions/profile.ts` | Server actions profil (update, avatar, banner, settings, delete) |
| `src/lib/actions/storage.ts` | Server actions storage (signed URLs, upload direct) |
| `src/lib/actions/posts.ts` | Server actions posts (create, edit, delete) |
| `src/lib/helpers/storage.ts` | Helpers client-side upload (uploadFileWithProgress = la bonne méthode) |
| `src/hooks/useAuth.ts` | AuthProvider + hook (profile, user, refreshProfile) |
| `src/types/database.ts` | Types TypeScript (Profile, Post, PostWithMedia) |

## Patterns importants

### Upload de fichier (pattern à copier)
```typescript
// Client-side (dans un component)
import { createSignedUploadUrl } from "@/lib/actions/storage";
import { uploadFileWithProgress } from "@/lib/helpers/storage";

const file = new File([blob], "filename.jpg", { type: "image/jpeg" });
const path = `${user.id}/filename.jpg`;
const storagePath = await uploadFileWithProgress("bucket-name", path, file, (pct) => {});
if (!storagePath) { /* erreur */ return; }
const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/bucket-name/${path}?t=${Date.now()}`;
```

### Update profil (pattern à copier)
```typescript
// Server action - toujours admin client
const admin = createAdminClient();
const { error } = await admin.from("profiles").update({ ... }).eq("id", user.id);
```

## Erreurs fréquentes et solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| Updates silencieusement ignorés | Pas de policy RLS UPDATE | Utiliser `createAdminClient()` |
| `getSession()` hang | Browser client cassé | Utiliser server actions |
| "Failed to prepare upload" | Bucket n'existe pas dans Supabase | `createSignedUploadUrl` crée auto le bucket |
| Upload échoue côté client | Mauvaise stratégie d'upload | Utiliser `uploadFileWithProgress` (signed URL + XHR) |
