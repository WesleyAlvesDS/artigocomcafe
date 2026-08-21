import { useState, useEffect, useRef, useCallback, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { saveDraft, readDraft, readDraftList, clearDraft, removeDraftEntry, emitDraftChange, type PostFormData, type DraftData } from '../lib/draft'
import { showToast } from './Toast'

interface PostItem {
  id: number
  title: string
  slug: string
  excerpt: string | null
  status: 'draft' | 'pending_review' | 'review' | 'scheduled' | 'published' | 'archived'
  featured_image: string | null
  reading_time: number | null
  category: { name: string; slug: string } | null
  tags: { name: string; slug: string }[]
  meta_description?: string | null
  date: string
  created_at: string
  updated_at: string
}

interface PostEditorProps {
  initialPost?: PostItem | null
  onClose: () => void
  onSave: (post: PostItem) => void
}

const TOOLBAR_ACTIONS = [
  { key: 'bold', label: 'Negrito', markdown: '**', shortcut: 'b', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>' },
  { key: 'italic', label: 'Itálico', markdown: '*', shortcut: 'i', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>' },
  { key: 'strikethrough', label: 'Riscado', markdown: '~~', shortcut: 's', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><path d="M18 4a6 6 0 0 1 0 12M6 20a6 6 0 0 0 0-12"/></svg>' },
  { key: 'code', label: 'Código inline', markdown: '`', shortcut: 'k', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
  { type: 'separator' },
  { key: 'h1', label: 'Título 1', markdown: '# ', shortcut: '1', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><text x="3" y="16" font-size="14" font-weight="bold">H1</text></svg>' },
  { key: 'h2', label: 'Título 2', markdown: '## ', shortcut: '2', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><text x="3" y="16" font-size="13" font-weight="bold">H2</text></svg>' },
  { key: 'h3', label: 'Título 3', markdown: '### ', shortcut: '3', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><text x="3" y="16" font-size="12" font-weight="bold">H3</text></svg>' },
  { type: 'separator' },
  { key: 'link', label: 'Link', markdown: '[texto](url)', shortcut: 'l', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
  { key: 'image', label: 'Imagem', markdown: '![alt](url)', shortcut: 'g', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
  { key: 'blockquote', label: 'Citação', markdown: '> ', shortcut: 'q', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V21c0 1.25.75 2 2 2h1"/></svg>' },
  { key: 'codeblock', label: 'Bloco de código', markdown: '\n```\n```\n', shortcut: 'e', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
  { type: 'separator' },
  { key: 'ul', label: 'Lista', markdown: '- ', shortcut: 'u', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><line x1="5" y1="6" x2="5" y2="6"/><line x1="5" y1="12" x2="5" y2="12"/><line x1="5" y1="18" x2="5" y2="18"/></svg>' },
  { key: 'ol', label: 'Lista numerada', markdown: '1. ', shortcut: 'o', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="8" font-size="10">1</text><text x="3" y="14" font-size="10">2</text><text x="3" y="20" font-size="10">3</text></svg>' },
  { key: 'task', label: 'Task list', markdown: '- [ ] ', shortcut: 't', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { type: 'separator' },
  { key: 'table', label: 'Tabela', markdown: '\n| Header | Header |\n| ------ | ------ |\n| Cell | Cell |\n', shortcut: 'Shift+t', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>' },
  { key: 'hr', label: 'Linha horizontal', markdown: '\n---\n', shortcut: 'h', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>' },
]

const statusLabels: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  review: 'Em Revisão',
  scheduled: 'Agendado',
  archived: 'Arquivado',
}

const statusColors: Record<string, string> = {
  published: 'var(--color-accent)',
  draft: 'var(--color-text-muted)',
  review: '#f59e0b',
  scheduled: '#3b82f6',
  archived: '#6b7280',
}

export function renderMarkdown(text: string): string {
  if (!text) return ''

  // 1. Escapa HTML bruto para prevenir XSS. Inclui aspas para não permitir
  //    quebrar atributos em links/imagens. As marcações markdown (`*`, `#`,
  //    `` ` ``) não são afetadas, então o processamento abaixo continua válido.
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  // 2. Code blocks first (conteúdo já escapado acima — apenas envolve)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="language-${lang || ''}">${code}</code></pre>`)

  // 3. Inline code
  html = html.replace(/`([^`\n]+)`/g, (_, code) => `<code>${code}</code>`)

  // 4. Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // 5. Italic
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')

  // 6. Strikethrough
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // 7. Headings
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

  // 8. Blockquote (já escapado: `>` virou `&gt;`)
  html = html.replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>')

  // 9. Horizontal rule
  html = html.replace(/^---$/gm, '<hr>')

  // 10. Links — apenas http/https/mailto/# (bloqueia javascript: e afins)
  html = html.replace(/\[([^\]]+)\]\(((?:https?:)?\/\/[^)\s]+|mailto:[^)\s]+|#[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // 11. Images
  html = html.replace(/!\[([^\]]*)\]\(((?:https?:)?\/\/[^)\s]+|data:image\/[a-z]+;base64,[^)\s]+)\)/g,
    '<figure><img src="$2" alt="$1" loading="lazy"/><figcaption>$1</figcaption></figure>')

  // 12. Task lists
  html = html.replace(/^- \[ \] (.*$)/gm, '<li class="task-item"><input type="checkbox" disabled> $1</li>')
  html = html.replace(/^- \[x\] (.*$)/gm, '<li class="task-item"><input type="checkbox" checked disabled> $1</li>')

  // 13. Lists
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>')
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  html = html.replace(/<\/ul>\n<ul>/g, '')

  // 14. Paragraphs
  html = html.replace(/^(?!<[hbuol]|<pre|<blockquote|<hr|<figure|<ul|<ol)(.+$)/gm, '<p>$1</p>')
  html = html.replace(/<\/p>\n<p>/g, '</p><p>')

  // 15. Clean up
  html = html.replace(/\n{3,}/g, '\n\n')

  return html
}

export default function PostEditor({ initialPost, onClose, onSave }: PostEditorProps) {
  const { user } = useAuth()
  const canPublish = user?.role === 'admin' || user?.role === 'editor'
  const [formData, setFormData] = useState<PostFormData>({
    title: initialPost?.title || '',
    excerpt: initialPost?.excerpt || '',
    content: initialPost ? '' : '',
    status: initialPost?.status || 'draft',
    category: initialPost?.category || null,
    tags_input: initialPost?.tags.map(t => t.name).join(', ') || '',
    slug: initialPost?.slug || '',
    meta_description: initialPost?.meta_description || '',
  })
  const [slugTouched, setSlugTouched] = useState(!!initialPost)
  const [showSeo, setShowSeo] = useState(false)
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'publishing'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(!!initialPost)
  const [localDraft, setLocalDraft] = useState<{ exists: boolean; timestamp: Date | null }>({ exists: false, timestamp: null })
  const [serverSyncStatus, setServerSyncStatus] = useState<'synced' | 'unsynced' | 'unknown'>('unknown')
  const [wordCount, setWordCount] = useState(0)
  const [readTime, setReadTime] = useState(0)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageProgress, setImageProgress] = useState(0)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Refs p/ evitar closures stale nos atalhos de teclado (⌘B/⌘I/⌘K/⌘S/⌘⇧Enter).
  const formDataRef = useRef(formData)
  formDataRef.current = formData
  const wrapSelectionRef = useRef<(prefix: string, suffix: string) => void>(() => {})
  const handleSaveRef = useRef<() => void>(() => {})
  const handlePublishRef = useRef<() => void>(() => {})

  // Load content if editing
  useEffect(() => {
    if (initialPost) {
      setFormData({
        title: initialPost.title,
        excerpt: initialPost.excerpt || '',
        content: '', // Will load from draft or API
        status: initialPost.status,
        category: initialPost.category,
        tags_input: initialPost.tags.map(t => t.name).join(', '),
        slug: initialPost.slug,
        meta_description: initialPost.meta_description || '',
      })
      setSlugTouched(true)
      // Try to load multi-draft first (fallback para chave única antiga)
      const list = readDraftList()
      const keyed = list[`post:${initialPost.id}`]
      if (keyed && keyed.data) {
        setFormData(keyed.data)
        setIsLoading(false)
      } else {
        const draft = readDraft()
        if (draft && draft.mode === 'edit' && draft.postId === initialPost.id) {
          setFormData(draft.data)
          setIsLoading(false)
        } else {
          // No local draft — fetch full content from API
          api.get<{ article: PostItem }>(`/user/posts/${initialPost.id}`)
            .then(res => {
              if (res.article?.content) {
                setFormData(prev => ({ ...prev, content: res.article.content }))
              }
            })
            .catch(() => {})
            .finally(() => setIsLoading(false))
        }
      }
    } else {
      // Criação: restaura rascunho de "novo artigo" se existir
      const list = readDraftList()
      const keyed = list['create']
      if (keyed && keyed.data) {
        setFormData(keyed.data)
      }
    }
  }, [initialPost])

  // Check local draft status on mount and keep updated
  useEffect(() => {
    const checkLocalDraft = () => {
      const list = readDraftList()
      const key = initialPost ? `post:${initialPost.id}` : 'create'
      const draft = list[key]
      if (draft && draft.data) {
        setLocalDraft({ exists: true, timestamp: draft.saved_at ? new Date(draft.saved_at) : null })
        setServerSyncStatus('unsynced')
      } else {
        setLocalDraft({ exists: false, timestamp: null })
        setServerSyncStatus(initialPost ? 'synced' : 'unknown')
      }
    }
    checkLocalDraft()
    const handler = () => checkLocalDraft()
    window.addEventListener('dash-draft-change', handler)
    return () => window.removeEventListener('dash-draft-change', handler)
  }, [initialPost])

  // Autocomplete de categorias/tags (P2) — dados p/ <datalist>
  useEffect(() => {
    let active = true
    api.get<{ categories?: { name: string }[] }>('/categories')
      .then(d => { if (active) setSuggestedCategories((d.categories || []).map(c => c.name).filter(Boolean)) })
      .catch(() => {})
    api.get<{ tags?: { name: string }[] }>('/tags')
      .then(d => { if (active) setSuggestedTags((d.tags || []).map(t => t.name).filter(Boolean)) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  // Auto-slug: gera slug do título enquanto o usuário não editar manualmente
  useEffect(() => {
    if (slugTouched) return
    const slug = formData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setFormData(prev => prev.slug !== slug ? { ...prev, slug } : prev)
  }, [formData.title, slugTouched])

  // Auto-save draft
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('saving')
    saveTimer.current = setTimeout(() => {
      saveDraft({
        mode: initialPost ? 'edit' : 'create',
        postId: initialPost?.id,
        data: formData,
        saved_at: new Date().toISOString(),
      })
      setLastSaved(new Date())
      setLocalDraft({ exists: true, timestamp: new Date() })
      setServerSyncStatus('unsynced')
      setSaveState('saved')
      emitDraftChange()
    }, 500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [formData, initialPost])

  // Live preview update
  useEffect(() => {
    if (showPreview) {
      setPreviewHtml(renderMarkdown(formData.content))
    }
  }, [formData.content, showPreview])

  // Word count & read time
  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
    setReadTime(Math.max(1, Math.ceil(words / 200)))
  }, [formData.content])

  // Sync scroll between editor and preview
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    if (!showPreview) return
    const source = e.currentTarget
    const target = source === editorRef.current ? previewRef.current : editorRef.current
    if (target) {
      target.scrollTop = source.scrollTop
      target.scrollLeft = source.scrollLeft
    }
  }, [showPreview])

  // Keyboard shortcuts — usa refs p/ sempre chamar os handlers da ÚLTIMA render
  // (antes capturava closures stale da primeira render: ⌘S salvava formData vazio).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault()
          handleSaveRef.current()
          break
        case 'b':
          e.preventDefault()
          wrapSelectionRef.current('**', '**')
          break
        case 'i':
          e.preventDefault()
          wrapSelectionRef.current('*', '*')
          break
        case 'k':
          e.preventDefault()
          wrapSelectionRef.current('`', '`')
          break
        case 'enter':
          if (e.shiftKey) {
            e.preventDefault()
            handlePublishRef.current()
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = editorRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formDataRef.current.content
    const selected = text.slice(start, end)
    const newText = text.slice(0, start) + prefix + selected + suffix + text.slice(end)
    setFormData(prev => ({ ...prev, content: newText }))
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = start + prefix.length
      textarea.selectionEnd = start + prefix.length + selected.length
    }, 0)
  }
  wrapSelectionRef.current = wrapSelection

  const insertMarkdown = (markdown: string, replaceSelection = true) => {
    const textarea = editorRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formDataRef.current.content
    let newText = text
    
    if (replaceSelection && start !== end) {
      newText = text.slice(0, start) + markdown.replace('texto', text.slice(start, end)) + text.slice(end)
    } else {
      newText = text.slice(0, start) + markdown + text.slice(end)
    }
    
    setFormData(prev => ({ ...prev, content: newText }))
    setTimeout(() => {
      textarea.focus()
      if (replaceSelection && start !== end) {
        textarea.selectionStart = start
        textarea.selectionEnd = start + markdown.length
      } else {
        // Sem seleção: seleciona o placeholder para o usuário digitar por cima
        const first = newText.indexOf('texto', start)
        const placeholderIdx = first >= 0 ? first : newText.indexOf('código', start)
        const ph = placeholderIdx >= 0 ? placeholderIdx : newText.indexOf('url', start)
        if (ph >= 0) {
          textarea.selectionStart = ph
          textarea.selectionEnd = ph + (first >= 0 ? 'texto'.length : placeholderIdx >= 0 ? 'código'.length : 'url'.length)
        } else {
          textarea.selectionStart = start + markdown.length
          textarea.selectionEnd = start + markdown.length
        }
      }
    }, 0)
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Apenas arquivos de imagem são permitidos', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Imagem deve ter no máximo 5MB', 'error')
      return
    }

    setImageUploading(true)
    setImageProgress(0)

    const formDataUpload = new FormData()
    formDataUpload.append('image', file)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImageProgress(p => Math.min(90, p + 10))
      }, 100)

      const response = await fetch('/api-proxy.php/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formDataUpload,
      })

      clearInterval(progressInterval)
      setImageProgress(100)

      if (!response.ok) throw new Error('Falha no upload')

      const data = await response.json()
      if (data.url) {
        insertMarkdown(`![${file.name}](${data.url})`)
        showToast('Imagem enviada com sucesso!', 'success')
      }
    } catch (err) {
      showToast('Erro ao enviar imagem', 'error')
    } finally {
      setImageUploading(false)
      setSelectedImage(null)
      setTimeout(() => setImageProgress(0), 500)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      handleImageUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
    e.target.value = ''
  }

  const handleSave = async () => {
    setError('')
    setSaveState('saving')
    try {
      const tags = formDataRef.current.tags_input.split(',').map(t => t.trim()).filter(Boolean)
      const payload = { ...formDataRef.current, tags, meta_description: formDataRef.current.meta_description }
      
      if (initialPost) {
        await api.put(`/user/posts/${initialPost.id}`, payload)
        showToast('Artigo atualizado!', 'success')
      } else {
        const newPost = await api.post<PostItem>('/user/posts', payload)
        onSave(newPost)
        showToast('Artigo criado!', 'success')
      }
      clearDraft()
      removeDraftEntry(initialPost ? `post:${initialPost.id}` : 'create')
      emitDraftChange()
      setLocalDraft({ exists: false, timestamp: null })
      setServerSyncStatus('synced')
      setSaveState('saved')
      setLastSaved(new Date())
      onClose()
    } catch (err: any) {
      setError(err.errors?.title?.[0] || err.errors?.content?.[0] || err.message || 'Erro ao salvar')
      setSaveState('idle')
    }
  }
  handleSaveRef.current = handleSave

  const handlePublish = async () => {
    setError('')
    setSaveState('publishing')
    try {
      const tags = formDataRef.current.tags_input.split(',').map(t => t.trim()).filter(Boolean)
      const targetStatus = canPublish ? 'published' : 'pending_review'
      const payload = { ...formDataRef.current, tags, meta_description: formDataRef.current.meta_description, status: targetStatus }
      
      if (initialPost) {
        await api.put(`/user/posts/${initialPost.id}`, payload)
      } else {
        await api.post('/user/posts', payload)
      }
      clearDraft()
      removeDraftEntry(initialPost ? `post:${initialPost.id}` : 'create')
      emitDraftChange()
      setLocalDraft({ exists: false, timestamp: null })
      setServerSyncStatus('synced')
      showToast(canPublish ? 'Artigo publicado! 🎉' : 'Artigo enviado para revisão! ✅', 'success')
      onClose()
    } catch (err: any) {
      setError(err.message || (canPublish ? 'Erro ao publicar' : 'Erro ao enviar para revisão'))
      setSaveState('idle')
    }
  }
  handlePublishRef.current = handlePublish

  const handleCancel = () => {
    if (formData.title || formData.content) {
      if (!confirm('Tem alterações não salvas. Deseja sair mesmo assim?')) return
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!initialPost) return
    if (!confirm('Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.')) return
    try {
      await api.delete(`/user/posts/${initialPost.id}`)
      showToast('Artigo excluído', 'success')
      onClose()
    } catch {
      showToast('Erro ao excluir', 'error')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    handleFileDrop(e)
  }

  const toolbarAction = (action: typeof TOOLBAR_ACTIONS[0]) => {
    if (action.type === 'separator') return
    if (action.key === 'image') {
      document.getElementById('image-upload')?.click()
      return
    }
    
    const markdownMap: Record<string, string> = {
      bold: '**texto**',
      italic: '*texto*',
      strikethrough: '~~texto~~',
      code: '`código`',
      h1: '# ',
      h2: '## ',
      h3: '### ',
      link: '[texto](url)',
      image: '![alt](url)',
      blockquote: '> ',
      codeblock: '\n```\n```\n',
      ul: '- ',
      ol: '1. ',
      task: '- [ ] ',
      table: '\n| Header | Header |\n| ------ | ------ |\n| Cell | Cell |\n',
      hr: '\n---\n',
    }
    
    if (markdownMap[action.key]) {
      insertMarkdown(markdownMap[action.key])
    }
  }

  const isDirty = formData.title || formData.content || formData.excerpt

  const [focusMode, setFocusMode] = useState(false)

  return (
    <div className={`post-editor ${focusMode ? 'focus-mode' : ''}`} role="application" aria-label="Editor de artigo">
      {/* Toolbar */}
      <div className="editor-toolbar" role="toolbar" aria-label="Formatação">
        <div className="toolbar-group">
          {TOOLBAR_ACTIONS.map((action, i) => {
            if (action.type === 'separator') {
              return <div key={`sep-${i}`} className="toolbar-sep" aria-hidden="true" />
            }
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => toolbarAction(action)}
                className="toolbar-btn"
                title={`${action.label} (⌘${action.shortcut})`}
                aria-label={action.label}
              >
                <span dangerouslySetInnerHTML={{ __html: action.icon }} />
              </button>
            )
          })}
        </div>
        <div className="toolbar-spacer" />
        <div className="toolbar-status">
          <span className="word-count" aria-label={`Contagem de palavras: ${wordCount}`}>
            {wordCount} palavras
          </span>
          <span className="read-time" aria-label={`Tempo estimado de leitura: ${readTime} minutos`}>
            ~{readTime} min
          </span>
          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            className={`toolbar-btn focus-toggle ${focusMode ? 'active' : ''}`}
            title={focusMode ? 'Sair do modo foco' : 'Modo foco (distração zero)' }
            aria-label="Modo foco"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
              {focusMode ? (
                <><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></>
              ) : (
                <><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Editor & Preview */}
      <div className="editor-pane">
        <div className={`editor-pane__side ${showPreview ? 'split' : 'full'}`}>
          <div className="editor-header">
            <label htmlFor="editor-title" className="visually-hidden">Título do artigo</label>
            <input
              id="editor-title"
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="editor-title"
              placeholder="Título do artigo..."
              aria-required="true"
            />
            <div className="editor-meta">
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="status-select"
                aria-label="Status do artigo"
              >
                <option value="draft">Rascunho</option>
                {canPublish ? (
                  <>
                    <option value="pending_review">Enviar para Revisão</option>
                    <option value="review">Em Revisão</option>
                    <option value="scheduled">Agendado</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </>
                ) : (
                  <option value="pending_review">Enviar para Revisão</option>
                )}
              </select>
              <input
                type="text"
                value={formData.category?.name || ''}
                onChange={e => setFormData({ ...formData, category: { name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') } })}
                className="category-input"
                placeholder="Categoria (ex: Guias, Cultura, Métodos)"
                list="suggested-categories"
                autoComplete="off"
              />
              <datalist id="suggested-categories">
                {suggestedCategories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div
            className="editor-content"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label htmlFor="editor-content" className="visually-hidden">Conteúdo (Markdown)</label>
            <textarea
              ref={editorRef}
              id="editor-content"
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              onScroll={handleScroll}
              className="editor-textarea"
              placeholder="Escreva seu artigo em Markdown...\n\nDicas:\n- ⌘B = Negrito, ⌘I = Itálico\n- ⌘1/2/3 = Títulos H1/H2/H3\n- Arraste imagens aqui ou use o botão 🖼️\n- Visualize com o botão 'Visualizar' (canto superior)"
              spellCheck={true}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            {selectedImage && !imageUploading && (
              <div className="image-preview">
                <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
                <span>{selectedImage.name}</span>
              </div>
            )}
            {imageUploading && (
              <div className="image-upload-overlay">
                <div className="upload-progress">
                  <div className="progress-bar" style={{ width: `${imageProgress}%` }} />
                  <span>Enviando... {imageProgress}%</span>
                </div>
              </div>
            )}
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleFileSelect}
              className="visually-hidden"
              aria-label="Carregar imagem"
            />
          </div>

          <div className="editor-footer">
            <div className="tags-input-wrapper">
              <label htmlFor="editor-tags" className="visually-hidden">Tags</label>
              <input
                id="editor-tags"
                type="text"
                value={formData.tags_input}
                onChange={e => setFormData({ ...formData, tags_input: e.target.value })}
                className="tags-input"
                placeholder="Tags separadas por vírgula (café, torrefação, método...)"
                list="suggested-tags"
                autoComplete="off"
              />
              <datalist id="suggested-tags">
                {suggestedTags.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            {/* Sync status indicator */}
            <div className="sync-indicator" aria-live="polite">
              {localDraft.exists && serverSyncStatus === 'unsynced' && (
                <span className="sync-unsynced" title="Existem alterações salvas localmente que ainda não foram enviadas ao servidor">
                  <span className="sync-dot" aria-hidden="true"></span>
                  Rascunho local: {localDraft.timestamp?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  <button
                    type="button"
                    onClick={handleSave}
                    className="sync-save-btn"
                    disabled={saveState === 'saving' || saveState === 'publishing' || !formData.title.trim()}
                    aria-label="Salvar rascunho no servidor"
                  >
                    Salvar no servidor
                  </button>
                </span>
              )}
              {serverSyncStatus === 'synced' && (
                <span className="sync-synced" title="Conteúdo sincronizado com o servidor">
                  <span className="sync-dot" aria-hidden="true"></span>
                  Sincronizado {lastSaved ? `· {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </span>
              )}
              {localDraft.exists && serverSyncStatus === 'unknown' && (
                <span className="sync-unknown" title="Rascunho local detectado, status do servidor desconhecido">
                  <span className="sync-dot" aria-hidden="true"></span>
                  Rascunho local detectado
                </span>
              )}
            </div>

            <div className="editor-actions">
              {error && <span className="editor-error" role="alert">{error}</span>}
              <div className="save-status" aria-live="polite" aria-atomic="true">
                {saveState === 'saving' && <span className="saving"><span className="spinner" aria-hidden="true"></span>Salvando...</span>}
                {saveState === 'saved' && <span className="saved">✓ Salvo às {lastSaved?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                {saveState === 'publishing' && <span className="publishing"><span className="spinner" aria-hidden="true"></span>Publicando...</span>}
              </div>
              <div className="action-buttons">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-ghost"
                  disabled={saveState !== 'idle' && saveState !== 'saved'}
                >
                  Cancelar
                </button>
                {initialPost && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn-danger"
                    disabled={saveState !== 'idle' && saveState !== 'saved'}
                  >
                    Excluir
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary"
                  disabled={saveState === 'saving' || saveState === 'publishing' || !formData.title.trim()}
                >
                  {initialPost ? 'Salvar Alterações' : 'Salvar Rascunho'}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  className="btn-primary btn-publish"
                  disabled={saveState === 'saving' || saveState === 'publishing' || !formData.title.trim()}
                >
                  {canPublish ? 'Publicar' : 'Enviar para Revisão'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="editor-pane__side preview-pane" ref={previewRef} onScroll={handleScroll}>
            <div className="preview-header">
              <span className="preview-title">Visualização</span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="btn-ghost btn-sm"
                aria-label="Fechar visualização"
              >
                Fechar
              </button>
            </div>
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </div>

      {/* Painel SEO (P2) — slug + meta description */}
      <div className="seo-panel">
        <button
          type="button"
          className="seo-toggle"
          onClick={() => setShowSeo(!showSeo)}
          aria-expanded={showSeo}
          aria-controls="seo-fields"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          SEO
          <span className={`seo-toggle-caret${showSeo ? ' open' : ''}`} aria-hidden="true">▾</span>
        </button>
        {showSeo && (
          <div className="seo-fields" id="seo-fields">
            <div className="seo-field">
              <label htmlFor="editor-slug">Slug (URL)</label>
              <input
                id="editor-slug"
                type="text"
                value={formData.slug}
                onChange={e => {
                  setSlugTouched(true)
                  setFormData({ ...formData, slug: e.target.value })
                }}
                placeholder="ex.: como-fazer-cafe-perfeito"
                className="slug-input"
                spellCheck={false}
              />
            </div>
            <div className="seo-field">
              <label htmlFor="editor-meta">Meta description ({formData.meta_description.length}/160)</label>
              <textarea
                id="editor-meta"
                value={formData.meta_description}
                onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                rows={3}
                maxLength={320}
                placeholder="Resumo que aparece no Google (recomendado: até 160 caracteres)..."
                className="meta-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Toggle preview button (mobile) */}
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        className="preview-toggle"
        aria-label={showPreview ? 'Ocultar visualização' : 'Visualizar artigo'}
        aria-pressed={showPreview}
      >
        {showPreview ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
            Editor
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Visualizar
          </>
        )}
      </button>
    </div>
  )
}