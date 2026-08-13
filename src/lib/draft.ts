export const DRAFT_KEY = 'dash_post_draft_v1'
export const DRAFT_LIST_KEY = 'dash_post_drafts_v1'
export const DRAFT_EVENT = 'dash-draft-change'

export interface PostFormData {
  title: string
  excerpt: string
  content: string
  status: string
  category: { name: string; slug: string } | null
  tags_input: string
  slug: string
  meta_description: string
}

export interface DraftData {
  mode: 'create' | 'edit'
  postId?: number
  data: PostFormData
  saved_at: string
}

// Multi-rascunho: guarda rascunhos por chave (`post:<id>` ou `create`), preservando
// o histórico do editor mesmo quando o usuário abre/edita outro artigo.

export function saveDraft(draft: DraftData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    const key = draft.postId != null ? `post:${draft.postId}` : 'create'
    const list = readDraftList()
    list[key] = draft
    list[key].saved_at = new Date().toISOString()
    localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(list))
  } catch {}
}

export function readDraft(): DraftData | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as DraftData) : null
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {}
}

export function readDraftList(): Record<string, DraftData> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(DRAFT_LIST_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, DraftData>
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

export function removeDraftEntry(key: string) {
  try {
    const list = readDraftList()
    delete list[key]
    localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(list))
  } catch {}
}

export function emitDraftChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DRAFT_EVENT))
  }
}