/**
 * Fonte única de dados da Loja Artigo com Café (máximo 20 produtos).
 * Usada por /loja, /loja/[slug], /loja/checkout e /loja/confirmacao.
 *
 * Os três pilares (docs/apoio.md):
 *   ☕ dropshipping  — produtos selecionados de parceiros (8)
 *   👕 pod           — produtos com a identidade Artigo com Café, sob demanda (8)
 *   🎁 combo         — kits especiais combinando os dois (4)
 */

export type ProductCategory = 'cafe-preparo' | 'artigo-com-cafe' | 'selecao-especial'
export type ProductType = 'dropshipping' | 'pod' | 'combo'
export type StockStatus = 'in' | 'low' | 'out'

export interface Product {
  slug: string
  name: string
  description: string
  /** Parágrafos da descrição longa (página SEO) */
  longDescription: string[]
  price: number
  originalPrice?: number
  image: string
  category: ProductCategory
  type: ProductType
  badge?: string
  specs: string[]
  benefits: string[]
  faq: { q: string; a: string }[]
  /** Emoji usado no placeholder de imagem (SVG gerado) */
  emoji: string
  /** Tempo estimado de produção/entrega exibido na página */
  deliveryNote?: string
  stock: StockStatus
}

export const products: Product[] = [
  // ── ☕ CAFÉ & PREPARO — Dropshipping (8) ────────────────────────────
  {
    slug: 'v60-dripper',
    name: 'V60 Dripper Cerâmica',
    description: 'O clássico método de preparo pour-over. Design icônico para extração limpa e controlada.',
    longDescription: [
      'O V60 é o porta-filtro cônico que se tornou referência mundial no preparo pour-over. A geometria em espiral interna guia a água até o centro do café, garantindo extração uniforme e uma xícara limpa, com doçura e acidez equilibradas.',
      'Feito em cerâmica de alta densidade, ele retém calor durante toda a extração — um detalhe essencial para manter a temperatura da água estável do começo ao fim. Acompanha medidor e 40 filtros para você começar a usar no mesmo dia.',
      'Ideal para quem está migrando do coado tradicional para o preparo manual e quer controle total sobre cada variável: moagem, temperatura e tempo de extração.',
    ],
    price: 89.9,
    originalPrice: 119.9,
    image: '/images/products/v60-dripper.svg',
    category: 'cafe-preparo',
    type: 'dropshipping',
    badge: 'Mais vendido',
    emoji: '⚗️',
    specs: ['Capacidade: 1-2 xícaras', 'Material: Cerâmica', 'Cor: Branco/Vermelho', 'Inclui: Medidor + 40 filtros'],
    benefits: [
      'Extração uniforme com a espiral interna que guia o fluxo de água',
      'Cerâmica retém calor: temperatura estável durante todo o preparo',
      'Kit completo: medidor e 40 filtros inclusos para começar hoje',
    ],
    faq: [
      { q: 'Preciso de uma chaleira de bico fino para usar?', a: 'Não é obrigatório, mas o bico fino facilita o controle do fluxo. Uma chaleira comum também funciona com um pouco mais de prática.' },
      { q: 'Serve para quantas xícaras?', a: 'A capacidade é de 1 a 2 xícaras (até 400ml). Para volumes maiores, recomendamos o modelo 02 ou preparos em sequência.' },
    ],
    deliveryNote: 'Envio em até 3 dias úteis',
    stock: 'in',
  },
  {
    slug: 'prensa-francesa',
    name: 'Prensa Francesa Inox 350ml',
    description: 'Corpo completo, sabor intenso. Parede dupla mantém o café quente por mais tempo.',
    longDescription: [
      'A prensa francesa é um dos métodos mais democráticos do café: sem filtro de papel, o corpo do grão permanece na bebida, resultando em uma xícara encorpada, com óleos naturais e aroma intenso.',
      'Este modelo em aço inox 304 tem parede dupla isolante, que mantém a temperatura por muito mais tempo que as versões de vidro — perfeito para leituras longas e conversas demoradas.',
      'O filtro de malha fina em três camadas segura os resíduos com eficiência, e a estrutura em inox é resistente a quedas e à lavagem diária.',
    ],
    price: 129.9,
    originalPrice: 169.9,
    image: '/images/products/prensa-francesa.svg',
    category: 'cafe-preparo',
    type: 'dropshipping',
    badge: 'Premium',
    emoji: '☕',
    specs: ['Capacidade: 350ml', 'Material: Aço inoxidável 304', 'Parede dupla isolante', 'Filtro de malha fina'],
    benefits: [
      'Parede dupla: café quente por até 2 horas',
      'Inox 304 resistente a quedas e ao uso diário',
      'Preparo simples em 4 minutos, sem filtro de papel',
    ],
    faq: [
      { q: 'O café fica com borra?', a: 'O filtro de malha tripla retém a grande maioria dos resíduos. Se preferir uma xícara mais limpa, use uma moagem mais grossa.' },
      { q: 'Posso esquentar leite ou chá nela?', a: 'Sim, o inox suporta aquecimento direto em fogão e indução. Evite apenas micro-ondas com tampa fechada.' },
    ],
    deliveryNote: 'Envio em até 3 dias úteis',
    stock: 'in',
  },
  {
    slug: 'moedor-manual',
    name: 'Moedor Manual de Cerâmica',
    description: 'Moagem consistente para qualquer método. Ajustável do espresso ao cold brew.',
    longDescription: [
      'Moer na hora é o maior salto de qualidade que um amante de café pode dar: o aroma e os óleos essenciais do grão evaporam minutos após a moagem. Este moedor manual coloca esse ritual ao alcance de todos.',
      'O rebolo cônico de cerâmica produz partículas uniformes — essencial para extrações equilibradas — e o ajuste em mais de 15 níveis cobre do espresso ao cold brew.',
      'Compacto e leve, ele é o companheiro ideal para viagens, escritório ou para quem prepara apenas uma ou duas xícaras por dia sem abrir mão do frescor.',
    ],
    price: 159.9,
    originalPrice: 199.9,
    image: '/images/products/moedor-manual.svg',
    category: 'cafe-preparo',
    type: 'dropshipping',
    emoji: '🫘',
    specs: ['Rebolo: Cerâmica cônica', 'Ajuste: 15+ níveis', 'Capacidade: 30g', 'Portátil e durável'],
    benefits: [
      'Rebolo de cerâmica: sem aquecer o café durante a moagem',
      '15+ níveis de ajuste, do espresso ao cold brew',
      'Leve e compacto para levar em qualquer lugar',
    ],
    faq: [
      { q: 'Quanto tempo leva para moer 20g?', a: 'Entre 40 e 60 segundos, dependendo do nível de moagem. É um ritual rápido que recompensa com aroma muito superior ao café já moído.' },
      { q: 'Preciso de manutenção?', a: 'Apenas limpeza com pincel seco após o uso. O rebolo de cerâmica dispensa afiação por muitos anos.' },
    ],
    deliveryNote: 'Envio em até 3 dias úteis',
    stock: 'in',
  },
  {
    slug: 'balanca-precisao',
    name: 'Balança de Precisão 0.1g',
    description: 'Timer integrado, recarregável via USB. Essencial para receitas consistentes.',
    longDescription: [
      'A balança é o instrumento que transforma um bom café em um café replicável. Com precisão de 0,1g, ela permite controlar a proporção café/água — o fator número um de consistência no preparo manual.',
      'O timer integrado dispensa a necessidade de cronômetro separado: inicie a extração e acompanhe o tempo na própria tela, com modos de pesagem simples e de café (com timer embutido).',
      'Recarregável via USB-C, com bateria para semanas de uso e desligamento automático para economizar energia quando você esquece de desligá-la.',
    ],
    price: 119.9,
    image: '/images/products/balanca-precisao.svg',
    category: 'cafe-preparo',
    type: 'dropshipping',
    emoji: '⚖️',
    specs: ['Precisão: 0.1g', 'Capacidade: 2kg', 'Timer embutido', 'USB-C recarregável', 'Auto-desligamento'],
    benefits: [
      'Precisão de 0,1g para proporções exatas e consistentes',
      'Timer integrado: pese e cronometre em um só aparelho',
      'Bateria recarregável via USB-C, sem pilhas',
    ],
    faq: [
      { q: 'A proporção recomendada é qual?', a: 'Para métodos filtrados, comece em 1:16 (café:água) e ajuste ao paladar. A balança torna esse ajuste preciso e repetível.' },
      { q: 'Funciona para cozinhar também?', a: 'Sim, a capacidade de 2kg cobre a maioria das receitas de padaria e confeitaria.' },
    ],
    deliveryNote: 'Envio em até 3 dias úteis',
    stock: 'in',
  },
  {
    slug: 'chaleira-ganso',
    name: 'Chaleira Bico de Ganso 600ml',
    description: 'Controle total do fluxo. Design ergonômico para pour-over perfeito.',
    longDescription: [
      'O bico de ganso é o segredo do pour-over profissional: o fluxo fino e constante permite molhar o café em círculos precisos, sem jatos fortes que desestabilizam o leito de extração.',
      'Com 600ml e corpo em inox 304, esta chaleira é compatível com fogão a gás e indução, aquecendo de forma rápida e uniforme. A alça ergonômica permanece fria durante o uso.',
      'O design equilibrado com tampa articulada facilita servir com uma mão só — um detalhe que faz diferença nas manhãs em que você está segurando o livro na outra mão.',
    ],
    price: 189.9,
    originalPrice: 239.9,
    image: '/images/products/chaleira-ganso.svg',
    category: 'cafe-preparo',
    type: 'dropshipping',
    badge: 'Design',
    emoji: '🫖',
    specs: ['Capacidade: 600ml', 'Material: Inox 304', 'Bico de precisão', 'Compatível: Fogão/Indução'],
    benefits: [
      'Bico de ganso: fluxo fino para extração uniforme',
      'Inox 304 com compatibilidade gás + indução',
      'Alça fria ergonômica, tampa articulada',
    ],
    faq: [
      { q: 'Consigo medir a temperatura da água?', a: 'Esta versão não tem termômetro. Para maior controle, use um termômetro de cozinha — a faixa ideal de pour-over é 90-96°C.' },
      { q: 'Serve para outros usos?', a: 'Sim: chás, água para chimarrão, molhos e até arranjos florais. O bico fino também é ótimo para regar plantas.' },
    ],
    deliveryNote: 'Envio em até 3 dias úteis',
    stock: 'in',
  },
  {
    slug: 'filtros-v60-100',
    name: 'Filtros V60 Brancos (100 un)',
    description: 'Papel de alta qualidade, sem gosto de papel. Branqueados sem cloro.',
    longDescription: [
      'O filtro é o coadjuvante silencioso de um bom café: um papel de qualidade retém os sólidos indesejados sem adicionar sabor. Estes filtros V60 são branqueados com oxigênio, não com cloro — o que elimina aquele gosto de papel na primeira xícara.',
      'Produzidos com fibras longas que mantêm a estrutura durante a extração, eles escorrem na velocidade ideal para o V60, sem entupir nem acelerar demais o fluxo.',
      'O pacote com 100 unidades acompanha o seu ritual por meses. Compatíveis com V60 01 e 02 (1-2 xícaras).',
    ],
    price: 24.9,
    image: '/images/products/filtros-v60.svg',
    category: 'cafe-preparo',
    type: 'dropshipping',
    emoji: '🍃',
    specs: ['Quantidade: 100 unidades', 'Tamanho: 02 (1-2 xícaras)', 'Branqueamento: Oxigênio', 'Biodegradável'],
    benefits: [
      'Branqueados com oxigênio: zero gosto de papel',
      'Fibras longas: fluxo estável do começo ao fim',
      '100% biodegradáveis e compostáveis',
    ],
    faq: [
      { q: 'Preciso lavar o filtro antes?', a: 'Uma rápida passada de água quente ajuda a assentar o papel e pré-aquecer o porta-filtro. Não é obrigatório, mas recomendado.' },
      { q: 'Serve para outros métodos?', a: 'São desenhados especificamente para o formato cônico do V60. Para outros métodos, use o filtro do formato correspondente.' },
    ],
    deliveryNote: 'Envio em até 3 dias úteis',
    stock: 'in',
  },
  {
    slug: 'cafe-especial-250g',
    name: 'Café Especial 250g - Microlote',
    description: 'Notas de chocolate, caramelo e frutas amarelas. Torra média, 86+ pontos SCA.',
    longDescription: [
      'Um microlote do Cerrado Mineiro com 86+ pontos na escala SCA — a classificação oficial de cafés especiais. Colhido no ponto ideal e processado de forma natural, ele entrega notas de chocolate, caramelo e frutas amarelas.',
      'A torra média preserva a acidez equilibrada e a doçura característica da região, com corpo aveludado e finalização limpa. Ideal tanto para métodos filtrados quanto para espresso.',
      'Cada lote é pequeno e numerado, com data de torra impressa na embalagem — garantia de que você recebe um café fresco, moído por você mesmo na hora do preparo.',
    ],
    price: 49.9,
    image: '/images/products/cafe-especial.svg',
    category: 'cafe-preparo',
    type: 'dropshipping',
    badge: 'Edição limitada',
    emoji: '🫘',
    specs: ['Peso: 250g', 'Variedade: Arábica', 'Processo: Natural', 'Torra: Média', 'Origem: Cerrado Mineiro'],
    benefits: [
      '86+ pontos SCA: café especial certificado',
      'Notas de chocolate, caramelo e frutas amarelas',
      'Microlote numerado com data de torra',
    ],
    faq: [
      { q: 'O café vem inteiro ou moído?', a: 'Vem em grãos inteiros para preservar o frescor. Se preferir moído, escolha essa opção no carrinho e informe o método de preparo.' },
      { q: 'Por quanto tempo dura depois de aberto?', a: 'Em pote hermético, longe de luz e calor, ele mantém a qualidade por até 30 dias após a torra.' },
    ],
    deliveryNote: 'Torrado e enviado em até 5 dias úteis',
    stock: 'low',
  },
  {
    slug: 'kit-iniciante',
    name: 'Kit Iniciante: V60 + Balança + Filtros',
    description: 'Tudo para começar no pour-over. Economia de 15% vs. itens separados.',
    longDescription: [
      'Começar no café especial pode parecer intimidador, mas basta o essencial: um bom porta-filtro, uma balança de precisão e filtros de qualidade. Este kit reúne exatamente isso, com 15% de economia.',
      'Inclui o V60 de cerâmica, a balança com timer integrado e 100 filtros — o trio que cobre 90% das necessidades de quem está montando seu primeiro setup de pour-over.',
      'Acompanha um guia digital com o passo a passo: proporção, moagem, temperatura e técnica de extração para você evoluir com consistência desde a primeira xícara.',
    ],
    price: 199.9,
    originalPrice: 234.7,
    image: '/images/products/kit-iniciante.svg',
    category: 'cafe-preparo',
    type: 'dropshipping',
    badge: 'Kit completo',
    emoji: '🧰',
    specs: ['Inclui: V60 + Balança + 100 filtros', 'Economia: 15%', 'Pronto para usar', 'Guia digital incluso'],
    benefits: [
      '15% de economia em relação aos itens separados',
      'Tudo o que você precisa para o primeiro pour-over',
      'Guia digital de métodos incluso',
    ],
    faq: [
      { q: 'O que mais preciso comprar?', a: 'Apenas o café em grãos e um moedor. Se ainda não tem moedor, ele é o próximo upgrade recomendado após este kit.' },
      { q: 'O guia digital é enviado como?', a: 'Um link de acesso é enviado por e-mail após a confirmação do pedido, com vídeos e texto.' },
    ],
    deliveryNote: 'Envio em até 3 dias úteis',
    stock: 'in',
  },

  // ── 👕 ARTIGO COM CAFÉ — POD (8) ──────────────────────────────────
  {
    slug: 'camiseta-logo-preta',
    name: 'Camiseta Logo Preta',
    description: 'Algodão orgânico premium. Logo minimalista no peito. Conforto para longas leituras.',
    longDescription: [
      'A camiseta que carrega a identidade do Artigo com Café: logo minimalista bordado no peito, algodão orgânico e corte que acompanha o corpo sem apertar.',
      'Produzida sob demanda com 100% algodão orgânico de 180g/m², ela tem a espessura ideal — estruturada sem ser pesada, perfeita para usar em casa, no trabalho ou na cafeteria.',
      'Cada peça é produzida apenas quando você compra, reduzindo desperdício. A estampa em serigrafia à base d’água é macia ao toque e não trinca com lavagens.',
    ],
    price: 89.9,
    image: '/images/products/camiseta-logo-preta.svg',
    category: 'artigo-com-cafe',
    type: 'pod',
    emoji: '👕',
    specs: ['100% Algodão orgânico', 'Gramatura: 180g/m²', 'Corte: Regular', 'Tamanhos: PP a GG', 'Estampa: Serigrafia base d\'água'],
    benefits: [
      'Algodão orgânico 180g/m²: conforto e durabilidade',
      'Produzida sob demanda, apenas quando você compra',
      'Logo minimalista que conversa com quem lê',
    ],
    faq: [
      { q: 'Como escolho o tamanho?', a: 'Consulte a tabela na página: o corte é regular. Em dúvida entre dois tamanhos, escolha o maior — o algodão encolhe levemente na primeira lavagem.' },
      { q: 'Qual o prazo de produção?', a: 'Por ser sob demanda, a produção leva de 3 a 7 dias úteis, somados ao envio.' },
    ],
    deliveryNote: 'Produção sob demanda: 3 a 7 dias úteis + envio',
    stock: 'in',
  },
  {
    slug: 'camiseta-logo-branca',
    name: 'Camiseta Logo Branca',
    description: 'Versão clara da camiseta icônica. Versátil para qualquer ocasião.',
    longDescription: [
      'A mesma camiseta icônica em versão clara: fundo branco, logo em tom marrom e a mesma modelagem confortável de algodão orgânico.',
      'A versão branca é a escolha mais versátil do guarda-roupa — combina com qualquer look e funciona tanto para o home office quanto para um passeio no fim de semana.',
      'Produzida sob demanda com o mesmo algodão orgânico de 180g/m² e serigrafia à base d’água, sem produtos químicos agressivos.',
    ],
    price: 89.9,
    image: '/images/products/camiseta-logo-branca.svg',
    category: 'artigo-com-cafe',
    type: 'pod',
    emoji: '👕',
    specs: ['100% Algodão orgânico', 'Gramatura: 180g/m²', 'Corte: Regular', 'Tamanhos: PP a GG', 'Estampa: Serigrafia base d\'água'],
    benefits: [
      'Versátil: combina com qualquer ocasião',
      'Algodão orgânico certificado',
      'Estampa à base d’água que não trinca',
    ],
    faq: [
      { q: 'A estampa sai com lavagens?', a: 'A serigrafia à base d’água é lavável. Lave do avesso e evite secadora em temperatura alta.' },
      { q: 'Tenho troca de tamanho?', a: 'Sim — dentro de 30 dias, desde que a peça não tenha sido usada. Consulte nossa política de trocas.' },
    ],
    deliveryNote: 'Produção sob demanda: 3 a 7 dias úteis + envio',
    stock: 'in',
  },
  {
    slug: 'caneca-ceramica',
    name: 'Caneca Cerâmica 300ml',
    description: 'Formato ergonômico, parede grossa mantém a temperatura. Logo discreto na base.',
    longDescription: [
      'A caneca perfeita para longas leituras: parede grossa que mantém o café quente, formato que se encaixa confortavelmente nas mãos e logo discreto na base — um detalhe para quem olha de perto.',
      'Em cerâmica premium com acabamento fosco, está disponível em preto e creme. A base larga evita tombamentos na mesa de trabalho e o interior liso facilita a limpeza.',
      'Apto para micro-ondas e lava-louças: use no dia a dia sem cerimônia, porque é para isso que ela existe.',
    ],
    price: 59.9,
    image: '/images/products/caneca-ceramica.svg',
    category: 'artigo-com-cafe',
    type: 'pod',
    emoji: '☕',
    specs: ['Capacidade: 300ml', 'Material: Cerâmica premium', 'Apto: Micro-ondas/Lava-louças', 'Cor: Preto fosco/Crema'],
    benefits: [
      'Parede grossa: café quente por mais tempo',
      'Logo discreto na base, para quem repara nos detalhes',
      'Apta para micro-ondas e lava-louças',
    ],
    faq: [
      { q: 'A caneca pode ir ao forno?', a: 'Não recomendamos: o esmalte pode trincar com calor seco intenso. Micro-ondas e lava-louças estão liberados.' },
      { q: 'Qual a diferença entre as cores?', a: 'Apenas o acabamento externo. Ambas têm o mesmo formato e o logo na base.' },
    ],
    deliveryNote: 'Produção sob demanda: 3 a 7 dias úteis + envio',
    stock: 'in',
  },
  {
    slug: 'moletom-conforto',
    name: 'Moletom Conforto Cinza',
    description: 'Fleece interno macio. Ideal para manhãs frias de leitura. Logo bordado no peito.',
    longDescription: [
      'O companheiro das manhãs frias de leitura: fleece interno macio, corte oversized e logo bordado no peito. É o tipo de peça que você veste e não quer mais tirar.',
      'Com 320g/m² e mistura de 80% algodão com 20% poliéster, ele aquece sem pesar e mantém a forma lavagem após lavagem. O capuz com cordão e os bolsos canguru completam o conforto.',
      'O logo é bordado — não estampado — o que garante acabamento premium e durabilidade muito maior.',
    ],
    price: 179.9,
    originalPrice: 219.9,
    image: '/images/products/moletom-conforto.svg',
    category: 'artigo-com-cafe',
    type: 'pod',
    badge: 'Conforto',
    emoji: '🧥',
    specs: ['80% Algodão / 20% Poliéster', 'Gramatura: 320g/m²', 'Fleece interno', 'Corte: Oversized', 'Logo: Bordado'],
    benefits: [
      'Fleece interno macio para dias frios',
      'Corte oversized: conforto sem perder o estilo',
      'Logo bordado: acabamento que dura',
    ],
    faq: [
      { q: 'O modelo veste grande?', a: 'Sim, o corte é oversized por design. Se prefere um caimento mais ajustado, escolha um tamanho abaixo do usual.' },
      { q: 'É adequado para presente?', a: 'É um dos produtos mais escolhidos para presentear — combine com a caneca e o café especial no kit presente.' },
    ],
    deliveryNote: 'Produção sob demanda: 3 a 7 dias úteis + envio',
    stock: 'in',
  },
  {
    slug: 'bone-dad-hat',
    name: 'Boné Dad Hat Preto',
    description: 'Aba curva, fecho metálico ajustável. Logo frontal pequeno. Estilo casual.',
    longDescription: [
      'O boné dad hat que virou item de colecionador do projeto: aba curva, coroa estruturada e logo pequeno bordado na frente. Um acessório casual que conversa com a estética do site.',
      'Feito em algodão twill de alta densidade, com fecho metálico ajustável que se adapta a qualquer tamanho. O bordado discreto na cor do tecido dá um toque sofisticado.',
      'Produzido sob demanda, cada unidade é costurada e bordada individualmente para o seu pedido.',
    ],
    price: 69.9,
    image: '/images/products/bone-dad-hat.svg',
    category: 'artigo-com-cafe',
    type: 'pod',
    emoji: '🧢',
    specs: ['100% Algodão twill', 'Fecho: Metálico ajustável', 'Aba: Curva', 'Tamanho único', 'Logo: Bordado'],
    benefits: [
      'Algodão twill de alta densidade e durabilidade',
      'Fecho metálico ajustável para qualquer cabeça',
      'Bordado discreto e elegante',
    ],
    faq: [
      { q: 'Ajusta em cabeças grandes?', a: 'O fecho metálico permite um ajuste amplo, do tamanho infantil ao GG. Se tiver dúvidas, meça o perímetro da cabeça.' },
      { q: 'Posso lavar na máquina?', a: 'Recomendamos lavagem à mão ou no ciclo delicado, para preservar a estrutura da aba.' },
    ],
    deliveryNote: 'Produção sob demanda: 3 a 7 dias úteis + envio',
    stock: 'in',
  },
  {
    slug: 'ecobag-algodao',
    name: 'Ecobag Algodão Cru',
    description: 'Resistente, espaçosa. Para levar livros, laptop e compras do mercado.',
    longDescription: [
      'A ecobag que acompanha seus livros: algodão cru resistente, alças reforçadas de 60cm e capacidade para cerca de 10kg. Cabe um laptop, dois livros e uma garrafa de café sem esforço.',
      'A estampa em serigrafia à base d’água estampa a frase “Leia. Pause. Café.” na lateral — um lembrete constante do ritual que o Artigo com Café celebra.',
      'Produzida sob demanda, ela substitui sacolas descartáveis em feiras, livrarias e supermercados, e ainda apoia o projeto a cada uso.',
    ],
    price: 44.9,
    image: '/images/products/ecobag-algodao.svg',
    category: 'artigo-com-cafe',
    type: 'pod',
    emoji: '👜',
    specs: ['100% Algodão cru', 'Dimensões: 38x42cm', 'Alças: Reforçadas 60cm', 'Capacidade: ~10kg', 'Estampa: Serigrafia'],
    benefits: [
      'Capacidade para ~10kg: livros, laptop e compras',
      'Alças reforçadas de 60cm, confortáveis no ombro',
      'Substitui sacolas descartáveis e apoia o projeto',
    ],
    faq: [
      { q: 'Cabe um notebook de 15"?', a: 'Sim, o formato 38x42cm acomoda notebooks de até 16" com folga.' },
      { q: 'Lava fácil?', a: 'Sim, pode ir à máquina no ciclo delicado. O algodão cru ganha maciez a cada lavagem.' },
    ],
    deliveryNote: 'Produção sob demanda: 3 a 7 dias úteis + envio',
    stock: 'in',
  },
  {
    slug: 'poster-cafe-manha',
    name: 'Poster "Ritual da Manhã" A3',
    description: 'Ilustração autoral. Papel premium mate. Emoldure e decore seu cantinho de café.',
    longDescription: [
      '“Ritual da Manhã” é uma ilustração autoral criada para o Artigo com Café: uma xícara fumegante em traços contínuos sobre fundo creme, com a paleta da marca.',
      'Impresso em papel couché fosco de 250g, com cores ricas e acabamento que não reflete luz — perfeito para emoldurar e decorar o cantinho de leitura ou a cozinha.',
      'Acompanha assinatura digital do artista no canto inferior e vem sem moldura, em embalagem rígida para não amassar no transporte.',
    ],
    price: 39.9,
    image: '/images/products/poster-cafe-manha.svg',
    category: 'artigo-com-cafe',
    type: 'pod',
    emoji: '🖼️',
    specs: ['Tamanho: A3 (29,7x42cm)', 'Papel: Couché fosco 250g', 'Impressão: Offset', 'Sem moldura', 'Assinatura digital do artista'],
    benefits: [
      'Ilustração autoral exclusiva do projeto',
      'Papel couché fosco 250g com cores ricas',
      'Embalagem rígida: chega sem amassados',
    ],
    faq: [
      { q: 'Qual tamanho de moldura usar?', a: 'O pôster é A3 (29,7x42cm). Molduras padrão A3 encontradas em qualquer papelaria servem perfeitamente.' },
      { q: 'É numerado?', a: 'A edição é limitada e numerada a lápis no verso — cada exemplar é único.' },
    ],
    deliveryNote: 'Produção sob demanda: 3 a 7 dias úteis + envio',
    stock: 'in',
  },
  {
    slug: 'caderno-pontos',
    name: 'Caderno Pontos 160 pág',
    description: 'Papel 90g/m², abertura 180°. Para anotações, bullet journal, sketches.',
    longDescription: [
      'O caderno de quem escreve de verdade: papel marfim de 90g/m² que aceita caneta-tinteiro sem vazar, pontos que guiam a escrita sem atrapalhar e abertura de 180° que permite escrever até a borda.',
      'Capa dura de 300g, elástico de fechamento, marcador de página e bolso interno — os detalhes que fazem um caderno durar anos e virar companheiro de rotina.',
      'O formato A5 cabe em qualquer mochila. Use para anotações de leitura, bullet journal, rascunhos de artigos ou sketches de café.',
    ],
    price: 49.9,
    image: '/images/products/caderno-pontos.svg',
    category: 'artigo-com-cafe',
    type: 'pod',
    emoji: '📓',
    specs: ['Páginas: 160 (80 folhas)', 'Papel: 90g/m² marfim', 'Formato: A5 (14,8x21cm)', 'Capa: Dura 300g', 'Encadernação: Costurada 180°', 'Elástico + Marcador + Bolso'],
    benefits: [
      'Papel 90g/m² que aceita caneta-tinteiro',
      'Abertura 180° para escrever até a borda',
      'Capa dura com elástico, marcador e bolso',
    ],
    faq: [
      { q: 'O papel vaza com caneta-tinteiro?', a: 'O papel marfim de 90g/m² segura a maioria das tintas, incluindo as de caneta-tinteiro comum. Canetas com tinta muito fluida podem marcar levemente o verso.' },
      { q: 'Serve para planner?', a: 'Sim, o padrão de pontos é o favorito de quem monta planner e bullet journal: você desenha suas próprias grades.' },
    ],
    deliveryNote: 'Produção sob demanda: 3 a 7 dias úteis + envio',
    stock: 'in',
  },

  // ── 🎁 SELEÇÃO ESPECIAL — Combinações (4) ─────────────────────────
  {
    slug: 'kit-ritual-manha',
    name: 'Kit Ritual da Manhã',
    description: 'Caneca POD + Café Especial 250g + Filtros V60 (20 un). O combo perfeito para começar o dia.',
    longDescription: [
      'O kit que transforma a primeira xícara do dia em ritual: caneca de cerâmica com a identidade do projeto, café especial em microlote e filtros V60 para preparar do seu jeito.',
      'Pensado para quem quer presentear (ou se presentear) com a experiência completa do Artigo com Café: o objeto, o café e o ritual do preparo em uma única entrega.',
      'Inclui cartão com dicas de preparo e embalagem presenteável — chega pronto para embrulhar ou entregar.',
    ],
    price: 119.9,
    originalPrice: 144.7,
    image: '/images/products/kit-ritual-manha.svg',
    category: 'selecao-especial',
    type: 'combo',
    badge: 'Presente ideal',
    emoji: '🌅',
    specs: ['Inclui: Caneca 300ml + Café 250g + 20 filtros', 'Economia: 17%', 'Embalagem presenteável', 'Cartão com dicas de preparo'],
    benefits: [
      'Economia de 17% versus itens avulsos',
      'A experiência completa: objeto + café + ritual',
      'Embalagem presenteável com cartão de dicas',
    ],
    faq: [
      { q: 'O café é o mesmo da loja?', a: 'Sim, o microlote 86+ pontos SCA, torrado e embalado com data de torra.' },
      { q: 'As peças chegam juntas?', a: 'Sim, o kit é montado e enviado em uma única entrega.' },
    ],
    deliveryNote: 'Montagem + envio em até 7 dias úteis',
    stock: 'in',
  },
  {
    slug: 'kit-leitura-conforto',
    name: 'Kit Leitura & Conforto',
    description: 'Caderno Pontos + Caneca Cerâmica + Ecobag. Para levar seu momento a qualquer lugar.',
    longDescription: [
      'O kit para quem vive cercado de livros: caderno de pontos para anotar tudo, caneca para o intervalo da leitura e ecobag para carregar a pilha da biblioteca.',
      'As cores coordenadas (preto fosco, creme e algodão cru) formam um conjunto coeso que combina entre si e com qualquer ambiente.',
      'Ideal como presente de aniversário, formatura ou simplesmente para agradecer alguém — com embalagem sustentável inclusa.',
    ],
    price: 139.9,
    originalPrice: 174.7,
    image: '/images/products/kit-leitura-conforto.svg',
    category: 'selecao-especial',
    type: 'combo',
    emoji: '📚',
    specs: ['Inclui: Caderno A5 + Caneca 300ml + Ecobag', 'Economia: 20%', 'Cores coordenadas', 'Embalagem sustentável'],
    benefits: [
      'Economia de 20% versus itens avulsos',
      'Três itens que se completam no dia a dia',
      'Cores coordenadas em embalagem sustentável',
    ],
    faq: [
      { q: 'Posso escolher a cor da caneca?', a: 'O kit vem com a caneca na cor creme, que harmoniza com os demais itens. A versão preta pode ser pedida avulsa.' },
      { q: 'Serve como presente corporativo?', a: 'Sim, e é um dos kits mais escolhidos para brindes — entre em contato para condições especiais em volume.' },
    ],
    deliveryNote: 'Montagem + envio em até 7 dias úteis',
    stock: 'in',
  },
  {
    slug: 'kit-barista-iniciante',
    name: 'Kit Barista Iniciante',
    description: 'V60 + Balança + Chaleira Ganso + 100 Filtros. Setup completo pour-over profissional.',
    longDescription: [
      'O setup completo de pour-over: V60 de cerâmica, balança com timer, chaleira de bico de ganso e 100 filtros. Com ele, você tem tudo que um barista usa para extrair um café de especialidade em casa.',
      'É o kit que recomendamos para quem já domina o básico e quer evoluir: controle de fluxo, proporção exata e temperatura — as três variáveis que separam um bom café de um café excepcional.',
      'Inclui guia digital de métodos e 1 ano de garantia nos equipamentos.',
    ],
    price: 479.9,
    originalPrice: 574.6,
    image: '/images/products/kit-barista-iniciante.svg',
    category: 'selecao-especial',
    type: 'combo',
    badge: 'Setup completo',
    emoji: '🧑‍🍳',
    specs: ['Inclui: V60 + Balança + Chaleira 600ml + 100 filtros', 'Economia: 16%', 'Guia digital de métodos', 'Garantia 1 ano'],
    benefits: [
      'Economia de 16% versus itens avulsos',
      'O setup profissional completo em uma entrega',
      'Garantia de 1 ano nos equipamentos',
    ],
    faq: [
      { q: 'Falta algo para começar?', a: 'Apenas o café em grãos e um moedor. A balança, a chaleira e o V60 cobrem todo o resto.' },
      { q: 'A chaleira tem termômetro?', a: 'Não, mas o guia digital ensina a controlar a temperatura sem termômetro.' },
    ],
    deliveryNote: 'Montagem + envio em até 7 dias úteis',
    stock: 'in',
  },
  {
    slug: 'kit-presente-completo',
    name: 'Kit Presente Completo',
    description: 'Camiseta + Caneca + Café Especial + Caderno. A experiência completa Artigo com Café.',
    longDescription: [
      'A experiência completa do Artigo com Café em uma caixa: camiseta, caneca, café especial e caderno — os quatro itens mais representativos do projeto juntos, com 18% de economia.',
      'A caixa premium personalizada com cartão de agradecimento manuscrito torna o presente pronto para entregar, sem necessidade de embrulho extra.',
      'É o kit mais escolhido para datas especiais: Dia dos Namorados, aniversários, fim de ano e agradecimentos a quem fez parte da sua jornada.',
    ],
    price: 269.9,
    originalPrice: 329.6,
    image: '/images/products/kit-presente-completo.svg',
    category: 'selecao-especial',
    type: 'combo',
    badge: 'Best seller',
    emoji: '🎁',
    specs: ['Inclui: Camiseta + Caneca + Café 250g + Caderno A5', 'Economia: 18%', 'Caixa premium personalizada', 'Cartão de agradecimento manuscrito'],
    benefits: [
      'Economia de 18% versus itens avulsos',
      'Os 4 itens mais icônicos do projeto em uma caixa',
      'Cartão de agradecimento manuscrito incluso',
    ],
    faq: [
      { q: 'Posso escolher o tamanho da camiseta?', a: 'Sim, na finalização do pedido você informa o tamanho (PP a GG) e a preferência de cor da caneca.' },
      { q: 'O cartão manuscrito pode ter uma mensagem?', a: 'Sim! Deixe sua mensagem no campo de observações do pedido e nós a escrevemos à mão.' },
    ],
    deliveryNote: 'Montagem + envio em até 7 dias úteis',
    stock: 'in',
  },
]

// ── Categorias ──────────────────────────────────────────────────────
export interface Category {
  id: 'all' | ProductCategory
  label: string
  count: number
  description: string
}

export const categories: Category[] = [
  { id: 'all', label: 'Todos', count: products.length, description: 'Todos os produtos curados da loja.' },
  { id: 'cafe-preparo', label: '☕ Café & Preparo', count: products.filter(p => p.category === 'cafe-preparo').length, description: 'Produtos selecionados de parceiros para elevar seu preparo.' },
  { id: 'artigo-com-cafe', label: '👕 Artigo com Café', count: products.filter(p => p.category === 'artigo-com-cafe').length, description: 'Produtos com a identidade Artigo com Café, feitos sob demanda.' },
  { id: 'selecao-especial', label: '🎁 Seleção Especial', count: products.filter(p => p.category === 'selecao-especial').length, description: 'Kits combinados com desconto — ideais para presentear.' },
]

export const typeLabels: Record<ProductType, string> = {
  dropshipping: 'Produto de parceiro',
  pod: 'Produção sob demanda',
  combo: 'Kit especial',
}

export const typeIcons: Record<ProductType, string> = {
  dropshipping: '📦',
  pod: '🏷️',
  combo: '🎁',
}

export const typeDescriptions: Record<ProductType, string> = {
  dropshipping: 'Enviado diretamente pelo parceiro selecionado. Estoque, separação, embalagem e rastreio são responsabilidade do fornecedor — você acompanha tudo pelo seu pedido no site.',
  pod: 'Produzido individualmente para o seu pedido, com a identidade do Artigo com Café. A produção leva de 3 a 7 dias úteis e o envio é feito pelo parceiro de impressão.',
  combo: 'Kits montados pela nossa curadoria combinando itens de parceiros e produção sob demanda, com desconto e embalagem especial.',
}

export const categoryDescriptions: Record<ProductCategory, string> = {
  'cafe-preparo': 'Produtos selecionados de parceiros para elevar seu preparo.',
  'artigo-com-cafe': 'Produtos com a identidade Artigo com Café, feitos sob demanda.',
  'selecao-especial': 'Kits combinados com desconto — ideais para presentear.',
}

export const categoryLabels: Record<ProductCategory, string> = {
  'cafe-preparo': 'Café & Preparo',
  'artigo-com-cafe': 'Artigo com Café',
  'selecao-especial': 'Seleção Especial',
}

// ── Helpers ─────────────────────────────────────────────────────────
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function discountPct(product: Product): number | null {
  if (!product.originalPrice || product.originalPrice <= product.price) return null
  return Math.round((1 - product.price / product.originalPrice) * 100)
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter(p => p.category === category)
}

/** Relacionados: primeiro da mesma categoria, depois os demais. */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const sameCat = products.filter(p => p.category === product.category && p.slug !== product.slug)
  const others = products.filter(p => p.category !== product.category && p.slug !== product.slug)
  return [...sameCat, ...others].slice(0, limit)
}

/** Frete grátis acima deste valor (usado no carrinho e no checkout). */
export const FREE_SHIPPING_THRESHOLD = 199
export const FLAT_SHIPPING_PRICE = 19.9

export function shippingFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_PRICE
}

/** Estimativa determinística de avaliação (4.6–5.0) por produto. */
export function ratingFor(product: Product): { rating: number; reviews: number } {
  let hash = 0
  for (const ch of product.slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const rating = 4.6 + (hash % 5) / 10 // 4.6 a 5.0
  const reviews = 8 + (hash % 120)
  return { rating, reviews }
}
