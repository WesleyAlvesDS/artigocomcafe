/**
 * Carrinho da Loja — 100% client-side (localStorage).
 * Usado por /loja, /loja/[slug], /loja/checkout e /loja/confirmacao.
 *
 * Padrão de integração:
 *   - Botões "adicionar ao carrinho": <button data-add-to-cart data-slug
 *     data-name data-price data-image data-delivery-note>
 *   - A renderização dos itens e o badge são atualizados via evento
 *     `cart:update` (disparado por saveCart) + re-render em astro:page-load.
 */

export interface CartItem {
  slug: string
  name: string
  price: number
  image: string
  qty: number
  deliveryNote?: string
}

const CART_KEY = 'acf-cart'
const FREE_SHIPPING_THRESHOLD = 199
const FLAT_SHIPPING = 19.9

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function getCart(): CartItem[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function cartCount(): number {
  return getCart().reduce((sum, item) => sum + item.qty, 0)
}

export function cartSubtotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0)
}

export function cartShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
}

export function cartTotal(): number {
  const subtotal = cartSubtotal()
  return subtotal + cartShipping(subtotal)
}

function emitUpdate(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('cart:update'))
}

function persist(items: CartItem[]): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    /* storage cheio/indisponível — segue sem persistir */
  }
  emitUpdate()
}

export function addToCart(item: Omit<CartItem, 'qty'>, qty = 1): void {
  const cart = getCart()
  const existing = cart.find(i => i.slug === item.slug)
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 99)
  } else {
    cart.push({ ...item, qty: Math.min(qty, 99) })
  }
  persist(cart)
}

export function updateQty(slug: string, qty: number): void {
  const cart = getCart()
  const item = cart.find(i => i.slug === slug)
  if (!item) return
  if (qty <= 0) {
    persist(cart.filter(i => i.slug !== slug))
    return
  }
  item.qty = Math.min(qty, 99)
  persist(cart)
}

export function removeFromCart(slug: string): void {
  persist(getCart().filter(i => i.slug !== slug))
}

export function clearCart(): void {
  persist([])
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── UI wiring ────────────────────────────────────────────────────────

function esc(s: string | number | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function showToast(title: string, type = 'success', message?: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('app:show-toast', {
    detail: { title, type, message },
  }))
}

/** Renderiza os itens do carrinho no drawer. */
function renderCart(): void {
  const drawer = document.querySelector('[data-cart-drawer]')
  if (!drawer) return

  const list = drawer.querySelector('[data-cart-items]')
  const empty = drawer.querySelector('[data-cart-empty]')
  const footer = drawer.querySelector('[data-cart-footer]')
  const countBadges = document.querySelectorAll('[data-cart-count]')
  const subtotalEl = drawer.querySelector('[data-cart-subtotal]')
  const shippingEl = drawer.querySelector('[data-cart-shipping]')
  const totalEl = drawer.querySelector('[data-cart-total]')
  const progressEl = drawer.querySelector('[data-cart-shipping-progress]')
  const progressText = drawer.querySelector('[data-cart-shipping-text]')

  const items = getCart()
  const count = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = cartShipping(subtotal)
  const total = subtotal + shipping

  countBadges.forEach(b => {
    b.textContent = String(count)
    b.classList.toggle('has-items', count > 0)
  })

  if (list) {
    if (items.length === 0) {
      list.innerHTML = ''
      empty?.classList.remove('hidden')
      footer?.classList.add('hidden')
    } else {
      empty?.classList.add('hidden')
      footer?.classList.remove('hidden')
      list.innerHTML = items.map(item => `
        <div class="cart-item" data-cart-item="${esc(item.slug)}">
          <a class="cart-item-img" href="/loja/${esc(item.slug)}/" tabindex="-1" aria-hidden="true">
            <img src="${esc(item.image)}" alt="" width="72" height="72" loading="lazy" decoding="async" />
          </a>
          <div class="cart-item-body">
            <a class="cart-item-name" href="/loja/${esc(item.slug)}/">${esc(item.name)}</a>
            <span class="cart-item-price">${formatBRL(item.price)}</span>
            <div class="cart-item-actions">
              <div class="cart-qty-stepper" data-cart-qty="${esc(item.slug)}">
                <button type="button" data-cart-minus="${esc(item.slug)}" aria-label="Diminuir quantidade de ${esc(item.name)}">−</button>
                <span data-cart-qty-value>${item.qty}</span>
                <button type="button" data-cart-plus="${esc(item.slug)}" aria-label="Aumentar quantidade de ${esc(item.name)}">+</button>
              </div>
              <button type="button" class="cart-item-remove" data-cart-remove="${esc(item.slug)}" aria-label="Remover ${esc(item.name)} do carrinho">Remover</button>
            </div>
          </div>
        </div>
      `).join('')
    }
  }

  if (subtotalEl) subtotalEl.textContent = formatBRL(subtotal)
  if (shippingEl) {
    shippingEl.textContent = shipping === 0 ? 'Grátis' : formatBRL(shipping)
    shippingEl.classList.toggle('free', shipping === 0)
  }
  if (totalEl) totalEl.textContent = formatBRL(total)

  if (progressEl && progressText) {
    const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))
    progressEl.style.width = `${pct}%`
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      progressText.textContent = '🎉 Você ganhou frete grátis!'
    } else {
      const missing = FREE_SHIPPING_THRESHOLD - subtotal
      progressText.textContent = `Faltam ${formatBRL(missing)} para o frete grátis`
    }
  }
}

function openDrawer(): void {
  const drawer = document.querySelector('[data-cart-drawer]')
  if (!drawer) return
  drawer.classList.add('open')
  document.body.style.overflow = 'hidden'
  renderCart()
}

function closeDrawer(): void {
  const drawer = document.querySelector('[data-cart-drawer]')
  if (!drawer) return
  drawer.classList.remove('open')
  document.body.style.overflow = ''
}

function initCart(): void {
  // Guarda global: várias páginas/componentes podem chamar initCart no
  // mesmo carregamento (ex.: página + CartDrawer) sem duplicar listeners.
  if (typeof window !== 'undefined' && (window as unknown as Record<string, boolean>).__acfCartInit) return
  if (typeof window !== 'undefined') (window as unknown as Record<string, boolean>).__acfCartInit = true

  // Re-renderiza o badge/drawer após navegação SPA (o DOM é novo, o carrinho não).
  document.addEventListener('astro:page-load', () => renderCart())

  // Delegação no document: sobrevive à navegação SPA (astro:after-swap).
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null
    if (!target || !target.closest) return

    // Botão comprar agora: adiciona e vai direto ao checkout.
    const buyBtn = target.closest<HTMLElement>('[data-buy-now]')
    if (buyBtn) {
      e.preventDefault()
      const slug = buyBtn.dataset.slug
      if (!slug) return
      addToCart({
        slug,
        name: buyBtn.dataset.name || 'Produto',
        price: Number(buyBtn.dataset.price || 0),
        image: buyBtn.dataset.image || '/images/products/fallback.svg',
        deliveryNote: buyBtn.dataset.deliveryNote,
      }, qtyFromBox(buyBtn))
      window.location.href = '/loja/checkout/'
      return
    }

    // Stepper de quantidade da página de produto.
    const qtyMinus = target.closest('[data-qty-minus]')
    const qtyPlus = target.closest('[data-qty-plus]')
    if (qtyMinus || qtyPlus) {
      const box = (qtyMinus || qtyPlus)!.closest<HTMLElement>('[data-buy-box]')
      const valueEl = box?.querySelector<HTMLElement>('[data-product-qty]')
      if (!box || !valueEl) return
      const current = Number(valueEl.textContent || '1')
      const next = qtyMinus ? Math.max(1, current - 1) : Math.min(99, current + 1)
      valueEl.textContent = String(next)
      box.querySelectorAll<HTMLElement>('[data-add-to-cart], [data-buy-now]').forEach(b => {
        b.dataset.qty = String(next)
      })
      return
    }

    const addBtn = target.closest<HTMLElement>('[data-add-to-cart]')
    if (addBtn) {
      e.preventDefault()
      const slug = addBtn.dataset.slug
      if (!slug) return
      const name = addBtn.dataset.name || 'Produto'
      const price = Number(addBtn.dataset.price || 0)
      addToCart({ slug, name, price, image: addBtn.dataset.image || '/images/products/fallback.svg', deliveryNote: addBtn.dataset.deliveryNote }, qtyFromBox(addBtn))
      showToast(`${name} no carrinho!`, 'success', { message: 'Continue explorando ou finalize o pedido.' })
      const openAfter = addBtn.dataset.openCart === 'true'
      if (openAfter) openDrawer()
      return
    }

    if (target.closest('[data-cart-open]')) {
      e.preventDefault()
      openDrawer()
      return
    }
    if (target.closest('[data-cart-close]') || target.closest('[data-cart-overlay]')) {
      closeDrawer()
      return
    }
    if (target.closest('[data-cart-clear]')) {
      clearCart()
      showToast('Carrinho esvaziado', 'info')
      return
    }

    const minus = target.closest<HTMLElement>('[data-cart-minus]')
    const plus = target.closest<HTMLElement>('[data-cart-plus]')
    const remove = target.closest<HTMLElement>('[data-cart-remove]')
    if (minus || plus) {
      const slug = (minus || plus)!.dataset.cartMinus || (minus || plus)!.dataset.cartPlus
      if (!slug) return
      const item = getCart().find(i => i.slug === slug)
      if (!item) return
      updateQty(slug, minus ? item.qty - 1 : item.qty + 1)
      return
    }
    if (remove) {
      removeFromCart(remove.dataset.cartRemove || '')
      return
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer()
  })

  window.addEventListener('cart:update', renderCart)
  renderCart()
}

/** Quantidade vinda do stepper da página de produto, se houver. */
function qtyFromBox(btn: HTMLElement): number {
  const box = btn.closest<HTMLElement>('[data-buy-box]')
  const valueEl = box?.querySelector<HTMLElement>('[data-product-qty]')
  const n = Number(valueEl?.textContent || btn.dataset.qty || 1)
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 99) : 1
}

// Exporta para uso em páginas com <script> (Astro faz o bundle).
export { initCart, openDrawer, closeDrawer }
