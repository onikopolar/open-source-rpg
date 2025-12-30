const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== SEED DO BANCO DE DADOS ===')
  console.log('Versao 2.0.0 - Feature: Sistema completo com todos os sistemas RPG')
  console.log('Iniciando seed do banco de dados...')

  // Limpar todos os dados existentes
  console.log('Limpando dados existentes...')
  
  // Ordem correta para evitar erros de chave estrangeira
  await prisma.feiticeirosAtaque.deleteMany({})
  await prisma.feiticeirosResistencia.deleteMany({})
  await prisma.feiticeirosOficio.deleteMany({})
  await prisma.feiticeirosPericia.deleteMany({})
  await prisma.feiticeirosCharacterAttribute.deleteMany({})
  await prisma.feiticeirosAttribute.deleteMany({})
  
  await prisma.yearZeroCharacterSkill.deleteMany({})
  await prisma.yearZeroCharacterAttribute.deleteMany({})
  await prisma.yearZeroSkill.deleteMany({})
  await prisma.yearZeroAttribute.deleteMany({})
  
  await prisma.characterSkill.deleteMany({})
  await prisma.characterAttribute.deleteMany({})
  await prisma.skill.deleteMany({})
  await prisma.attribute.deleteMany({})
  
  await prisma.roll.deleteMany({})
  await prisma.character.deleteMany({})
  await prisma.config.deleteMany({})

  console.log('✅ Dados limpos com sucesso!')

  // ============================================
  // 1. SISTEMA CLÁSSICO (Atributos e Skills)
  // ============================================
  console.log('\n=== SISTEMA CLÁSSICO ===')
  console.log('Criando atributos do sistema clássico...')
  
  const classicAttributes = await prisma.attribute.createMany({
    data: [
      { name: 'Força', description: 'Mede o poder físico' },
      { name: 'Destreza', description: 'Mede a agilidade e coordenação' },
      { name: 'Constituição', description: 'Mede a resistência e vitalidade' },
      { name: 'Inteligência', description: 'Mede o raciocínio e conhecimento' },
      { name: 'Sabedoria', description: 'Mede a percepção e intuição' },
      { name: 'Carisma', description: 'Mede a personalidade e persuasão' }
    ]
  })

  console.log('Criando skills do sistema clássico...')
  
  const classicSkills = await prisma.skill.createMany({
    data: [
      { name: 'Acrobacia', description: 'Realizar manobras acrobáticas' },
      { name: 'Arcanismo', description: 'Conhecimento de magia e itens mágicos' },
      { name: 'Atletismo', description: 'Realizar proezas físicas' },
      { name: 'Atuação', description: 'Entreter através da arte' },
      { name: 'Enganação', description: 'Mentir e disfarçar' },
      { name: 'Furtividade', description: 'Mover-se silenciosamente' },
      { name: 'História', description: 'Conhecimento de eventos históricos' },
      { name: 'Intimidação', description: 'Coagir através do medo' },
      { name: 'Intuição', description: 'Perceber intenções e emoções' },
      { name: 'Investigação', description: 'Encontrar pistas e resolver mistérios' },
      { name: 'Lidar com Animais', description: 'Treinar e acalmar animais' },
      { name: 'Medicina', description: 'Diagnosticar e tratar ferimentos' },
      { name: 'Natureza', description: 'Conhecimento sobre natureza' },
      { name: 'Percepção', description: 'Notar detalhes ao redor' },
      { name: 'Persuasão', description: 'Convencer através da diplomacia' },
      { name: 'Prestidigitação', description: 'Executar truques manuais' },
      { name: 'Religião', description: 'Conhecimento sobre religiões' },
      { name: 'Sobrevivência', description: 'Sobreviver na natureza' }
    ]
  })

  console.log(`✅ Sistema clássico criado: ${(await prisma.attribute.count())} atributos, ${(await prisma.skill.count())} skills`)

  // ============================================
  // 2. SISTEMA YEAR ZERO
  // ============================================
  console.log('\n=== SISTEMA YEAR ZERO ===')
  console.log('Criando atributos do sistema Year Zero...')
  
  const yearZeroAttributes = await prisma.yearZeroAttribute.createMany({
    data: [
      { name: 'Força', description: 'Atributo físico e combate corpo a corpo' },
      { name: 'Agilidade', description: 'Atributo de destreza e movimentação' },
      { name: 'Inteligência', description: 'Atributo mental e conhecimento' },
      { name: 'Empatia', description: 'Atributo social e influência' }
    ]
  })

  console.log('Criando skills do sistema Year Zero...')
  
  const yearZeroSkills = await prisma.yearZeroSkill.createMany({
    data: [
      // Força
      { name: 'COMBATE CORPO A CORPO', description: 'Luta com armas brancas e combate físico' },
      { name: 'MAQUINÁRIO PESADO', description: 'Operação de veículos e maquinário pesado' },
      { name: 'RESISTÊNCIA', description: 'Resistência física e suportar condições adversas' },
      
      // Agilidade
      { name: 'COMBATE À DISTÂNCIA', description: 'Uso de armas de fogo e arremesso' },
      { name: 'MOBILIDADE', description: 'Movimentação rápida e evasiva' },
      { name: 'PILOTAGEM', description: 'Controle de veículos e pilotagem' },
      
      // Inteligência
      { name: 'OBSERVAÇÃO', description: 'Percepção de detalhes e ambiente' },
      { name: 'SOBREVIVÊNCIA', description: 'Sobrevivência em ambientes hostis' },
      { name: 'TECNOLOGIA', description: 'Uso e compreensão de tecnologia' },
      
      // Empatia
      { name: 'MANIPULAÇÃO', description: 'Influenciar e manipular pessoas' },
      { name: 'COMANDO', description: 'Liderança e comando de grupo' },
      { name: 'AJUDA MÉDICA', description: 'Primeiros socorros e medicina' }
    ]
  })

  console.log(`✅ Sistema Year Zero criado: ${(await prisma.yearZeroAttribute.count())} atributos, ${(await prisma.yearZeroSkill.count())} skills`)

  // ============================================
  // 3. SISTEMA FEITICEIROS
  // ============================================
  console.log('\n=== SISTEMA FEITICEIROS ===')
  console.log('Criando atributos do sistema Feiticeiros...')
  
  const feiticeirosAttributes = await prisma.feiticeirosAttribute.createMany({
    data: [
      { name: 'FORÇA', description: 'Poder muscular, físico e bruto', base_value: 10 },
      { name: 'DESTREZA', description: 'Agilidade, reflexos e rapidez', base_value: 10 },
      { name: 'CONSTITUIÇÃO', description: 'Resistência e vigor', base_value: 10 },
      { name: 'INTELIGÊNCIA', description: 'Raciocínio e intelecto', base_value: 10 },
      { name: 'SABEDORIA', description: 'Conhecimento pela experiência', base_value: 10 },
      { name: 'PRESENÇA', description: 'Força da personalidade e influência', base_value: 10 }
    ]
  })

  console.log(`✅ Sistema Feiticeiros criado: ${(await prisma.feiticeirosAttribute.count())} atributos`)

  // ============================================
  // 4. PERSONAGENS DE EXEMPLO
  // ============================================
  console.log('\n=== PERSONAGENS DE EXEMPLO ===')

  // Personagem Year Zero
  console.log('Criando personagem Year Zero de exemplo...')
  const yearZeroChar = await prisma.character.create({
    data: {
      name: 'Caçador do Apocalipse',
      age: 32,
      gender: 'Masculino',
      player_name: 'Jogador Year Zero',
      rpg_system: 'year_zero',
      current_hit_points: 14,
      max_hit_points: 14,
      stress_level: 2,
      trauma_level: 0,
      willpower: 3,
      health_squares: JSON.stringify([true, true, true, true, true, false, false, false, false, false]),
      stress_squares: JSON.stringify([true, true, false, false, false, false, false, false, false, false]),
      equipment_notes: 'Equipamentos:\n- Rifle de precisão (5 balas)\n- Faca de combate\n- Kit de primeiros socorros\n- Lanterna\n- Ração para 2 dias\n- Cantil\n- Binóculos\n- Corda (15m)'
    }
  })

  // Vincular atributos Year Zero
  const yearZeroAttrs = await prisma.yearZeroAttribute.findMany()
  for (const attr of yearZeroAttrs) {
    await prisma.yearZeroCharacterAttribute.create({
      data: {
        character_id: yearZeroChar.id,
        attribute_id: attr.id,
        value: 3 // Valor médio
      }
    })
  }

  // Vincular skills Year Zero
  const yearZeroSkls = await prisma.yearZeroSkill.findMany()
  for (const skill of yearZeroSkls) {
    await prisma.yearZeroCharacterSkill.create({
      data: {
        character_id: yearZeroChar.id,
        skill_id: skill.id,
        value: Math.floor(Math.random() * 3) // Valor aleatório 0-2
      }
    })
  }

  console.log(`✅ Personagem Year Zero criado: ${yearZeroChar.name} (ID: ${yearZeroChar.id})`)

  // Personagem Feiticeiros
  console.log('Criando personagem Feiticeiros de exemplo...')
  const feiticeirosChar = await prisma.character.create({
    data: {
      name: 'Aelius Valerius',
      age: 28,
      gender: 'Masculino',
      player_name: 'Jogador Feiticeiros',
      rpg_system: 'feiticeiros',
      current_hit_points: 45,
      max_hit_points: 45,
      current_energy_points: 20,
      max_energy_points: 20,
      current_soul_integrity: 75,
      feiticeiros_metodo_criacao: 'PONTOS',
      feiticeiros_distribution_completed: true,
      origem: 'Nobre Arruinado',
      treino: 'Caçador de Recompensas',
      especializacao: 'Lâmina Amaldiçoada',
      tecnica: 'Controle de Energia',
      experiencia: 150,
      grau: 'Aprendiz',
      equipment_notes: 'Equipamentos Mágicos:\n- Lâmina Amaldiçoada "Voragem"\n- Amuleto de Proteção\n- Grimório de Feitiços\n- Poções de Cura (3)\n- Poções de Energia (2)\n- Veste de Estudante\n- Kit de Alquimia'
    }
  })

  // Vincular atributos Feiticeiros
  const feiticeirosAttrs = await prisma.feiticeirosAttribute.findMany()
  for (const attr of feiticeirosAttrs) {
    await prisma.feiticeirosCharacterAttribute.create({
      data: {
        character_id: feiticeirosChar.id,
        attribute_id: attr.id,
        value: attr.base_value
      }
    })
  }

  // Criar perícias Feiticeiros
  const periciasData = [
    { nome: 'ATLETISMO', atributo: 'FORÇA', descricao: 'Testes de força física, saltos, escaladas, natação' },
    { nome: 'ACROBACIA', atributo: 'DESTREZA', descricao: 'Equilíbrio, cambalhotas, esquivar, movimentos ágeis' },
    { nome: 'FURTIVIDADE', atributo: 'DESTREZA', descricao: 'Movimento silencioso, esconder-se, passar despercebido' },
    { nome: 'FEITIÇARIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento específico sobre feitiços e magias' },
    { nome: 'PERCEPÇÃO', atributo: 'SABEDORIA', descricao: 'Percepção sensorial, notar detalhes, escutar sons' },
    { nome: 'PERSUASÃO', atributo: 'PRESENÇA', descricao: 'Convencer, negociar, diplomacia, discursos persuasivos' }
  ]

  for (const pericia of periciasData) {
    await prisma.feiticeirosPericia.create({
      data: {
        character_id: feiticeirosChar.id,
        ...pericia,
        treinada: Math.random() > 0.5,
        mestre: Math.random() > 0.8,
        outros: Math.floor(Math.random() * 3)
      }
    })
  }

  console.log(`✅ Personagem Feiticeiros criado: ${feiticeirosChar.name} (ID: ${feiticeirosChar.id})`)

  // Personagem Clássico
  console.log('Criando personagem Clássico de exemplo...')
  const classicChar = await prisma.character.create({
    data: {
      name: 'Eldrin Shadowfoot',
      age: 120,
      gender: 'Masculino',
      player_name: 'Jogador Clássico',
      rpg_system: 'classic',
      current_hit_points: 32,
      max_hit_points: 32,
      level: 3,
      experience: 900,
      equipment_notes: 'Inventário:\n- Espada Longa +1\n- Armadura de Couro\n- Arco Curto (20 flechas)\n- Kit de Ladrão\n- Poção de Cura\n- 50 peças de ouro\n- Pergaminho com mapa\n- Chave misteriosa'
    }
  })

  // Vincular atributos clássicos
  const classicAttrs = await prisma.attribute.findMany()
  for (const attr of classicAttrs) {
    await prisma.characterAttribute.create({
      data: {
        character_id: classicChar.id,
        attribute_id: attr.id,
        value: 10 + Math.floor(Math.random() * 6) // Valores 10-15
      }
    })
  }

  // Vincular algumas skills clássicas
  const classicSkls = await prisma.skill.findMany()
  const selectedSkills = classicSkls.slice(0, 6) // Primeiras 6 skills
  for (const skill of selectedSkills) {
    await prisma.characterSkill.create({
      data: {
        character_id: classicChar.id,
        skill_id: skill.id,
        value: Math.floor(Math.random() * 5) + 1 // Valores 1-5
      }
    })
  }

  console.log(`✅ Personagem Clássico criado: ${classicChar.name} (ID: ${classicChar.id})`)

  // ============================================
  // 5. CONFIGURAÇÕES DO SISTEMA
  // ============================================
  console.log('\n=== CONFIGURAÇÕES DO SISTEMA ===')
  console.log('Criando configurações...')

  const configData = [
    // Configurações gerais
    { name: 'DICE_ON_SCREEN_TIMEOUT_IN_MS', value: '5000' },
    { name: 'TIME_BETWEEN_DICES_IN_MS', value: '1000' },
    { name: 'APP_VERSION', value: '2.0.0' },
    { name: 'DEFAULT_RPG_SYSTEM', value: 'year_zero' },
    
    // Configurações Year Zero
    { name: 'YEARZERO_MAX_ATTRIBUTE_VALUE', value: '6' },
    { name: 'YEARZERO_MAX_SKILL_VALUE', value: '6' },
    { name: 'YEARZERO_BASE_ATTRIBUTE_VALUE', value: '2' },
    
    // Configurações Feiticeiros
    { name: 'FEITICEIROS_MAX_ATTRIBUTE_VALUE', value: '20' },
    { name: 'FEITICEIROS_BASE_ATTRIBUTE_VALUE', value: '10' },
    { name: 'FEITICEIROS_BASE_HIT_POINTS', value: '10' },
    
    // Métodos de criação Feiticeiros
    { name: 'FEITICEIROS_METODOS_CRIACAO', value: JSON.stringify({
      'FIXOS': {
        id: 'FIXOS',
        nome: 'VALORES FIXOS',
        descricao: 'Balanceado e justo para todos os jogadores',
        detalhes: 'Receba 6 valores pré-definidos [15,14,13,12,10,8] e distribua entre os atributos.',
        badge: 'RECOMENDADO'
      },
      'ROLAGEM': {
        id: 'ROLAGEM',
        nome: 'ROLAGEM',
        descricao: 'Aventure-se e deixe a sorte decidir seu destino',
        detalhes: 'Role 4d6 para cada atributo (descarte o menor). Personagens únicos e imprevisíveis!',
        badge: 'AVENTUREIRO'
      },
      'COMPRA': {
        id: 'COMPRA',
        nome: 'COMPRA POR PONTOS',
        descricao: 'Controle total sobre seu personagem',
        detalhes: 'Comece com 10 em tudo e use 17 pontos pra comprar melhorias seguindo uma tabela de custos.',
        badge: 'EXPERT'
      }
    })},
    
    // Especializações Feiticeiros
    { name: 'FEITICEIROS_ESPECIALIZACOES', value: JSON.stringify([
      'Lutador',
      'Especialista em Combate', 
      'Especialista em Técnica',
      'Controlador',
      'Suporte',
      'Restringido'
    ])}
  ]

  await prisma.config.createMany({
    data: configData
  })

  console.log(`✅ ${configData.length} configurações criadas`)

  // ============================================
  // 6. RESUMO FINAL
  // ============================================
  console.log('\n=== RESUMO DO SEED ===')
  console.log('✅ Seed completo executado com sucesso!')
  console.log(`��� Personagens criados: ${await prisma.character.count()}`)
  console.log(`⚡ Atributos clássicos: ${await prisma.attribute.count()}`)
  console.log(`��� Skills clássicas: ${await prisma.skill.count()}`)
  console.log(`��� Atributos Year Zero: ${await prisma.yearZeroAttribute.count()}`)
  console.log(`��� Skills Year Zero: ${await prisma.yearZeroSkill.count()}`)
  console.log(`��� Atributos Feiticeiros: ${await prisma.feiticeirosAttribute.count()}`)
  console.log(`⚙️ Configurações: ${await prisma.config.count()}`)
  console.log('\n=== SEED FINALIZADO ===')
  console.log('Todos os sistemas RPG foram configurados com sucesso!')
}

// Executar o seed
main()
  .catch((error) => {
    console.error('❌ ERRO NO SEED:', error)
    console.error('Detalhes do erro:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\n✅ Conexão com o banco de dados encerrada')
  })
