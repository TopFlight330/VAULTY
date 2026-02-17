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
- **Avatar** : Utiliser `uploadAndSetAvatar(formData)` server action (100% server-side, bypass tout)
- **Post media** : `uploadFileWithProgress` (signed URL + XHR PUT côté client)
- Les buckets sont auto-créés s'ils n'existent pas
- Buckets utilisés : `post-media`, `avatars`, `banners`
- Toujours utiliser `upsert: true` ou `x-upsert: true` header pour les re-uploads

### AuthProvider
- `refreshProfile()` utilise la server action `getProfile()` (admin client)
- NE PAS utiliser le browser client pour fetch le profile (ça peut hang)
- Le browser client (`src/lib/supabase/client.ts`) est OK pour `getUser()` et `onAuthStateChange` seulement

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

### Upload avatar (pattern à copier)
```typescript
// 100% server-side - le plus fiable
import { uploadAndSetAvatar } from "@/lib/actions/profile";

const formData = new FormData();
formData.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
const result = await uploadAndSetAvatar(formData);
```

### Upload post media (pattern à copier)
```typescript
// Client-side avec progress - pour fichiers plus gros
import { uploadFileWithProgress } from "@/lib/helpers/storage";

const storagePath = await uploadFileWithProgress("post-media", path, file, (pct) => {});
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
| "Failed to prepare upload" | Bucket n'existe pas dans Supabase | Buckets auto-créés par server actions |
| "Failed to get signed URL" | Signed URL échoue sur Netlify | Utiliser `uploadAndSetAvatar` (100% server-side) |
| Toggles load à l'infini | `refreshProfile` hang avec browser client | `refreshProfile` utilise maintenant server action `getProfile` |
| Profile data disparait au reload | Update échoue silencieusement | Vérifier admin client + `SUPABASE_SERVICE_ROLE_KEY` sur Netlify |
