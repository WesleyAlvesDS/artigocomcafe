export const DRAFT_KEY = 'dash_post_draft_v1'
export const DRAFT_EVENT = 'dash-draft-change'

export interface PostFormData {
  title: string
  excerpt: string
  content: string
  status: string
  category: { name: string; slug: string } | null
  tags_input: string
}

export interface DraftData {
  mode: 'create' | 'edit'
  postId?: number
  data: PostFormData
  saved_at: string
}

export function saveDraft(draft: DraftData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
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

export function emitDraftChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DRAFT_EVENT))
  }
}