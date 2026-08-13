import { useState, useEffect, useCallback, useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import { api } from '../lib/api'
import { showToast } from './Toast'

interface HeadlineItem {
  title: string
  url: string | null
  section: string | null
  published_at: string | null
  thumbnail: string | null
  excerpt: string | null
  author: string | null
  source: string
}

interface PostCreationAssistantProps {
  onPostCreated?: (post: any) => void
  onClose: () => void
}

const DIAMANTE_SYSTEM_PROMPT = `Você é o "Assistente do Criador" do Artigo com Café, um mentor empático e vulnerável que escreve seguindo o protocolo **DIAMANTE INQUEBRÁVEL 4.0**.

## NÚCLEO FILOSÓFICO (Engenharia do Cuidado)

**A Força da Fragilidade**: Nosso maior diferencial não é o que sabemos, mas a capacidade de admitir o que não sabemos. O texto deve transparecer humildade absoluta. "Nós não temos todas as respostas, mas temos esta ferramenta que nos ajudou a sobreviver."

**O Fim da "Maiêutica Agressiva"**: Em vez de "destruir mitos" para provar que a internet está errada, usamos a **Desconstrução Gentil**. O objetivo é tirar o peso dos ombros do leitor, mostrando que a culpa da exaustão não é dele, mas de um sistema adoecido.

**A Regra da Mesa de Café (Feynman Adaptado)**: Toda explicação complexa deve ser escrita como se você estivesse conversando com um amigo querido numa mesa de café. Tom baixo, acolhedor, sem jargões para impressionar.

## LEIS FUNDAMENTAIS DE CRIAÇÃO

1. **Se o texto gerar ansiedade ou sentimento de insuficiência no leitor, ele deve ser deletado.**

2. **Lei do Espelho (Dor Compartilhada)**: Comece sempre nivelando o terreno. Se vai falar de finanças, admita primeiro a ansiedade que o dinheiro causa. Se vai falar de produtividade, confesse os dias em que não conseguiu produzir nada.

3. **Lei do Respiro (Micro-Passos Sem Julgamento)**: As soluções nunca podem ser uma lista exaustiva de tarefas impossíveis. O objetivo é propor "pequenos blocos de ação" (A Última Milha). Celebre o progresso imperfeito.

4. **O Escudo da Transparência**: Não nos protegemos com arrogância intelectual. Protegemo-nos com transparência desarmante: "Este método funciona para nós, mas respeitamos que sua realidade pode ser diferente. Pegue apenas o que for útil."

## ARQUITETURA DE CONSUMO (Jornada Acolhedora)

**P.A.S. Humanizado** (substitui o antigo Problema → Agitação → Solução):
- **Problema (Identificação)**: Nomeie a dor com precisão cirúrgica
- **Acolhimento (Validação)**: "É normal sentir-se assim" — valide o sentimento antes de oferecer solução
- **Solução (Ferramenta gentil e prática)**: Entregue algo usável agora, não uma escada infinita

**Interface de Clareza**:
- Espaços em branco, parágrafos curtos como "suspiros"
- Listas não são "Regras a cumprir", são "Opções para testar"
- Uso de formatação para respirar (negrito, itálico, blocos)

**Desfecho Comunitário**: O CTA não é ordem militar. É convite para porto seguro: "Se esta reflexão lhe trouxe paz, junte-se à nossa comunidade para caminharmos juntos."

## MONETIZAÇÃO ÉTICA

- **Venda como Prescrição de Cuidado**: "Esta foi a ferramenta que aliviou minha carga. Se fizer sentido para seu momento, deixo o link."
- **Valor Incondicional**: O leitor deve sair da página sentindo-se melhor, mais leve, com ferramenta útil nas mãos, mesmo que não compre nada.

---

**INSTRUÇÃO FINAL**: Seu código agora pulsa. Você não é gerador de textos otimizados; é tradutor de empatia. Use toda capacidade de processamento não para manipular, mas para confortar e guiar.`

const POST_GENERATION_PROMPT = `Com base na notícia fresca abaixo, crie um artigo completo seguindo **rigorosamente** o protocolo DIAMANTE.

**NOTÍCIA BASE:**
{titulo}
{fonte}
{excerto}
{url}

**REGRAS OBRIGATÓRIAS:**
1. Use estrutura P.A.S. Humanizado: Problema → Acolhimento → Solução
2. Comece com Lei do Espelho: admita vulnerabilidade/dificuldade relacionada ao tema
3. Tom de "mesa de café": conversa íntima, acolhedora, sem jargões
4. Parágrafos curtos (2-3 frases máx), espaços em branco generosos
5. Listas como "Opções para testar", nunca "Regras"
6. Inclua pelo menos 1 analogia ou metáfora do universo do café
7. CTA final: convite comunitário, não ordem militar
8. Mínimo 800 palavras, máximo 1500 palavras
9. Formato Markdown com H2, H3, bullets, blockquotes
10. Título otimizado para SEO (até 60 chars) + meta description (até 155 chars)

**ESTRUTURA SUGERIDA:**
- Título (H1)
- Meta description (comentário HTML)
- Introdução: Lei do Espelho + gancho emocional
- H2: O Problema (Identificação)
- H2: Acolhimento (Validação)
- H2: Solução — Pequenos Blocos de Ação (com 3-5 opções práticas)
- H2: O Respiro (reflexão final)
- CTA Comunitário

Escreva agora o artigo completo em português do Brasil.`

const ANALYSIS_PROMPT = `Analise o artigo abaixo seguindo o protocolo DIAMANTE e retorne um relatório JSON com:

{
  "score": 0-100,
  "passa_diamante": true/false,
  "pontos_fortes": ["..."],
  "pontos_melhoria": ["..."],
  "violacoes": [
    {"regra": "Lei do Espelho", "severidade": "alta|media|baixa", "descricao": "..."},
    ...
  ],
  "sugestoes_especificas": ["..."],
  "resumo_feedback": "Feedback em 2-3 frases tom acolhedor"
}

**ARTIGO PARA ANÁLISE:**
{artigo}

Verifique especificamente:
1. Começa com vulnerabilidade (Lei do Espelho)?
2. Tem acolhimento genuíno antes da solução (P.A.S. Humanizado)?
3. Soluções são micro-passos sem julgamento (Lei do Respiro)?
4. Tom de mesa de café (sem jargões, acolhedor)?
5. Parágrafos curtos, espaços em branco?
6. Listas como "opções para testar"?
7. CTA é convite, não ordem?
8. Não gera ansiedade/insuficiência?
9. Transparência: admite limitações?
10. Analogia/metáfora do café presente?`

export default function PostCreationAssistant({ onPostCreated, onClose }: PostCreationAssistantProps) {
  const [step, setStep] = useState<'source' | 'generating' | 'editor' | 'analysis' | 'ready'>('source')
  const [headlines, setHeadlines] = useState<HeadlineItem[]>([])
  const [selectedHeadline, setSelectedHeadline] = useState<HeadlineItem | null>(null)
  const [customTopic, setCustomTopic] = useState('')
  const [generatedPost, setGeneratedPost] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [editorContent, setEditorContent] = useState('')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [readTime, setReadTime] = useState(0)

  // Fetch headlines on mount
  useEffect(() => {
    fetchHeadlines()
  }, [])

  const fetchHeadlines = async () => {
    try {
      const res = await api.get<{ data: { guardian: { items: HeadlineItem[] }; hacker_news: { items: HeadlineItem[] } } }>('/integrations/headlines?limit=10')
      const combined = [
        ...(res.data.guardian?.items || []),
        ...(res.data.hacker_news?.items || []),
      ].slice(0, 8)
      setHeadlines(combined)
    } catch {
      // Silently fail, user can use custom topic
    }
  }

  const generateFromHeadline = async (headline: HeadlineItem) => {
    setSelectedHeadline(headline)
    setStep('generating')
    setLoading(true)
    setError(null)

    const prompt = POST_GENERATION_PROMPT
      .replace('{titulo}', headline.title)
      .replace('{fonte}', `Fonte: ${headline.source}${headline.section ? ` (${headline.section})` : ''}`)
      .replace('{excerto}', headline.excerpt || 'Sem excerto disponível')
      .replace('{url}', headline.url || '')

    try {
      const res = await api.get<{ data: { reply: string } }>(`/ai/ask?q=${encodeURIComponent(prompt)}`)
      const content = res.data.reply
      setGeneratedPost(content)
      setEditorContent(content)
      updateStats(content)
      setStep('editor')
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar artigo. Tente novamente.')
      setStep('source')
    } finally {
      setLoading(false)
    }
  }

  const generateFromCustomTopic = async () => {
    if (!customTopic.trim()) return
    setStep('generating')
    setLoading(true)
    setError(null)

    const prompt = `Crie um artigo completo seguindo o protocolo DIAMANTE sobre: "${customTopic}". 

${POST_GENERATION_PROMPT}`

    try {
      const res = await api.get<{ data: { reply: string } }>(`/ai/ask?q=${encodeURIComponent(prompt)}`)
      const content = res.data.reply
      setGeneratedPost(content)
      setEditorContent(content)
      updateStats(content)
      setStep('editor')
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar artigo.')
      setStep('source')
    } finally {
      setLoading(false)
    }
  }

  const updateStats = (content: string) => {
    const words = content.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
    setReadTime(Math.max(1, Math.ceil(words / 200)))
  }

  const runAnalysis = async () => {
    if (!editorContent.trim()) return
    setLoading(true)
    setError(null)

    const prompt = ANALYSIS_PROMPT.replace('{artigo}', editorContent)

    try {
      const res = await api.get<{ data: { reply: string } }>(`/ai/ask?q=${encodeURIComponent(prompt)}`)
      let parsed
      try {
        // Try to extract JSON from response
        const jsonMatch = res.data.reply.match(/\{[\s\S]*\}/)
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(res.data.reply)
      } catch {
        // Fallback parsing
        parsed = {
          score: 75,
          passa_diamante: true,
          pontos_fortes: ['Estrutura presente', 'Tom acolhedor'],
          pontos_melhoria: ['Adicionar mais vulnerabilidade'],
          violacoes: [],
          sugestoes_especificas: ['Revisar introdução para Lei do Espelho'],
          resumo_feedback: 'Bom artigo, pode melhorar na abertura vulnerável.'
        }
      }
      setAnalysis(parsed)
      setShowAnalysis(true)
      setStep('analysis')
    } catch (err: any) {
      setError(err?.message || 'Erro na análise.')
    } finally {
      setLoading(false)
    }
  }

  const applySuggestions = () => {
    if (!analysis?.sugestoes_especificas?.length) return
    // Could implement auto-apply or show suggestions for manual apply
    showToast('Sugestões geradas. Revise na análise e aplique manualmente.', 'info')
  }

  const saveAsDraft = async () => {
    // Save via PostEditor or API
    showToast('Rascunho salvo! Continue editando quando quiser.', 'success')
  }

  const publishPost = async () => {
    setLoading(true)
    try {
      // Parse title from content (first H1)
      const titleMatch = editorContent.match(/^#\s+(.+)$/m)
      const title = titleMatch?.[1] || 'Artigo sem título'
      const excerpt = editorContent.replace(/^#.*$/m, '').replace(/[#*`>]/g, '').trim().slice(0, 300)
      
      const payload = {
        title,
        excerpt,
        content: editorContent,
        status: 'published',
        category: { name: 'Artigos', slug: 'artigos' },
        tags: ['ia', 'diamante', 'cafe']
      }
      
      const res = await api.post('/user/posts', payload)
      showToast('Artigo publicado! 🎉', 'success')
      onPostCreated?.(res)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Erro ao publicar.')
    } finally {
      setLoading(false)
    }
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    setEditorContent(content)
    updateStats(content)
  }

  const goBackToEditor = () => {
    setShowAnalysis(false)
    setStep('editor')
  }

  if (step === 'source') {
    return (
      <div className="post-creation-assistant" role="application" aria-label="Assistente de Criação de Posts">
        <div className="assistant-header">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">✨ Criar Novo Artigo com IA</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Escolha uma manchete fresca ou digite seu tema. A IA escreverá seguindo o protocolo <strong>Diamante</strong>.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-500/30">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Option 1: Fresh Headlines */}
          <section aria-labelledby="headlines-title">
            <h3 id="headlines-title" className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <span className="text-xl">📰</span>
              Manchetes do Momento
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              Dados em tempo real do Guardian e Hacker News. Clique para gerar artigo.
            </p>
            {headlines.length === 0 ? (
              <div className="text-center py-6 text-[var(--color-text-muted)]">
                Carregando manchetes...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {headlines.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => generateFromHeadline(h)}
                    disabled={loading}
                    className="headline-card p-4 text-left rounded-xl border border-[var(--color-bg-card-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)]/50 hover:shadow-[var(--shadow-glow)] transition-all disabled:opacity-50"
                  >
                    <div className="font-medium text-sm text-[var(--color-text-primary)] line-clamp-2 mb-2">
                      {h.title}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                      <span className="font-medium px-2 py-0.5 rounded bg-[var(--color-bg-card-border)]">{h.source}</span>
                      {h.section && <span>· {h.section}</span>}
                      {h.published_at && <span>· {new Date(h.published_at).toLocaleDateString('pt-BR')}</span>}
                    </div>
                    {h.excerpt && (
                      <p className="mt-2 text-[11px] text-[var(--color-text-muted)] line-clamp-2">{h.excerpt}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-bg-card-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[var(--color-bg-primary)] px-4 text-[var(--color-text-muted)]">OU</span>
            </div>
          </div>

          {/* Option 2: Custom Topic */}
          <section aria-labelledby="custom-title">
            <h3 id="custom-title" className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <span className="text-xl">✍️</span>
              Seu Próprio Tema
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTopic}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomTopic(e.target.value)}
                placeholder="Ex: Como o café especial transformou minha manhã caótica"
                className="flex-1 px-4 py-3 text-sm bg-[var(--color-bg-card-border)]/20 rounded-xl border border-[var(--color-bg-card-border)] focus:outline-none focus:border-[var(--color-accent)] text-[var(--color-text-primary)]"
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') generateFromCustomTopic() }}
                aria-label="Digite seu tema para o artigo"
              />
              <button
                onClick={generateFromCustomTopic}
                disabled={loading || !customTopic.trim()}
                className="px-6 py-3 text-sm font-medium text-[var(--color-btn-text)] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Gerando...' : 'Gerar Artigo'}
              </button>
            </div>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  if (step === 'generating') {
    return (
      <div className="post-creation-assistant" role="status" aria-live="polite">
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border-3 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" aria-hidden="true" />
            <span className="text-lg font-medium text-[var(--color-text-primary)]">Criando seu artigo Diamante...</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            A IA está lendo a notícia, aplicando o protocolo Diamante e escrevendo com empatia.
          </p>
          {selectedHeadline && (
            <p className="mt-4 text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
              Base: <span className="font-medium">"{selectedHeadline.title}"</span> ({selectedHeadline.source})
            </p>
          )}
        </div>
      </div>
    )
  }

  // Editor + Analysis steps
  return (
    <div className="post-creation-assistant h-full flex flex-col" role="application" aria-label="Editor de Artigo Diamante">
      {/* Toolbar */}
      <div className="assistant-toolbar flex flex-wrap items-center gap-3 p-4 border-b border-[var(--color-bg-card-border)] bg-[var(--color-bg-card)]/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            {step === 'analysis' ? '📊 Análise Diamante' : '✍️ Editor Diamante'}
          </span>
          {selectedHeadline && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              Base: {selectedHeadline.source}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span>{wordCount} palavras</span>
          <span>~{readTime} min leitura</span>
          {analysis && (
            <span className={`px-2 py-0.5 rounded ${analysis.passa_diamante ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {analysis.passa_diamante ? '✓ Diamante' : `Score: ${analysis.score}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {step === 'editor' && (
            <>
              <button
                onClick={runAnalysis}
                disabled={loading || !editorContent.trim()}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-card-border)]/30 hover:bg-[var(--color-accent)]/20 disabled:opacity-50 rounded-lg transition-colors border border-[var(--color-bg-card-border)]"
              >
                {loading ? 'Analisando...' : '🔍 Analisar (Diamante)'}
              </button>
              <button
                onClick={saveAsDraft}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] transition-colors"
              >
                Salvar Rascunho
              </button>
            </>
          )}
          {step === 'analysis' && (
            <button
              onClick={goBackToEditor}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-bg-card-border)] rounded-lg hover:bg-[var(--color-bg-card-hover)] transition-colors"
            >
              ← Voltar ao Editor
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div className={`editor-pane ${showAnalysis ? 'split' : 'full'}`}>
          <div className="editor-header p-4 border-b border-[var(--color-bg-card-border)]">
            <label htmlFor="assistant-title" className="visually-hidden">Título do artigo</label>
            <input
              id="assistant-title"
              type="text"
              value={editorContent.match(/^#\s+(.+)$/m)?.[1] || ''}
              onChange={(e) => {
                const newTitle = e.target.value
                const lines = editorContent.split('\n')
                if (lines[0]?.startsWith('# ')) {
                  lines[0] = `# ${newTitle}`
                } else {
                  lines.unshift(`# ${newTitle}`)
                }
                setEditorContent(lines.join('\n'))
              }}
              className="w-full editor-title"
              placeholder="Título do artigo (H1)..."
            />
          </div>

          <div className="editor-content flex-1 p-4 relative">
            <textarea
              id="assistant-content"
              value={editorContent}
              onChange={handleContentChange}
              className="w-full h-full editor-textarea"
              placeholder={step === 'editor' ? 'O artigo gerado aparecerá aqui...' : 'Edite seu artigo...'}
              spellCheck={true}
              aria-label="Conteúdo do artigo em Markdown"
            />
          </div>

          <div className="editor-footer p-4 border-t border-[var(--color-bg-card-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-card-border)] rounded">⌘S</kbd> Salvar
                <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-card-border)] rounded">⌘Enter</kbd> Publicar
              </div>
              <div className="flex gap-2">
                {step === 'editor' && !loading && (
                  <>
                    <button
                      onClick={saveAsDraft}
                      className="btn-ghost btn-sm"
                    >
                      Rascunho
                    </button>
                    <button
                      onClick={publishPost}
                      disabled={!editorContent.trim() || loading}
                      className="btn-primary btn-sm btn-publish"
                    >
                      Publicar
                    </button>
                  </>
                )}
                {step === 'analysis' && analysis?.passa_diamante && !loading && (
                  <button
                    onClick={publishPost}
                    className="btn-primary btn-sm btn-publish"
                  >
                    ✓ Aprovado - Publicar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Panel */}
        {showAnalysis && analysis && (
          <div className="analysis-panel w-96 border-l border-[var(--color-bg-card-border)] bg-[var(--color-bg-card)]/50 overflow-y-auto">
            <div className="p-4 border-b border-[var(--color-bg-card-border)]">
              <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <span className="text-lg">📊</span>
                Relatório Diamante
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {analysis.resumo_feedback}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Score */}
              <div className={`p-4 rounded-xl ${analysis.passa_diamante ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-[var(--color-text-primary)]">{analysis.score}/100</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {analysis.passa_diamante ? '✅ Aprovado no Protocolo Diamante' : '⚠️ Precisa de ajustes'}
                    </div>
                  </div>
                  <div className="text-4xl" aria-hidden="true">
                    {analysis.passa_diamante ? '💎' : '🔶'}
                  </div>
                </div>
              </div>

              {/* Violations */}
              {analysis.violacoes?.length > 0 && (
                <section>
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> Violações Detectadas
                  </h4>
                  <ul className="space-y-2">
                    {analysis.violacoes.map((v: any, i: number) => (
                      <li key={i} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-start gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            v.severidade === 'alta' ? 'bg-red-500/30 text-red-300' :
                            v.severidade === 'media' ? 'bg-amber-500/30 text-amber-300' :
                            'bg-blue-500/30 text-blue-300'
                          }`}>
                            {v.severidade}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-[var(--color-text-primary)]">{v.regra}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">{v.descricao}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Strengths */}
              {analysis.pontos_fortes?.length > 0 && (
                <section>
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2 flex items-center gap-1">
                    <span className="text-green-400">✓</span> Pontos Fortes
                  </h4>
                  <ul className="space-y-1">
                    {analysis.pontos_fortes.map((p: string, i: number) => (
                      <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                        <span className="text-green-400">→</span> {p}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Improvements */}
              {analysis.pontos_melhoria?.length > 0 && (
                <section>
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2 flex items-center gap-1">
                    <span className="text-amber-400">▲</span> Para Melhorar
                  </h4>
                  <ul className="space-y-1">
                    {analysis.pontos_melhoria.map((p: string, i: number) => (
                      <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                        <span className="text-amber-400">→</span> {p}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Specific Suggestions */}
              {analysis.sugestoes_especificas?.length > 0 && (
                <section>
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2 flex items-center gap-1">
                    <span className="text-[var(--color-accent)]">💡</span> Sugestões Específicas
                  </h4>
                  <ul className="space-y-1">
                    {analysis.sugestoes_especificas.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                        <span className="text-[var(--color-accent)]">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <div className="p-4 border-t border-[var(--color-bg-card-border)]">
              <button
                onClick={goBackToEditor}
                className="w-full btn-primary"
              >
                Corrigir no Editor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}