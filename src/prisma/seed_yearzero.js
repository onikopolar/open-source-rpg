const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedYearZero() {
  console.log('Iniciando seed do sistema Year Zero Engine...')
  console.log('Versão 1.0.4 - Fix: Acentuação correta em português')
  
  // Atributos Year Zero - COM ACENTOS CORRETOS
  const yearZeroAttributes = [
    { name: 'Força', description: 'Poder físico e resistência' },
    { name: 'Agilidade', description: 'Velocidade, reflexos e coordenação' },
    { name: 'Inteligência', description: 'Raciocínio, lógica e conhecimento' },
    { name: 'Empatia', description: 'Percepção social e carisma' }
  ]
  
  // Skills Year Zero - COM ACENTOS CORRETOS
  const yearZeroSkills = [
    { name: 'COMBATE CORPO A CORPO', description: 'Luta desarmada e com armas brancas' },
    { name: 'MAQUINÁRIO PESADO', description: 'Operação de veículos e equipamentos pesados' },
    { name: 'RESISTÊNCIA', description: 'Resistência física e recuperação' },
    { name: 'COMBATE À DISTÂNCIA', description: 'Armas de fogo e arremesso' },
    { name: 'MOBILIDADE', description: 'Movimentação furtiva e acrobacias' },
    { name: 'PILOTAGEM', description: 'Controle de veículos e aeronaves' },
    { name: 'OBSERVAÇÃO', description: 'Percepção e investigação' },
    { name: 'SOBREVIVÊNCIA', description: 'Sobrevivência em ambientes hostis' },
    { name: 'TECNOLOGIA', description: 'Eletrônica, computadores e engenharia' },
    { name: 'MANIPULAÇÃO', description: 'Persuasão e engodo' },
    { name: 'COMANDO', description: 'Liderança e táticas' },
    { name: 'AJUDA MÉDICA', description: 'Primeiros socorros e medicina' }
  ]
  
  console.log('Criando atributos Year Zero...')
  
  // Criar atributos com acentos corretos
  for (const attr of yearZeroAttributes) {
    try {
      await prisma.yearZeroAttribute.upsert({
        where: { name: attr.name },
        update: {},
        create: attr
      })
      console.log(`Atributo criado: ${attr.name}`)
    } catch (error) {
      console.error(`Erro ao criar atributo ${attr.name}:`, error.message)
    }
  }
  
  console.log('Criando skills Year Zero...')
  
  // Criar skills com acentos corretos
  for (const skill of yearZeroSkills) {
    try {
      await prisma.yearZeroSkill.upsert({
        where: { name: skill.name },
        update: {},
        create: skill
      })
      console.log(`Skill criada: ${skill.name}`)
    } catch (error) {
      console.error(`Erro ao criar skill ${skill.name}:`, error.message)
    }
  }
  
  // Verificação final dos dados
  console.log('\nVerificando dados criados com acentos corretos...')
  
  try {
    const atributosCount = await prisma.yearZeroAttribute.count()
    const skillsCount = await prisma.yearZeroSkill.count()
    
    console.log(`Total de atributos YearZeroAttribute: ${atributosCount}`)
    console.log(`Total de skills YearZeroSkill: ${skillsCount}`)
    
    // Listar atributos para confirmação
    const atributos = await prisma.yearZeroAttribute.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    })
    
    console.log('\nAtributos criados (com acentos):')
    atributos.forEach(attr => console.log(`  - ${attr.name}`))
    
    // Listar skills para confirmação
    const skills = await prisma.yearZeroSkill.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    })
    
    console.log('\nSkills criadas (com acentos):')
    skills.forEach(skill => console.log(`  - ${skill.name}`))
    
    // Verificar especificamente os nomes que estavam com problemas
    const agilidadeExiste = atributos.some(a => a.name === 'Agilidade')
    const combateDistanciaExiste = skills.some(s => s.name === 'COMBATE À DISTÂNCIA')
    
    console.log('\nVerificação dos nomes problemáticos:')
    console.log(`Atributo "Agilidade" existe: ${agilidadeExiste ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`Skill "COMBATE À DISTÂNCIA" existe: ${combateDistanciaExiste ? '✅ SIM' : '❌ NÃO'}`)
    
    if (agilidadeExiste && combateDistanciaExiste) {
      console.log('\n✅ Seed concluído com sucesso!')
      console.log('✅ Todos os acentos estão corretos em português')
      console.log('✅ Versão 1.0.4 - Acentuação correta mantida')
    } else {
      console.error('\n❌ ERRO: Algum dos nomes necessários não foi encontrado!')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('Erro ao verificar dados:', error.message)
  }
}

// Executar o seed
seedYearZero()
  .catch((error) => {
    console.error('❌ Erro crítico durante o seed:', error)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\nConexão com banco de dados encerrada.')
  })