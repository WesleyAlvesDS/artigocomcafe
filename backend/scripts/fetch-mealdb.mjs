#!/usr/bin/env node
/**
 * Busca receitas de fontes abertas (TheMealDB + TheCocktailDB), traduz o
 * conteúdo essencial para pt-BR e gera backend/database/data/mealdb-recipes.json.
 *
 * Fontes:
 *  - TheMealDB      -> comidas (carnes, frango, sobremesas, veganas, massas...)
 *  - TheCocktailDB  -> bebidas (café/chá/cacau, milkshakes, não alcoólicas)
 * Conteúdo licenciado CC-BY-NC. Atribuição incluída em cada registro.
 *
 * Uso: node backend/scripts/fetch-mealdb.mjs [--max-meals=N] [--max-drinks=N]
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'database', 'data')
const OUT_FILE = join(OUT_DIR, 'mealdb-recipes.json')

const MEALDB = 'https://www.themealdb.com/api/json/v1/1'
const COCKTAILDB = 'https://www.thecocktaildb.com/api/json/v1/1'

const args = process.argv.slice(2)
const argNum = (p, d) => { const m = args.find(a => a.startsWith(p)); return m ? Number(m.split('=')[1]) || d : d }
const MAX_MEALS = argNum('--max-meals', 9999)
const MAX_DRINKS = argNum('--max-drinks', 9999)
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchJson(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 25000)
    try {
      const res = await fetch(url, { signal: ac.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      clearTimeout(t)
      if (i === retries - 1) throw e
      await sleep(1500 * (i + 1))
    }
  }
}

const MEASURE_PT = {
  'cup': 'xícara', 'cups': 'xícaras',
  'tsp': 'colher de chá', 'tsps': 'colheres de chá',
  'tbsp': 'colher de sopa', 'tbsps': 'colheres de sopa', 'tablespoon': 'colher de sopa', 'tablespoons': 'colheres de sopa',
  'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
  'g': 'g', 'kg': 'kg', 'ml': 'ml', 'l': 'litro', 'litre': 'litro', 'litres': 'litros',
  'lb': 'libra', 'lbs': 'libras',
  'pinch': 'pitada', 'dash': 'uma pitada', 'handful': 'punhado',
  'clove': 'dente', 'cloves': 'dentes', 'slice': 'fatia', 'slices': 'fatias',
  'whole': 'inteiro', 'can': 'lata', 'cans': 'latas', 'bunch': 'maço', 'sprig': 'ramo', 'sprigs': 'ramos',
  'packet': 'pacote', 'packet of': 'pacote de', 'bag': 'pacote',
  'to taste': 'a gosto', 'generous pinch': 'pitada generosa', 'large': 'grande', 'medium': 'médio', 'small': 'pequeno',
  'piece': 'unidade', 'pieces': 'unidades', 'filet': 'filé', 'fillet': 'filé', 'fillets': 'filés',
  'square': 'quadrado', 'squares': 'quadrados', 'stick': 'bastão', 'sticks': 'bastões',
  'can (15 ounce)': 'lata (425 g)', 'can (13.5 ounce)': 'lata (400 ml)',
}
const FRACTIONS = { '¼': '1/4', '½': '1/2', '¾': '3/4', '⅓': '1/3', '⅔': '2/3' }

/* ------------------------------ Translation ------------------------------ */
const translateCache = new Map()
async function translate(text, retries = 3) {
  if (!text || !text.trim()) return text
  const key = 'pt|' + text
  if (translateCache.has(key)) return translateCache.get(key)
  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      const ac = new AbortController()
      const t = setTimeout(() => ac.abort(), 20000)
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=' + encodeURIComponent(text)
      const res = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': 'Mozilla/5.0' } })
      clearTimeout(t)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const out = (json[0] || []).map(s => s?.[0] || '').join('')
      translateCache.set(key, out)
      return out
    } catch (e) {
      lastErr = e
      await sleep(800 * (i + 1))
    }
  }
  console.error(`  [TRAD FALHOU] "${text.slice(0, 40)}": ${lastErr?.message}`)
  translateCache.set(key, text)
  return text
}

async function translateLines(lines) {
  if (!lines.length) return lines
  const unique = [...new Set(lines.map(l => String(l).trim()).filter(Boolean))]
  if (!unique.length) return lines
  const translated = await translate(unique.join('\n'))
  const parts = translated.split('\n')
  const out = unique.map((orig, i) => (parts[i] && parts[i].trim()) || orig)
  const map = new Map(unique.map((u, i) => [u, out[i]]))
  return lines.map(l => map.get(String(l).trim()) || l)
}

const translateSingle = translate

/* ------------------------------- Parsers -------------------------------- */
function cleanText(s) {
  return String(s || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\r\n?/g, '\n').trim()
}

function splitSteps(instructions) {
  const text = cleanText(instructions)
  if (!text) return []
  let blocks = text.split(/\n+/).map(b => b.trim()).filter(Boolean)
  if (blocks.length === 1) {
    blocks = text.split(/(?<=[.!?])\s+(?=\S)/).map(b => b.trim()).filter(Boolean)
  }
  return blocks
    .map(b => b.replace(/^\s*(?:step\s*)?\d{1,3}[).:]?\s*/i, '').trim())
    .filter(b => b.length > 0)
}

function parseIngredients(fields) {
  const ings = []
  for (let i = 1; i <= 20; i++) {
    const name = cleanText(fields[`strIngredient${i}`])
    if (!name) continue
    const measure = cleanText(fields[`strMeasure${i}`])
    ings.push({ name, amount: null, unit: measure || null, optional: false })
  }
  return ings
}

function parseMeasure(measure) {
  if (!measure) return { amount: null, unit: null }
  let m = cleanText(measure).toLowerCase()
  for (const [f, r] of Object.entries(FRACTIONS)) m = m.replaceAll(f, r)
  const mm = m.match(/^\s*(\d+(?:\/\d+)?(?:\.\d+)?(?:\s*[-–]\s*\d+)?)\s*(.*)$/)
  if (!mm) return { amount: null, unit: m }
  return { amount: mm[1].trim(), unit: mm[2].trim() || null }
}

function translateUnit(unit) {
  if (!unit) return unit
  const clean = unit.toLowerCase()
  if (MEASURE_PT[clean]) return MEASURE_PT[clean]
  const word = clean.replace(/^\((.+)\)$/, '$1').trim()
  if (MEASURE_PT[word]) return MEASURE_PT[word]
  return clean
}

function parseServings(strYields, isDrink) {
  if (isDrink) return 1
  const m = String(strYields || '').match(/(\d+)\s*[-–]\s*(\d+)/)
  const single = String(strYields || '').match(/(\d+)/)
  if (m) return Number(m[2]) || 1
  if (single) return Number(single[1]) || 1
  return 4
}

function estimateDifficulty(stepCount, ingredientCount) {
  if (stepCount <= 5 && ingredientCount <= 7) return 'facil'
  if (stepCount <= 9) return 'media'
  return 'dificil'
}

/* --------------------------- Category mapping ---------------------------- */
const CAT_MAP = {
  Beef: ['carnes', 'Carnes', '🥩', '#DC2626'],
  Chicken: ['frango', 'Frango', '🍗', '#F97316'],
  Pork: ['carnes', 'Carnes', '🥩', '#DC2626'],
  Lamb: ['carnes', 'Carnes', '🥩', '#DC2626'],
  Goat: ['carnes', 'Carnes', '🥩', '#DC2626'],
  Seafood: ['frutos-do-mar', 'Frutos do Mar', '🦐', '#0891B2'],
  Vegetarian: ['vegetariano', 'Vegetariano', '🥦', '#16A34A'],
  Vegan: ['vegano', 'Vegano', '🌱', '#65A30D'],
  Dessert: ['sobremesas', 'Sobremesas', '🍰', '#EC4899'],
  Breakfast: ['cafe-da-manha', 'Café da Manhã', '🥐', '#F59E0B'],
  Side: ['acompanhamentos', 'Acompanhamentos', '🍞', '#F97316'],
  Starter: ['entradas', 'Entradas', '🥗', '#84CC16'],
  Pasta: ['massas', 'Massas', '🍝', '#EAB308'],
  Miscellaneous: ['pratos-principais', 'Pratos Principais', '🍽️', '#6D28D9'],
  'Coffee / Tea': ['bebidas', 'Bebidas', '☕', '#B45309'],
  Cocoa: ['bebidas', 'Bebidas', '☕', '#B45309'],
  Shake: ['bebidas', 'Bebidas', '🥤', '#0EA5E9'],
  'Milk / Float / Shake': ['bebidas', 'Bebidas', '🥛', '#0EA5E9'],
  'Soft Drink': ['bebidas', 'Bebidas', '🥤', '#0EA5E9'],
  'Other/Unknown': ['bebidas', 'Bebidas', '🥤', '#0EA5E9'],
  'Homemade Liqueur': ['bebidas', 'Bebidas', '🥃', '#0EA5E9'],
}
const CAT_ORDER = {
  'cafe': 1, 'bebidas': 2, 'cafe-gelado': 3, 'cafe-da-manha': 4, 'acompanhamentos': 5,
  'entradas': 6, 'pratos-principais': 7, 'massas': 8, 'carnes': 9, 'frango': 10,
  'frutos-do-mar': 11, 'vegetariano': 12, 'vegano': 13, 'sobremesas': 14, 'doces': 15,
}

function categoryFor(key) {
  const c = CAT_MAP[key]
  if (!c) return ['pratos-principais', 'Pratos Principais', '🍽️', '#6D28D9']
  return c
}

function slugify(s) {
  const base = String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base || 'receita'
}

/* -------------------------------- Fetching ------------------------------- */
async function fetchMealDB() {
  const byId = new Map()
  for (const letter of LETTERS) {
    try {
      const j = await fetchJson(`${MEALDB}/search.php?f=${letter}`)
      const list = j.meals || []
      for (const meal of list) byId.set(meal.idMeal, meal)
      await sleep(500)
    } catch (e) {
      console.error(`  MealDB ${letter} falhou: ${e.message}`)
    }
  }
  return [...byId.values()]
}

function keepDrink(d) {
  const cat = String(d.strCategory || '')
  const name = String(d.strDrink || '')
  const ings = Array.from({ length: 15 }, (_, i) => d[`strIngredient${i + 1}`] || '').join(' ').toLowerCase()
  const hay = (name + ' ' + ings).toLowerCase()
  const coffeeLike = /coffee|cappuccino|espresso|mocha|latte|cafe|carajillo|cortado|iced coffee|ice cream|chocolate|cocoa|tea|milk shake|milkshake|smoothie|frapp/i.test(hay)
  if (cat === 'Shot' || cat === 'Beer' || cat === 'Punch / Party Drink') return false
  if (['Coffee / Tea', 'Cocoa', 'Shake', 'Milk / Float / Shake'].includes(cat)) return true
  if (String(d.strAlcoholic || '') === 'Non alcoholic') return true
  return coffeeLike
}

async function fetchCocktailDB() {
  const byId = new Map()
  for (const letter of LETTERS) {
    try {
      const j = await fetchJson(`${COCKTAILDB}/search.php?f=${letter}`)
      const list = (j.drinks || []).filter(keepDrink)
      for (const d of list) byId.set(d.idDrink, d)
      await sleep(500)
    } catch (e) {
      console.error(`  CocktailDB ${letter} falhou: ${e.message}`)
    }
  }
  return [...byId.values()]
}

/* ------------------------------ Build records ---------------------------- */
async function buildMeal(meal, idx) {
  const rawSteps = splitSteps(meal.strInstructions)
  const rawIngredients = parseIngredients(meal)
  if (!rawSteps.length || !rawIngredients.length) return null

  const titleEn = cleanText(meal.strMeal)
  const [title] = await Promise.all([translate(titleEn)])
  const excerpt = await translate(rawSteps[0].slice(0, 220))
  const cuisineEn = cleanText(meal.strArea)
  const cuisine = cuisineEn ? await translate(cuisineEn) : ''

  const [catSlug, catName, icon, color] = categoryFor(meal.strCategory)
  const tagWords = cleanText(meal.strTags).split(',').map(s => s.trim()).filter(Boolean)
  const tags = []
  if (cuisineEn) tags.push(cuisineEn)
  if (catName) tags.push(catName)
  tags.push(...tagWords)
  const translatedTags = (await translateLines([...new Set(tags)])).slice(0, 10)

  const ingNames = rawIngredients.map(i => i.name)
  const translatedIngs = await translateLines(ingNames)
  const translatedSteps = await translateLines(rawSteps)
  const servings = parseServings(meal.strYields, false)
  const slug = slugify(title)
  const desc = `Receita clássica de ${catName.toLowerCase()}${cuisine ? `, inspirada na culinária ${cuisine}` : ''}. ${excerpt} Fonte original: TheMealDB (CC-BY-NC).`

  return {
    source: 'themealdb',
    source_id: String(meal.idMeal),
    source_url: `https://www.themealdb.com/meal/${meal.idMeal}`,
    title,
    slug,
    excerpt,
    description: desc,
    ingredients: rawIngredients.map((ing, i) => ({
      name: translatedIngs[i] || ing.name,
      amount: ing.amount,
      unit: translateUnit(ing.unit),
      optional: false,
    })),
    steps: translatedSteps.map((s) => ({ description: s })),
    prep_time_minutes: Math.min(180, Math.max(5, Math.ceil(rawSteps.length * 2.5))),
    cook_time_minutes: null,
    servings,
    difficulty: estimateDifficulty(rawSteps.length, rawIngredients.length),
    cover_image: cleanText(meal.strMealThumb),
    category_slug: catSlug,
    category_name: catName,
    icon,
    color,
    tags: translatedTags,
    cuisine,
    meta: {
      cuisine,
      source: 'TheMealDB',
      source_url: `https://www.themealdb.com/meal/${meal.idMeal}`,
    },
  }
}

async function buildDrink(drink, idx) {
  const rawSteps = splitSteps(drink.strInstructions)
  const rawIngredients = parseIngredients(drink)
  if (!rawSteps.length || !rawIngredients.length) return null

  const titleEn = cleanText(drink.strDrink)
  const [title] = await Promise.all([translate(titleEn)])
  const excerpt = await translate(rawSteps[0].slice(0, 200))
  const glass = cleanText(drink.strGlass)

  const [catSlug, catName] = categoryFor(drink.strCategory)
  const coffeeBase = /coffee|cappuccino|espresso|mocha|latte|cafe|carajillo/i.test((titleEn + ' ' + rawIngredients.map(i => i.name).join(' ')))
  const finalCat = coffeeBase && catSlug === 'bebidas' ? 'cafe' : catSlug

  const ingNames = rawIngredients.map(i => i.name)
  const translatedIngs = await translateLines(ingNames)
  const translatedSteps = await translateLines(rawSteps)
  const servings = 1
  const slug = slugify(title)
  const desc = `${excerpt}${glass ? ` Servido em copo ${(await translate(glass)).toLowerCase()}.` : ''} Fonte original: TheCocktailDB (CC-BY-NC).`

  const drinkTags = ['bebida']
  if (coffeeBase) drinkTags.push('café')
  if (String(drink.strAlcoholic || '') === 'Non alcoholic') drinkTags.push('sem álcool')

  return {
    source: 'thecocktaildb',
    source_id: String(drink.idDrink),
    source_url: `https://www.thecocktaildb.com/drink/${drink.idDrink}`,
    title,
    slug,
    excerpt,
    description: desc,
    ingredients: rawIngredients.map((ing, i) => ({
      name: translatedIngs[i] || ing.name,
      amount: ing.amount,
      unit: translateUnit(ing.unit),
      optional: false,
    })),
    steps: translatedSteps.map((s) => ({ description: s })),
    prep_time_minutes: Math.min(60, Math.max(2, Math.ceil(rawSteps.length * 1.5))),
    cook_time_minutes: null,
    servings,
    difficulty: estimateDifficulty(rawSteps.length, rawIngredients.length),
    cover_image: cleanText(drink.strDrinkThumb),
    category_slug: finalCat,
    category_name: finalCat === 'cafe' ? 'Café' : catName,
    icon: finalCat === 'cafe' ? '☕' : '🥤',
    color: finalCat === 'cafe' ? '#8B5A2B' : '#0EA5E9',
    tags: [...new Set(drinkTags)].slice(0, 5),
    cuisine: '',
    meta: {
      cuisine: '',
      source: 'TheCocktailDB',
      source_url: `https://www.thecocktaildb.com/drink/${drink.idDrink}`,
    },
  }
}


/* --------------------------------- Main --------------------------------- */
async function main() {
  console.log('==> Buscando comidas no TheMealDB...')
  const meals = await fetchMealDB()
  console.log(`    ${meals.length} refeições encontradas.`)

  console.log('==> Buscando bebidas no TheCocktailDB...')
  const drinks = await fetchCocktailDB()
  console.log(`    ${drinks.length} bebidas relevantes encontradas.`)

  const mealPool = shuffle(meals).slice(0, MAX_MEALS)
  const drinkPool = shuffle(drinks).slice(0, MAX_DRINKS)
  console.log(`==> Traduzindo ${mealPool.length} comidas + ${drinkPool.length} bebidas para pt-BR...`)

  const results = []
  const jobs = [...mealPool.map(m => ({ type: 'meal', item: m })), ...drinkPool.map(d => ({ type: 'drink', item: d }))]
  let done = 0
  const pool = 6
  for (let i = 0; i < jobs.length; i += pool) {
    const batch = jobs.slice(i, i + pool)
    const out = await Promise.all(batch.map(({ type, item }, bi) =>
      type === 'meal' ? buildMeal(item, i + bi) : buildDrink(item, i + bi)
    ))
    for (const r of out) if (r) results.push(r)
    done += batch.length
    if (done % 30 === 0 || done === jobs.length) console.log(`    ${done}/${jobs.length} processados (${results.length} válidos)`)
  }

  const categories = {}
  for (const r of results) {
    const key = r.category_slug
    if (!categories[key]) categories[key] = { name: r.category_name, slug: key, icon: r.icon, color: r.color, order: CAT_ORDER[key] ?? 99 }
  }

  const slugCount = new Map()
  for (const r of results) {
    const base = r.slug
    const n = slugCount.get(base) || 0
    if (n > 0) r.slug = `${base}-${n + 1}`
    slugCount.set(base, n + 1)
  }

  const payload = {
    generated_at: new Date().toISOString(),
    source: 'TheMealDB + TheCocktailDB (CC-BY-NC)',
    attribution: 'Receitas adaptadas do acervo TheMealDB/TheCocktailDB — licença CC-BY-NC.',
    categories: Object.values(categories),
    recipes: results,
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8')
  console.log(`\n✅ ${results.length} receitas gravadas em ${OUT_FILE}`)
  console.log(`   Categorias: ${Object.keys(categories).join(', ')}`)
  const byCat = {}
  for (const r of results) byCat[r.category_slug] = (byCat[r.category_slug] || 0) + 1
  console.log(`   Por categoria: ${JSON.stringify(byCat)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
