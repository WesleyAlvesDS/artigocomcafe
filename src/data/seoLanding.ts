// Conteúdo das páginas SEO de engajamento (evergreen, intenção informacional).
// Cada página tem title/description únicos, seções estruturadas, FAQ (JSON-LD
// FAQPage) e CTAs para /blog e /receitas (interlinking interno para SEO).

export interface SeoSection {
  id: string
  title: string
  body: string // HTML simples, renderizado como prose
}

export interface SeoFaq {
  q: string
  a: string
}

export interface SeoLanding {
  slug: string
  h1: string
  pageTitle: string
  description: string
  intro: string
  sections: SeoSection[]
  faqs: SeoFaq[]
  ctaTitle: string
  ctaText: string
  ctaHref: string
  ctaLabel: string
}

export const seoLandings: SeoLanding[] = [
  {
    slug: 'metodos-de-preparo',
    h1: 'Métodos de Preparo de Café: Guia Completo',
    pageTitle: 'Métodos de Preparo de Café — Guia Completo',
    description: 'Descubra os melhores métodos de preparo de café: coado, prensa francesa, espresso, moka, cold brew e AeroPress. Comparativo, passo a passo e dicas de especialistas.',
    intro: 'O mesmo grão pode render cafés completamente diferentes dependendo do método escolhido. Neste guia, você entende as características de cada preparo, o nível de dificuldade, o tempo necessário e como extrair o melhor de cada grão.',
    sections: [
      {
        id: 'coado',
        title: 'Café Coado (V60 e Chemex)',
        body: '<p>O café coado é o queridinho de quem busca <strong>clareza de sabor e acidez delicada</strong>. No V60, o filtro de papel em formato cônico exige um fluxo de água controlado: despeje em movimentos circulares, do centro para fora, em três etapas (florescimento de 30 segundos com o dobro do peso de água, depois duas adições).</p><p>Na Chemex, o filtro mais grosso retém óleos e sedimentos, resultando em uma xícara limpa e encorpada. Para ambos, use água entre <strong>92°C e 96°C</strong> e proporção de <strong>1:15 a 1:17</strong> (café:água).</p>'
      },
      {
        id: 'prensa-francesa',
        title: 'Prensa Francesa',
        body: '<p>A prensa francesa entrega <strong>corpo e intensidade</strong> com o mínimo de equipamento: basta o aparato, água quente e café de moagem grossa.</p><p>O segredo está no tempo de infusão: <strong>4 minutos</strong> para a maioria dos cafés (3 minutos para torras muito escuras). Moagem grossa evita que o café fique amargo e com borra. Depois de pressionar o êmbolo, sirva imediatamente — o café continua extraindo na borra e fica amargo se ficar descansando.</p>'
      },
      {
        id: 'espresso',
        title: 'Espresso',
        body: '<p>O espresso é a base de cappuccino, latte e macchiato — e uma ciência por si só. A extração ideal acontece com <strong>9 bar de pressão</strong>, água a 92°C e cerca de <strong>25 a 30 segundos</strong> de extração para 30 ml (ou 36 g de bebida).</p><p>A moagem é fina como açúcar de confeiteiro e a dose de 18 g rende a xícara perfeita com um crema dourado e persistente. Se o fluxo sai rápido demais, moa mais fino; se demora, moa mais grosso.</p>'
      },
      {
        id: 'moka',
        title: 'Cafeteira Moka (Italiana)',
        body: '<p>A moka produz um café <strong>forte e aromático</strong>, entre o espresso e o coado. Encha a base com água até a válvula, o cesto com café moído médio sem compactar, e leve ao fogo baixo até o café subir.</p><p>Dica de especialista: retire a cafeteira do fogo <strong>assim que começar a borbulhar</strong> — deixar ferver amarga o café. Use água filtrada e nunca lave com detergente; apenas enxágue com água quente.</p>'
      },
      {
        id: 'cold-brew',
        title: 'Cold Brew',
        body: '<p>O cold brew é feito com <strong>água fria e extração longa</strong> (12 a 18 horas na geladeira), resultando em um café suave, pouco ácido e naturalmente doce.</p><p>Proporção clássica de 1:8 (café:água) com moagem grossa. Depois de coar, o concentrado dura até uma semana na geladeira e pode ser servido puro, com água, leite ou gelo. É a bebida perfeita para os dias quentes — e a base de drinks como o café gelado com leite de amêndoas.</p>'
      },
      {
        id: 'aeropress',
        title: 'AeroPress',
        body: '<p>A AeroPress é a favorita de baristas viajantes: <strong>portátil, rápida e versátil</strong>. Com 2 minutos você tem uma xícara limpa, com pressão leve que extrai aromas sem amargor.</p><p>Receita base: 16 g de café moído médio-fino, 240 ml de água a 90°C, 60 segundos de infusão mexendo suavemente e mais 30 segundos pressionando. Experimente o método invertido (cafeteira de cabeça para baixo) para extrações mais intensas.</p>'
      }
    ],
    faqs: [
      { q: 'Qual é o melhor método de preparo de café?', a: 'Não existe um único "melhor": depende do perfil que você busca. V60 e Chemex entregam clareza e acidez; prensa francesa, corpo e intensidade; espresso, concentração e crema; cold brew, suavidade e baixa acidez. O melhor método é o que combina com o seu paladar e a sua rotina.' },
      { q: 'Qual método de café é mais forte?', a: 'Em concentração, o espresso é o mais forte (cerca de 3 a 4 vezes mais cafeína por volume que o coado). Em sabor intenso, a prensa francesa e a moka também entregam xícaras encorpadas. O cold brew tem mais cafeína total, mas é servido diluído.' },
      { q: 'Qual método é mais fácil para iniciantes?', a: 'A prensa francesa é a mais tolerante a erros: basta moagem grossa, 4 minutos de infusão e coar. A AeroPress também é simples e rápida. Evite começar pelo espresso, que exige moedor, pressão e prática.' },
      { q: 'Qual a proporção ideal de café para água?', a: 'A referência clássica é 1:16 (60 g de café para 1 litro de água). Métodos filtrados funcionam bem entre 1:15 e 1:17. Comece em 1:16 e ajuste ao paladar: mais café = xícara mais forte e encorpada.' },
      { q: 'A moagem influencia o sabor?', a: 'Sim, e muito. Moagem fina extrai mais rápido (espresso, moka); média, para coados (V60) e AeroPress; grossa, para prensa francesa e cold brew. Moagem errada gera café aguado ou amargo, mesmo com grãos excelentes.' }
    ],
    ctaTitle: 'Coloque em prática',
    ctaText: 'Teste os métodos com receitas passo a passo e descubra novos sabores no seu dia a dia.',
    ctaHref: '/receitas/',
    ctaLabel: 'Ver todas as receitas'
  },
  {
    slug: 'tipos-de-graos',
    h1: 'Tipos de Grãos de Café: Arábica vs Robusta',
    pageTitle: 'Tipos de Grãos de Café — Arábica vs Robusta',
    description: 'Arábica ou Robusta? Entenda as diferenças entre os principais tipos de grãos de café, torras e origens, e descubra qual combina com o seu paladar.',
    intro: 'Mais de 100 espécies de café existem no mundo, mas duas dominam o mercado: a Coffea arábica e a Coffea canephora (robusta). Conhecer as diferenças entre elas é o primeiro passo para escolher melhor o seu café — e para entender rótulos e blends.',
    sections: [
      {
        id: 'arabica',
        title: 'Café Arábica: o favorito dos cafés especiais',
        body: '<p>A arábica representa cerca de <strong>60% da produção mundial</strong> e é a base dos cafés especiais. Cultivada em altitudes elevadas (acima de 800 m), ela amadurece mais devagar e desenvolve aromas complexos: notas florais, frutadas, chocolate e caramelo.</p><p>Naturalmente, a arábica tem <strong>menos cafeína (cerca de 1,2%)</strong> e mais açúcares naturais, o que resulta em xícara doce e menos amarga. É mais sensível a pragas e exige mais cuidado no cultivo — o que reflete no preço.</p>'
      },
      {
        id: 'robusta',
        title: 'Café Robusta: força e crema',
        body: '<p>A robusta é resistente, produtiva e cultivada em baixas altitudes. Com <strong>cerca de 2,2% de cafeína</strong> (quase o dobro da arábica), entrega corpo pesado, amargor marcante e notas terrosas.</p><p>É a escolha clássica de blends de espresso italianos: o alto teor de cafeína garante a <strong>crema densa e persistente</strong> e resiste bem ao leite. No Brasil, o conilon (como é chamada a robusta nacional) também é usado em misturas para dar corpo.</p>'
      },
      {
        id: 'torras',
        title: 'Torra clara, média e escura',
        body: '<p>A torra define o destino final dos grãos. <strong>Torra clara</strong> preserva acidez, notas florais e frutadas — ideal para métodos filtrados. <strong>Torra média</strong> equilibra acidez, doçura e corpo, funcionando bem em qualquer método. <strong>Torra escura</strong> traz amargor, notas de chocolate amargo e fumaça, com corpo pesado.</p><p>Regra prática: grãos especiais pedem torra clara ou média; cafés de origem única revelam mais nuances com torra clara; blends para espresso costumam usar torra média-escura.</p>'
      },
      {
        id: 'origens',
        title: 'Principais origens e perfis de sabor',
        body: '<p>Cada região produz grãos com assinatura própria: o <strong>Brasil</strong> entrega corpo doce com notas de chocolate e castanhas; a <strong>Colômbia</strong>, acidez média e caramelo; a <strong>Etiópia</strong>, notas florais e cítricas vibrantes; a <strong>Indonésia</strong>, corpo denso e terroso; a <strong>Costa Rica</strong>, equilíbrio com finalização limpa.</p><p>Explore cafés de origens diferentes para mapear o seu paladar — vale mais que qualquer guia teórico.</p>'
      }
    ],
    faqs: [
      { q: 'Qual é a diferença entre arábica e robusta?', a: 'A arábica tem mais açúcar, menos cafeína e é cultivada em altitude, resultando em xícara doce, ácida e aromática. A robusta tem quase o dobro de cafeína, corpo pesado e amargor marcante, além de ser mais barata e resistente.' },
      { q: 'Café arábica é sempre melhor?', a: 'Não necessariamente. Para consumo puro e cafés especiais, a arábica costuma ganhar em complexidade aromática. Mas a robusta de qualidade é essencial em blends de espresso e agrada quem prefere café forte e encorpado.' },
      { q: 'O que significa café 100% arábica?', a: 'Significa que o produto usa apenas grãos de Coffea arábica, sem mistura de robusta. É um indicativo de qualidade superior em cafés comerciais, embora a origem e a torra influenciem mais o sabor final.' },
      { q: 'Torra escura tem mais cafeína?', a: 'Não. A cafeína é estável ao calor: a diferença entre torras é de sabor, não de cafeína. Torras claras e escuras do mesmo grão têm quantidades praticamente iguais.' },
      { q: 'Como escolher o grão certo para o meu paladar?', a: 'Se você gosta de café doce e perfumado, prefira arábica de origem única com torra clara. Se prefere café forte, encorpado e com crema, busque blends com robusta ou torra escura. Experimente e anote o que gosta.' }
    ],
    ctaTitle: 'Do grão à xícara',
    ctaText: 'Aprofunde seus conhecimentos com artigos do blog e experimente receitas que valorizam cada tipo de grão.',
    ctaHref: '/blog',
    ctaLabel: 'Ler artigos do blog'
  },
  {
    slug: 'como-fazer-cafe',
    h1: 'Como Fazer Café Perfeito em Casa',
    pageTitle: 'Como Fazer Café Perfeito em Casa — Guia Passo a Passo',
    description: 'Aprenda a fazer um café perfeito em casa: moagem, proporção, temperatura da água, tempo de extração e os erros mais comuns — com passo a passo para iniciantes.',
    intro: 'Um café memorável não depende de equipamento caro: depende de quatro variáveis controláveis — moagem, proporção, temperatura e tempo. Neste guia, você aprende a dominar cada uma delas e transforma o café de todo dia em uma pausa especial.',
    sections: [
      {
        id: 'graos-frescos',
        title: '1. Comece com grãos frescos',
        body: '<p>Tudo começa na matéria-prima. <strong>Compre grãos inteiros</strong> e moa perto do preparo: o café moído perde aroma em minutos, não em horas. Prefira torras com menos de 3 semanas e guarde em pote hermético, longe de luz e calor — nunca na geladeira.</p><p>O volume de degustação de um bom café é como o de um bom vinho: o frescor muda tudo.</p>'
      },
      {
        id: 'moagem',
        title: '2. Acerte a moagem',
        body: '<p>A moagem controla a velocidade de extração. <strong>Fina</strong> (textura de açúcar refinado) para espresso e moka; <strong>média</strong> (sal grosso) para coados como V60 e AeroPress; <strong>grossa</strong> (farinha de mandioca) para prensa francesa e cold brew.</p><p>Sem moedor? Peça ao torrefador para moer na granulometria certa para o seu método — é melhor que moagem caseira inconsistente.</p>'
      },
      {
        id: 'proporcao',
        title: '3. Use a proporção certa',
        body: '<p>A proporção clássica é <strong>1:16</strong> — 60 gramas de café para 1 litro de água (ou 15 g para 240 ml, uma xícara). Prefere mais forte? 1:14. Mais suave? 1:18.</p><p>Invista em uma balança de cozinha de 0,1 g: medição por colher varia até 30% e é a maior causa de cafés inconsistentes.</p>'
      },
      {
        id: 'temperatura',
        title: '4. Controle a temperatura da água',
        body: '<p>Água fervendo queima o café. A faixa ideal é <strong>92°C a 96°C</strong> para métodos filtrados. Sem termômetro? Deixe a água ferver e espere 30 a 45 segundos — ela estará no ponto.</p><p>Use sempre água filtrada: o cloro e o excesso de minerais mascaram os aromas do café.</p>'
      },
      {
        id: 'tempo',
        title: '5. Respeite o tempo de extração',
        body: '<p>Cada método tem seu tempo: <strong>coado 2:30 a 3:30 min</strong>, prensa francesa 4 min, espresso 25–30 s, AeroPress 1:30 min, cold brew 12–18 h.</p><p>Extração curta demais deixa o café azedo e aguado; longa demais, amargo e adstringente. Cronometre e ajuste: se amargar, moa mais grosso; se azedar, moa mais fino.</p>'
      },
      {
        id: 'erros',
        title: '6. Os erros mais comuns (e como evitar)',
        body: '<p><strong>Usar café velho</strong> (perda total de aroma); <strong>água de torneira</strong> (mascara o sabor); <strong>proporção de olho</strong> (inconsistência); <strong>deixar o coado esfriar antes de servir</strong> (perde aromas); e <strong>reusar a borra</strong> (extrai apenas amargor).</p><p>Evite esses cinco e o seu café já estará acima da média dos cafés de padaria.</p>'
      }
    ],
    faqs: [
      { q: 'Qual a proporção ideal de café para água?', a: 'Comece em 1:16 (15 g de café para 240 ml de água). Ajuste ao paladar: 1:14 para um café mais forte e encorpado, 1:18 para mais suave e delicado.' },
      { q: 'Qual temperatura da água para coar café?', a: 'Entre 92°C e 96°C. Água fervente (100°C) queima o café e amarga a bebida. Sem termômetro, espere 30–45 segundos após a fervura.' },
      { q: 'Café moído dura quanto tempo?', a: 'Café moído perde aroma rapidamente: o ideal é consumir em até 2 semanas se bem armazenado em pote hermético. Grãos inteiros duram de 3 a 6 semanas.' },
      { q: 'Por que meu café fica amargo?', a: 'As causas mais comuns são moagem fina demais, água quente demais ou tempo de extração longo. Corrija uma variável por vez: moa mais grosso e reduza a temperatura.' },
      { q: 'Posso fazer café sem balança?', a: 'Pode, mas a consistência melhora muito com uma balança de 0,1 g (custa pouco e vale a pena). Uma colher de sopa cheia tem cerca de 5–7 g de café moído, dependendo da moagem.' }
    ],
    ctaTitle: 'Hora de praticar',
    ctaText: 'Coloque o conhecimento em ação com receitas testadas e aprovadas pelo nosso time.',
    ctaHref: '/receitas/',
    ctaLabel: 'Explorar receitas'
  },
  {
    slug: 'cafes-do-brasil',
    h1: 'Cafés do Brasil: Regiões Produtoras',
    pageTitle: 'Cafés do Brasil — Regiões Produtoras e Perfis de Sabor',
    description: 'Conheça as principais regiões produtoras de café do Brasil: Cerrado Mineiro, Sul de Minas, Mogiana, Espírito Santo, Bahia e Paraná — perfis de sabor e o que esperar de cada uma.',
    intro: 'O Brasil é o maior produtor e exportador de café do mundo há mais de 150 anos. De montanhas mineiras ao cerrado baiano, cada região imprime características únicas nos grãos. Conheça os terroirs brasileiros e descubra os perfis de sabor de cada um.',
    sections: [
      {
        id: 'cerrado-mineiro',
        title: 'Cerrado Mineiro: doçura e consistência',
        body: '<p>Primeira região do mundo com <strong>Denominação de Origem</strong> para café, o Cerrado Mineiro (Triângulo Mineiro e Alto Paranaíba) combina altitude de 800–1.200 m, clima definido e irrigação controlada.</p><p>O resultado são cafés de <strong>doçura marcante, corpo médio e notas de chocolate e caramelo</strong>, com acidez equilibrada — um dos perfis mais premiados do país.</p>'
      },
      {
        id: 'sul-de-minas',
        title: 'Sul de Minas: o coração produtor',
        body: '<p>Maior região produtora do Brasil, o Sul de Minas concentra pequenas propriedades em montanhas acima de 900 m. A colheita manual e o clima de altitude favorecem <strong>cafés com acidez delicada, corpo aveludado e notas de frutas amarelas</strong>.</p><p>É a região que mais cresce em cafés especiais de origem controlada no país.</p>'
      },
      {
        id: 'mogiana',
        title: 'Mogiana Paulista: tradição e qualidade',
        body: '<p>Na divisa de São Paulo com Minas, a Mogiana tem tradição centenária e altitudes entre 900 e 1.100 m. Os cafés da região são conhecidos pelo <strong>equilíbrio entre doçura, acidez e corpo</strong>, com notas de castanhas e finalização limpa.</p><p>Diversas fazendas históricas da região investem em cafés especiais e turismo rural.</p>'
      },
      {
        id: 'espirito-santo',
        title: 'Espírito Santo: o reino do conilon',
        body: '<p>O Espírito Santo é o maior produtor de <strong>conilon (robusta)</strong> do Brasil, sobretudo nas terras baixas do norte do estado. Também produz arábica nas montanhas do Caparaó, com altitude acima de 1.000 m.</p><p>Os arábicas capixabas surpreendem com <strong>acidez cítrica e notas florais</strong>; o conilon de qualidade é usado em blends de espresso pelo corpo e crema.</p>'
      },
      {
        id: 'bahia',
        title: 'Bahia: o terroir do cerrado baiano',
        body: '<p>O oeste baiano, com altitudes de 800 a 1.100 m, clima seco e irrigação, produz cafés de <strong>acidez vibrante, doçura intensa e notas de frutas tropicais</strong>. É a região que mais cresceu em qualidade nas últimas duas décadas, com colheita mecanizada e rastreabilidade de ponta.</p>'
      },
      {
        id: 'parana',
        title: 'Paraná: pioneirismo e renovação',
        body: '<p>Pioneiro na cafeicultura brasileira no século XX, o Paraná sofreu com as geadas de 1975 e diversificou a produção. Hoje, o <strong>Norte Pioneiro</strong> renasce com cafés especiais de altitude, premiados nacionalmente por <strong>doçura, acidez média e notas de chocolate ao leite</strong>.</p>'
      }
    ],
    faqs: [
      { q: 'Qual região produz o melhor café do Brasil?', a: 'Não há um único vencedor: Cerrado Mineiro se destaca pela doçura consistente, Sul de Minas pela acidez delicada, Mogiana pelo equilíbrio e Bahia pela acidez vibrante. O "melhor" é o que agrada o seu paladar — explore origens diferentes.' },
      { q: 'O que é café com Denominação de Origem?', a: 'É um selo que atesta que o café vem de uma região delimitada, com clima e solo que conferem características únicas. No Brasil, o Cerrado Mineiro foi a primeira região certificada — garantia de origem e qualidade.' },
      { q: 'Café brasileiro é arábica ou robusta?', a: 'O Brasil produz os dois: cerca de 80% é arábica (Minas, São Paulo, Bahia e Paraná) e 20% é conilon/robusta, concentrado no Espírito Santo e em Rondônia.' },
      { q: 'Por que cafés de altitude são melhores?', a: 'Em altitudes maiores, o grão amadurece mais devagar, desenvolvendo mais açúcares e compostos aromáticos. É por isso que as melhores regiões brasileiras ficam acima de 800 m.' },
      { q: 'Onde comprar café brasileiro de origem?', a: 'Procure torrefações que informem a região de origem, a fazenda ou o produtor no rótulo. Cafés com Denominação de Origem (Cerrado Mineiro) ou com nome de fazenda costumam ter qualidade superior e rastreabilidade.' }
    ],
    ctaTitle: 'Do terroir à xícara',
    ctaText: 'Valorize os grãos brasileiros com preparos que realçam cada perfil de sabor.',
    ctaHref: '/receitas/',
    ctaLabel: 'Ver receitas com café'
  },
  {
    slug: 'glossario-do-cafe',
    h1: 'Glossário do Café: Termos Essenciais',
    pageTitle: 'Glossário do Café — Termos que Todo Amante Precisa Conhecer',
    description: 'Glossário completo do café: acidez, corpo, crema, torra, café especial, barista, latte art, moagem e mais de 30 termos explicados de forma simples.',
    intro: 'Do pedido na cafeteria à leitura de um rótulo, termos como acidez, corpo, crema e torra aparecem o tempo todo. Este glossário reúne os principais conceitos do universo do café — explicados sem enrolação, para você pedir e avaliar café como um especialista.',
    sections: [
      {
        id: 'perfil',
        title: 'Perfil de xícara: acidez, corpo e doçura',
        body: '<p><strong>Acidez</strong> não é amargor: é a vivacidade e o brilho do café, com notas cítricas, frutadas ou vinagre. <strong>Corpo</strong> é a textura na boca, de leve (como chá) a pesado (como leite integral). <strong>Doçura</strong> é a percepção de açúcares naturais, que equilibra a acidez e o amargor.</p><p>Esses três atributos formam o perfil de uma xícara — e é por eles que os especialistas avaliam cafés em concursos e degustações (cupping).</p>'
      },
      {
        id: 'torra',
        title: 'Torra e moagem',
        body: '<p><strong>Torra clara</strong> (blond/light) preserva acidez e aromas florais; <strong>média</strong> (medium) equilibra; <strong>escura</strong> (dark) entrega amargor e notas de chocolate amargo. <strong>Moagem</strong> é a granulometria do café moído: fina (espresso), média (coados) ou grossa (prensa francesa e cold brew).</p>'
      },
      {
        id: 'extracao',
        title: 'Extração e crema',
        body: '<p><strong>Extração</strong> é o processo de dissolver os compostos solúveis do café na água — quando bem dosada, revela doçura e aroma; quando falha, gera azedo (sub-extração) ou amargo (super-extração).</p><p><strong>Crema</strong> é a espuma dourada do espresso, formada por gás carbônico e óleos sob pressão. É sinal de extração adequada e grãos frescos.</p>'
      },
      {
        id: 'mercado',
        title: 'Café especial, blends e origens',
        body: '<p><strong>Café especial</strong> é aquele que pontua 80+ na escala SCA (Specialty Coffee Association), avaliado por acidez, corpo, sabor, aroma e ausência de defeitos. <strong>Blend</strong> é a mistura de grãos ou origens para criar um perfil consistente. <strong>Origem única</strong> (single origin) vem de uma fazenda ou região específica.</p>'
      },
      {
        id: 'barista',
        title: 'Barista e arte da xícara',
        body: '<p><strong>Barista</strong> é o profissional que prepara café e espresso profissionalmente — hoje, também um especialista em torra, extração e hospitalidade. <strong>Latte art</strong> é o desenho feito com leite vaporizado sobre o espresso. <strong>Cupping</strong> é a degustação profissional, usada para avaliar e comprar lotes.</p>'
      }
    ],
    faqs: [
      { q: 'O que significa acidez no café?', a: 'Acidez é a sensação de vivacidade e brilho da bebida — notas cítricas, frutadas ou florais. Não é o azedo do café fermentado ou passado do ponto: uma boa acidez é vibrante e agradável.' },
      { q: 'O que é café especial?', a: 'É um café de alta qualidade, pontuado acima de 80 na escala da SCA, produzido com rastreabilidade e sem defeitos. Representa menos de 10% da produção mundial.' },
      { q: 'O que é crema do café?', a: 'É a camada de espuma dourada que se forma sobre o espresso, composta por óleos e gás carbônico presos sob pressão. Espuma densa e persistente indica grãos frescos e extração correta.' },
      { q: 'Qual a diferença entre torra clara e escura?', a: 'A torra clara preserva acidez e notas originais do grão; a escura desenvolve amargor e notas de chocolate/fumaça, mascarando características da origem. A mesma matéria-prima rende cafés muito diferentes conforme a torra.' },
      { q: 'O que é um blend de café?', a: 'Blend é a mistura intencional de grãos (de origens ou espécies diferentes) para criar um perfil de sabor consistente, equilibrado e reproduzível — muito usado em espresso para unir corpo e crema.' }
    ],
    ctaTitle: 'Aprender na prática',
    ctaText: 'Vocabulário novo pede prática: leia nossos artigos e prepare receitas para sentir cada termo na xícara.',
    ctaHref: '/blog',
    ctaLabel: 'Ler artigos do blog'
  }
]
