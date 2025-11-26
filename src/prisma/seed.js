const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🎯 SEED COMPLETO PARA SISTEMA FEITICEIROS - TABELAS CORRETAS')

  // 1. Limpar apenas dados do Feiticeiros (mantém outros sistemas)
  console.log('Limpando dados do Feiticeiros...')
  await prisma.feiticeirosAtaque.deleteMany({})
  await prisma.feiticeirosResistencia.deleteMany({})
  await prisma.feiticeirosOficio.deleteMany({})
  await prisma.feiticeirosPericia.deleteMany({})
  await prisma.feiticeirosCharacterAttribute.deleteMany({})
  await prisma.feiticeirosAttribute.deleteMany({})
  await prisma.character.deleteMany({})
  await prisma.config.deleteMany({})

  // 2. CRIAR ATRIBUTOS DO SISTEMA FEITICEIROS (TABELAS CORRETAS)
  console.log('Criando atributos do sistema Feiticeiros...')
  const feiticeirosAttributes = await prisma.feiticeirosAttribute.createMany({
    data: [
      { name: 'FORÇA', description: 'Poder muscular, físico e bruto. Usado para aumentar dano, aplicações de força bruta, peso levantado, altura do pulo.', base_value: 10 },
      { name: 'DESTREZA', description: 'Agilidade, reflexos e rapidez. Usado para equilíbrio, esquivar, manuseio de armas leves, acrobacias.', base_value: 10 },
      { name: 'CONSTITUIÇÃO', description: 'Resistência e vigor. Aplicado aos pontos de vida, testes de fortitude, resistência a venenos, fôlego.', base_value: 10 },
      { name: 'INTELIGÊNCIA', description: 'Raciocínio e intelecto. Permite aprendizado, uso de perícias, assimilação de informações, velocidade mental.', base_value: 10 },
      { name: 'SABEDORIA', description: 'Conhecimento pela experiência, observação. Mede atenção aos arredores, usado em perícias de percepção.', base_value: 10 },
      { name: 'PRESENÇA', description: 'Força da personalidade e influência. Capacidade de influenciar outros com palavras, gestos, simpatia ou beleza.', base_value: 10 }
    ]
  })

  // 3. CRIAR PERSONAGEM DE EXEMPLO DO FEITICEIROS
  console.log('Criando personagem de exemplo do Feiticeiros...')
  const exampleCharacter = await prisma.character.create({
    data: {
      name: 'Feiticeiro Exemplo',
      age: 25,
      gender: 'Masculino',
      player_name: 'Jogador Demo',
      rpg_system: 'feiticeiros',
      current_hit_points: 12,
      max_hit_points: 12,
      // Campos específicos do Feiticeiros
      level: 1,
      origem: 'Estudante de Jujutsu',
      treino: 'Tradicional',
      especializacao: 'Especialista em Técnica',
      tecnica: 'Expansão de Domínio',
      experiencia: 0,
      multiclasse: '',
      grau: 'Grau 1',
      current_soul_integrity: 12,
      current_energy_points: 6,
      max_energy_points: 6,
      derived_values_bonuses: JSON.stringify({
        atencao: 0,
        defesa: 0,
        iniciativa: 0,
        deslocamento: 0
      }),
      atencao_bonus: 0,
      defesa_bonus: 0,
      iniciativa_bonus: 0,
      deslocamento_bonus: 0,
      atencao_calculado: 10,
      defesa_calculada: 10,
      iniciativa_calculada: 0,
      deslocamento_calculado: 9
    }
  })

  // 4. VINCULAR ATRIBUTOS AO PERSONAGEM (TABELAS CORRETAS)
  console.log('Vinculando atributos ao personagem...')
  const createdAttributes = await prisma.feiticeirosAttribute.findMany()
  
  const characterAttributes = await prisma.feiticeirosCharacterAttribute.createMany({
    data: createdAttributes.map(attr => ({
      character_id: exampleCharacter.id,
      attribute_id: attr.id,
      value: 10
    }))
  })

  // 5. CRIAR PERÍCIAS DO PERSONAGEM (TABELAS CORRETAS)
  console.log('Criando perícias do personagem...')
  const periciasData = [
    // PERÍCIAS - 19 no total
    { nome: 'ATLETISMO', atributo: 'FORÇA', descricao: 'Testes de força física, saltos, escaladas, natação' },
    { nome: 'ACROBACIA', atributo: 'DESTREZA', descricao: 'Equilíbrio, cambalhotas, esquivar, movimentos ágeis' },
    { nome: 'FURTIVIDADE', atributo: 'DESTREZA', descricao: 'Movimento silencioso, esconder-se, passar despercebido' },
    { nome: 'PRESTIDIGITAÇÃO', atributo: 'DESTREZA', descricao: 'Truques manuais, pickpocket, atos de destreza manual' },
    { nome: 'DIREÇÃO', atributo: 'SABEDORIA', descricao: 'Navegação, orientação, leitura de mapas' },
    { nome: 'INTUIÇÃO', atributo: 'SABEDORIA', descricao: 'Percepção de intenções, leitura de pessoas' },
    { nome: 'MEDICINA', atributo: 'SABEDORIA', descricao: 'Primeiros socorros, diagnóstico, tratamento de ferimentos' },
    { nome: 'OCULTISMO', atributo: 'SABEDORIA', descricao: 'Conhecimento sobre magia, criaturas sobrenaturais, símbolos' },
    { nome: 'PERCEPÇÃO', atributo: 'SABEDORIA', descricao: 'Percepção sensorial, notar detalhes, escutar sons' },
    { nome: 'SOBREVIVÊNCIA', atributo: 'SABEDORIA', descricao: 'Rastreamento, caça, acampamento, orientação na natureza' },
    { nome: 'FEITIÇARIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento específico sobre feitiços e magias' },
    { nome: 'HISTÓRIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento histórico, lendas, eventos passados' },
    { nome: 'INVESTIGAÇÃO', atributo: 'INTELIGÊNCIA', descricao: 'Análise de cenas, resolução de enigmas, dedução' },
    { nome: 'TECNOLOGIA', atributo: 'INTELIGÊNCIA', descricao: 'Uso de dispositivos tecnológicos, eletrônicos, computadores' },
    { nome: 'TEOLOGIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento sobre religiões, deuses, práticas espirituais' },
    { nome: 'ENGANAÇÃO', atributo: 'PRESENÇA', descricao: 'Mentir, disfarces, blefes, criar histórias convincentes' },
    { nome: 'INTIMIDAÇÃO', atributo: 'PRESENÇA', descricao: 'Amedrontar, coagir, impor respeito através da presença' },
    { nome: 'PERFORMANCE', atributo: 'PRESENÇA', descricao: 'Atuação, canto, dança, apresentações artísticas' },
    { nome: 'PERSUASÃO', atributo: 'PRESENÇA', descricao: 'Convencer, negociar, diplomacia, discursos persuasivos' }
  ]

  await prisma.feiticeirosPericia.createMany({
    data: periciasData.map(pericia => ({
      character_id: exampleCharacter.id,
      ...pericia
    }))
  })

  // 6. CRIAR OFÍCIOS (TABELAS CORRETAS)
  console.log('Criando ofícios...')
  const oficiosData = [
    { nome: 'CANALIZADOR', atributo: 'INTELIGÊNCIA', descricao: 'Criação e manutenção de canais de energia amaldiçoada' },
    { nome: 'ENTALHADOR', atributo: 'INTELIGÊNCIA', descricao: 'Criação de selos, símbolos e artefatos mágicos' },
    { nome: 'ASTÚCIA', atributo: 'INTELIGÊNCIA', descricao: 'Estratégia, tática, planejamento em combate' }
  ]

  await prisma.feiticeirosOficio.createMany({
    data: oficiosData.map(oficio => ({
      character_id: exampleCharacter.id,
      ...oficio
    }))
  })

  // 7. CRIAR RESISTÊNCIAS (TABELAS CORRETAS)
  console.log('Criando resistências...')
  const resistenciasData = [
    { nome: 'FORTITUDE', atributo: 'CONSTITUIÇÃO', descricao: 'Resistência a efeitos físicos, venenos, doenças' },
    { nome: 'INTEGRIDADE', atributo: 'CONSTITUIÇÃO', descricao: 'Resistência a corrupção, degeneração, decomposição' },
    { nome: 'REFLEXOS', atributo: 'DESTREZA', descricao: 'Esquiva de ataques, explosões, armadilhas' },
    { nome: 'VONTADE', atributo: 'SABEDORIA', descricao: 'Resistência a efeitos mentais, ilusões, controle mental' }
  ]

  await prisma.feiticeirosResistencia.createMany({
    data: resistenciasData.map(resistencia => ({
      character_id: exampleCharacter.id,
      ...resistencia
    }))
  })

  // 8. CRIAR ATAQUES (TABELAS CORRETAS)
  console.log('Criando ataques...')
  const ataquesData = [
    { nome: 'CORPO-A-CORPO', atributo: 'FORÇA', descricao: 'Ataques com armas brancas e combate físico' },
    { nome: 'A DISTÂNCIA', atributo: 'DESTREZA', descricao: 'Ataques com armas de arremesso, arcos, bestas' },
    { nome: 'AMALDIÇOADO', atributo: 'INTELIGÊNCIA', descricao: 'Ataques usando energia amaldiçoada e feitiços' }
  ]

  await prisma.feiticeirosAtaque.createMany({
    data: ataquesData.map(ataque => ({
      character_id: exampleCharacter.id,
      ...ataque
    }))
  })

  // 9. CRIAR CONFIGURAÇÕES DO SISTEMA
  console.log('Criando configurações do sistema...')
  const configData = [
    // Especializações PV
    { name: 'FEITICEIROS_ESPECIALIZACOES_PV', value: JSON.stringify({
      'Lutador': { pv: 12, dadoVida: 'd10' },
      'Especialista em Combate': { pv: 12, dadoVida: 'd10' },
      'Especialista em Técnica': { pv: 10, dadoVida: 'd8' },
      'Controlador': { pv: 10, dadoVida: 'd8' },
      'Suporte': { pv: 10, dadoVida: 'd8' },
      'Restringido': { pv: 16, dadoVida: 'd12' }
    })},
    
    // Especializações PE
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

  console.log('🎉 SISTEMA FEITICEIROS CRIADO COM SUCESSO!')
  console.log('📊 Personagem criado com ID:', exampleCharacter.id)
  console.log('⚡ Atributos criados:', createdAttributes.length)
  console.log('🎯 Perícias criadas:', periciasData.length)
  console.log('🛠️ Ofícios criados:', oficiosData.length)
  console.log('🛡️ Resistências criadas:', resistenciasData.length)
  console.log('⚔️ Ataques criados:', ataquesData.length)
  console.log('⚙️ Configurações salvas:', configData.length)
  console.log('✅ SEED DO FEITICEIROS CONCLUÍDO!')
}

main()
  .catch((error) => {
    console.error('❌ ERRO NO SEED:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })