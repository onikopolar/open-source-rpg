const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('INICIANDO SEED PARA SISTEMA FEITICEIROS E MALDIÇÕES')

  // 1. Limpar TODOS os dados existentes
  console.log('Limpando dados existentes...')
  await prisma.yearZeroSkills.deleteMany({})
  await prisma.yearZeroAttributes.deleteMany({})
  await prisma.characterSkills.deleteMany({})
  await prisma.characterAttributes.deleteMany({})
  await prisma.roll.deleteMany({})
  await prisma.character.deleteMany({})
  await prisma.yearZeroSkill.deleteMany({})
  await prisma.yearZeroAttribute.deleteMany({})
  await prisma.skill.deleteMany({})
  await prisma.attribute.deleteMany({})
  await prisma.config.deleteMany({})

  // 2. CRIAR SISTEMA FEITICEIROS E MALDIÇÕES
  console.log('Criando sistema Feiticeiros e Maldicoes...')

  // Atributos do sistema (6 atributos do characterSheet.js)
  const feiticeirosAttributes = await prisma.yearZeroAttribute.createMany({
    data: [
      { name: 'FORÇA', description: 'Poder muscular, físico e bruto. Usado para aumentar dano, aplicações de força bruta, peso levantado, altura do pulo.' },
      { name: 'DESTREZA', description: 'Agilidade, reflexos e rapidez. Usado para equilíbrio, esquivar, manuseio de armas leves, acrobacias.' },
      { name: 'CONSTITUIÇÃO', description: 'Resistência e vigor. Aplicado aos pontos de vida, testes de fortitude, resistência a venenos, fôlego.' },
      { name: 'INTELIGÊNCIA', description: 'Raciocínio e intelecto. Permite aprendizado, uso de perícias, assimilação de informações, velocidade mental.' },
      { name: 'SABEDORIA', description: 'Conhecimento pela experiência, observação. Mede atenção aos arredores, usado em perícias de percepção.' },
      { name: 'PRESENÇA', description: 'Força da personalidade e influência. Capacidade de influenciar outros com palavras, gestos, simpatia ou beleza.' }
    ]
  })

  // Criar todas as habilidades do sistema
  const periciasData = [
    // PERÍCIAS
    { name: 'ATLETISMO', description: 'Testes de força física, saltos, escaladas, natação' },
    { name: 'ACROBACIA', description: 'Equilíbrio, cambalhotas, esquivar, movimentos ágeis' },
    { name: 'FURTIVIDADE', description: 'Movimento silencioso, esconder-se, passar despercebido' },
    { name: 'PRESTIDIGITAÇÃO', description: 'Truques manuais, pickpocket, atos de destreza manual' },
    { name: 'DIREÇÃO', description: 'Navegação, orientação, leitura de mapas' },
    { name: 'INTUIÇÃO', description: 'Percepção de intenções, leitura de pessoas' },
    { name: 'MEDICINA', description: 'Primeiros socorros, diagnóstico, tratamento de ferimentos' },
    { name: 'OCULTISMO', description: 'Conhecimento sobre magia, criaturas sobrenaturais, símbolos' },
    { name: 'PERCEPÇÃO', description: 'Percepção sensorial, notar detalhes, escutar sons' },
    { name: 'SOBREVIVÊNCIA', description: 'Rastreamento, caça, acampamento, orientação na natureza' },
    { name: 'FEITIÇARIA', description: 'Conhecimento específico sobre feitiços e magias' },
    { name: 'HISTÓRIA', description: 'Conhecimento histórico, lendas, eventos passados' },
    { name: 'INVESTIGAÇÃO', description: 'Análise de cenas, resolução de enigmas, dedução' },
    { name: 'TECNOLOGIA', description: 'Uso de dispositivos tecnológicos, eletrônicos, computadores' },
    { name: 'TEOLOGIA', description: 'Conhecimento sobre religiões, deuses, práticas espirituais' },
    { name: 'ENGANAÇÃO', description: 'Mentir, disfarces, blefes, criar histórias convincentes' },
    { name: 'INTIMIDAÇÃO', description: 'Amedrontar, coagir, impor respeito através da presença' },
    { name: 'PERFORMANCE', description: 'Atuação, canto, dança, apresentações artísticas' },
    { name: 'PERSUASÃO', description: 'Convencer, negociar, diplomacia, discursos persuasivos' },
    
    // OFÍCIOS
    { name: 'CANALIZADOR', description: 'Criação e manutenção de canais de energia amaldiçoada' },
    { name: 'ENTALHADOR', description: 'Criação de selos, símbolos e artefatos mágicos' },
    { name: 'ASTÚCIA', description: 'Estratégia, tática, planejamento em combate' },
    
    // RESISTÊNCIAS
    { name: 'FORTITUDE', description: 'Resistência a efeitos físicos, venenos, doenças' },
    { name: 'INTEGRIDADE', description: 'Resistência a corrupção, degeneração, decomposição' },
    { name: 'REFLEXOS', description: 'Esquiva de ataques, explosões, armadilhas' },
    { name: 'VONTADE', description: 'Resistência a efeitos mentais, ilusões, controle mental' },
    
    // ATAQUES
    { name: 'CORPO-A-CORPO', description: 'Ataques com armas brancas e combate físico' },
    { name: 'A DISTÂNCIA', description: 'Ataques com armas de arremesso, arcos, bestas' },
    { name: 'AMALDIÇOADO', description: 'Ataques usando energia amaldiçoada e feitiços' }
  ]

  const feiticeirosSkills = await prisma.yearZeroSkill.createMany({
    data: periciasData
  })

  // 3. CRIAR PERSONAGEM DE EXEMPLO - CORRIGIDO: usar 'feiticeiros' em vez de 'year_zero'
  console.log('Criando personagem de exemplo...')

  const exampleCharacter = await prisma.character.create({
    data: {
      name: 'Feiticeiro Exemplo',
      age: 25,
      gender: 'Masculino',
      player_name: 'Jogador Demo',
      rpg_system: 'feiticeiros', // CORREÇÃO AQUI: mudar para 'feiticeiros'
      current_hit_points: 12,
      max_hit_points: 12,
      stress_level: 0,
      trauma_level: 0,
      willpower: 5,
      experience: 0,
      health_squares: JSON.stringify(Array(12).fill(false)),
      stress_squares: JSON.stringify(Array(10).fill(false)),
      current_picture: 1,
      is_dead: false
    }
  })

  // Buscar atributos e skills criados
  const createdAttributes = await prisma.yearZeroAttribute.findMany()
  const createdSkills = await prisma.yearZeroSkill.findMany()

  // Vincular atributos ao personagem com valores iniciais
  const characterAttributes = await prisma.yearZeroAttributes.createMany({
    data: createdAttributes.map(attr => ({
      character_id: exampleCharacter.id,
      attribute_id: attr.id,
      value: 10 // Valor inicial padrão
    }))
  })

  // Vincular skills ao personagem com valores iniciais
  const characterSkills = await prisma.yearZeroSkills.createMany({
    data: createdSkills.map(skill => ({
      character_id: exampleCharacter.id,
      skill_id: skill.id,
      value: 0 // Valor inicial padrão
    }))
  })

  // 4. CRIAR CONFIGURAÇÃO DO SISTEMA
  console.log('Criando configuracao do sistema...')

  // Mapeamento de perícias por atributo (baseado no characterSheet.js)
  const skillMappings = {
    'FORÇA': ['ATLETISMO'],
    'DESTREZA': ['ACROBACIA', 'FURTIVIDADE', 'PRESTIDIGITAÇÃO'],
    'CONSTITUIÇÃO': ['FORTITUDE', 'INTEGRIDADE'],
    'INTELIGÊNCIA': ['FEITIÇARIA', 'HISTÓRIA', 'INVESTIGAÇÃO', 'TECNOLOGIA', 'TEOLOGIA', 'CANALIZADOR', 'ENTALHADOR', 'ASTÚCIA'],
    'SABEDORIA': ['DIREÇÃO', 'INTUIÇÃO', 'MEDICINA', 'OCULTISMO', 'PERCEPÇÃO', 'SOBREVIVÊNCIA'],
    'PRESENÇA': ['ENGANAÇÃO', 'INTIMIDAÇÃO', 'PERFORMANCE', 'PERSUASÃO']
  }

  // Configurações do sistema
  const configData = [
    // Mapeamentos de habilidades
    { name: 'FEITICEIROS_FORCA_SKILLS', value: JSON.stringify(skillMappings['FORÇA']) },
    { name: 'FEITICEIROS_DESTREZA_SKILLS', value: JSON.stringify(skillMappings['DESTREZA']) },
    { name: 'FEITICEIROS_CONSTITUICAO_SKILLS', value: JSON.stringify(skillMappings['CONSTITUIÇÃO']) },
    { name: 'FEITICEIROS_INTELIGENCIA_SKILLS', value: JSON.stringify(skillMappings['INTELIGÊNCIA']) },
    { name: 'FEITICEIROS_SABEDORIA_SKILLS', value: JSON.stringify(skillMappings['SABEDORIA']) },
    { name: 'FEITICEIROS_PRESENCA_SKILLS', value: JSON.stringify(skillMappings['PRESENÇA']) },

    // Categorias de habilidades
    { name: 'FEITICEIROS_OFICIOS', value: JSON.stringify(['CANALIZADOR', 'ENTALHADOR', 'ASTÚCIA']) },
    { name: 'FEITICEIROS_RESISTENCIAS', value: JSON.stringify(['FORTITUDE', 'INTEGRIDADE', 'REFLEXOS', 'VONTADE']) },
    { name: 'FEITICEIROS_ATAQUES', value: JSON.stringify(['CORPO-A-CORPO', 'A DISTÂNCIA', 'AMALDIÇOADO']) },

    // Especializações
    { name: 'FEITICEIROS_ESPECIALIZACOES_PV', value: JSON.stringify({
      'Lutador': { pv: 12, dadoVida: 'd10' },
      'Especialista em Combate': { pv: 12, dadoVida: 'd10' },
      'Especialista em Técnica': { pv: 10, dadoVida: 'd8' },
      'Controlador': { pv: 10, dadoVida: 'd8' },
      'Suporte': { pv: 10, dadoVida: 'd8' },
      'Restringido': { pv: 16, dadoVida: 'd12' }
    })},
    { name: 'FEITICEIROS_ESPECIALIZACOES_PE', value: JSON.stringify({
      'Lutador': { pe: 4, modAtributo: false },
      'Especialista em Combate': { pe: 4, modAtributo: false },
      'Especialista em Técnica': { pe: 6, modAtributo: true },
      'Controlador': { pe: 5, modAtributo: true },
      'Suporte': { pe: 5, modAtributo: true },
      'Restringido': { pe: 0, modAtributo: false }
    })},

    // Métodos de criação
    { name: 'FEITICEIROS_METODOS_CRIACAO', value: JSON.stringify({
      'FIXOS': {
        id: 'FIXOS',
        nome: 'VALORES FIXOS',
        descricao: 'Balanceado e justo para todos os jogadores',
        detalhes: 'Receba 6 valores pré-definidos [15,14,13,12,10,8] e distribua entre os atributos.',
        badge: 'RECOMENDADO',
        badgeColor: '#4caf50'
      },
      'ROLAGEM': {
        id: 'ROLAGEM',
        nome: 'ROLAGEM',
        descricao: 'Aventure-se e deixe a sorte decidir seu destino',
        detalhes: 'Role 4d6 para cada atributo (descarte o menor). Personagens únicos e imprevisíveis!',
        badge: 'AVENTUREIRO',
        badgeColor: '#ff9800'
      },
      'COMPRA': {
        id: 'COMPRA',
        nome: 'COMPRA POR PONTOS',
        descricao: 'Controle total sobre seu personagem',
        detalhes: 'Comece com 10 em tudo e use 17 pontos pra comprar melhorias seguindo uma tabela de custos.',
        badge: 'EXPERT',
        badgeColor: '#9c27b0'
      }
    })},

    // Tabela de custos
    { name: 'FEITICEIROS_TABELA_CUSTOS', value: JSON.stringify({
      8: -2,
      9: -1,
      10: 0,
      11: 2,
      12: 3,
      13: 4,
      14: 5,
      15: 7
    })},

    // Configurações gerais
    { name: 'DICE_ON_SCREEN_TIMEOUT_IN_MS', value: '5000' },
    { name: 'TIME_BETWEEN_DICES_IN_MS', value: '1000' }
  ]

  await prisma.config.createMany({
    data: configData
  })

  console.log('Sistema Feiticeiros e Maldicoes criado com sucesso')
  console.log('Personagem de exemplo criado com ID:', exampleCharacter.id)
  console.log('Total de atributos criados:', createdAttributes.length)
  console.log('Total de habilidades criadas:', createdSkills.length)
  console.log('Total de configuracoes salvas:', configData.length)
  console.log('SEED CONCLUIDO COM SUCESSO')
}

main()
  .catch((error) => {
    console.error('ERRO NO SEED:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })