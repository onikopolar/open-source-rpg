const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando população completa do banco de dados...');

  try {
    // Limpar dados existentes para recriar do zero - ORDEM CORRETA
    console.log('Limpando dados existentes...');
    
    // Primeiro limpar as tabelas de junção
    await prisma.yearZeroSkills.deleteMany();
    await prisma.yearZeroAttributes.deleteMany();
    await prisma.characterSkills.deleteMany();
    await prisma.characterAttributes.deleteMany();
    await prisma.roll.deleteMany();
    
    // Depois limpar as tabelas principais
    await prisma.character.deleteMany();
    await prisma.yearZeroSkill.deleteMany();
    await prisma.yearZeroAttribute.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.attribute.deleteMany();

    // Criar atributos base do sistema CLÁSSICO (para dashboard)
    console.log('Criando atributos clássicos...');
    const classicAttributesData = [
      { name: 'Força', description: 'Poder físico e capacidade de carga' },
      { name: 'Destreza', description: 'Agilidade, reflexos e coordenação' },
      { name: 'Constituição', description: 'Vigor, saúde e resistência' },
      { name: 'Inteligência', description: 'Raciocínio, lógica e memória' },
      { name: 'Sabedoria', description: 'Percepção, intuição e discernimento' },
      { name: 'Carisma', description: 'Persuasão, liderança e presença' }
    ];

    const createdClassicAttributes = await Promise.all(
      classicAttributesData.map(attr => prisma.attribute.create({ data: attr }))
    );
    console.log('Atributos clássicos criados com sucesso');

    // Criar atributos FIXOS do sistema YEAR ZERO (Alien RPG)
    console.log('Criando atributos Year Zero fixos...');
    const yearZeroAttributesData = [
      { name: 'FORÇA', description: 'Poder físico, capacidade de carga e combate corpo a corpo' },
      { name: 'AGILIDADE', description: 'Agilidade, reflexos, coordenação e combate à distância' },
      { name: 'RACIOCÍNIO', description: 'Raciocínio, percepção, lógica e sobrevivência' },
      { name: 'EMPATIA', description: 'Empatia, persuasão, liderança e cuidados médicos' }
    ];

    const createdYearZeroAttributes = await Promise.all(
      yearZeroAttributesData.map(attr => prisma.yearZeroAttribute.create({ data: attr }))
    );
    console.log('Atributos Year Zero fixos criados com sucesso');

    // Criar perícias base do sistema CLÁSSICO (para dashboard)
    console.log('Criando perícias clássicas...');
    const classicSkillsData = [
      { name: 'Acrobacia', description: 'Movimentos acrobáticos e equilíbrio' },
      { name: 'Arcanismo', description: 'Conhecimento arcano e magias' },
      { name: 'Atletismo', description: 'Atividades físicas e força' },
      { name: 'Atuação', description: 'Habilidades artísticas e performáticas' },
      { name: 'Enganação', description: 'Mentir e ludibriar' },
      { name: 'Furtividade', description: 'Movimento silencioso e esconder' },
      { name: 'História', description: 'Conhecimento histórico' },
      { name: 'Intimidação', description: 'Amedrontar e coagir' },
      { name: 'Intuição', description: 'Percepção de intenções' },
      { name: 'Investigação', description: 'Encontrar pistas e resolver mistérios' },
      { name: 'Medicina', description: 'Cuidados médicos e anatomia' },
      { name: 'Natureza', description: 'Conhecimento da natureza' },
      { name: 'Percepção', description: 'Notar detalhes e perigos' },
      { name: 'Persuasão', description: 'Convencer e negociar' },
      { name: 'Prestidigitação', description: 'Truques manuais e agilidade' },
      { name: 'Religião', description: 'Conhecimento religioso' },
      { name: 'Sobrevivência', description: 'Sobreviver na natureza' }
    ];

    const createdClassicSkills = await Promise.all(
      classicSkillsData.map(skill => prisma.skill.create({ data: skill }))
    );
    console.log('Perícias clássicas criadas com sucesso');

    // Criar perícias FIXAS do sistema YEAR ZERO (Alien RPG)
    console.log('Criando perícias Year Zero fixas...');
    const yearZeroSkillsData = [
      // FORÇA
      { name: 'Combate Corpo a Corpo', description: 'Lutas, armas brancas e combate próximo' },
      { name: 'Maquinário Pesado', description: 'Operação de equipamentos pesados e veículos' },
      { name: 'Resistência', description: 'Vigor físico e tolerância à fadiga' },
      
      // AGILIDADE
      { name: 'Combate à Distância', description: 'Armas de fogo e projéteis' },
      { name: 'Mobilidade', description: 'Movimentação ágil e evasão' },
      { name: 'Pilotagem', description: 'Controle de veículos e naves' },
      
      // RACIOCÍNIO
      { name: 'Observação', description: 'Percepção de detalhes e perigos' },
      { name: 'Sobrevivência', description: 'Adaptação a ambientes hostis' },
      { name: 'Tecnologia', description: 'Sistemas computacionais e eletrônicos' },
      
      // EMPATIA
      { name: 'Manipulação', description: 'Persuasão e influência psicológica' },
      { name: 'Comando', description: 'Liderança e tomada de decisões' },
      { name: 'Cuidados Médicos', description: 'Primeiros socorros e tratamento médico' }
    ];

    const createdYearZeroSkills = await Promise.all(
      yearZeroSkillsData.map(skill => prisma.yearZeroSkill.create({ data: skill }))
    );
    console.log('Perícias Year Zero fixas criadas com sucesso');

    // Criar personagens de exemplo
    console.log('Criando personagens de exemplo...');

    // Personagem 1 - Sistema Clássico
    const character1 = await prisma.character.create({
      data: {
        name: 'Aragorn',
        player_name: 'João Silva',
        age: 35,
        gender: 'Masculino',
        rpg_system: 'classic',
        current_hit_points: 45,
        max_hit_points: 45,
        standard_character_picture_url: '/assets/user.png'
      }
    });

    // Personagem 2 - Sistema Year Zero
    const character2 = await prisma.character.create({
      data: {
        name: 'Luna',
        player_name: 'Maria Santos',
        age: 28,
        gender: 'Feminino',
        rpg_system: 'yearzero',
        current_hit_points: 32,
        max_hit_points: 32,
        standard_character_picture_url: '/assets/user.png'
      }
    });

    console.log('Personagens criados com sucesso');

    // Vincular atributos CLÁSSICOS ao personagem clássico
    console.log('Vinculando atributos clássicos...');
    const classicCharacterAttributes = [];

    for (const attribute of createdClassicAttributes) {
      const attributeValue = Math.floor(Math.random() * 8 + 8);
      classicCharacterAttributes.push(
        prisma.characterAttributes.create({
          data: {
            character_id: character1.id,
            attribute_id: attribute.id,
            value: attributeValue
          }
        })
      );
    }
    await Promise.all(classicCharacterAttributes);
    console.log('Atributos clássicos vinculados com sucesso');

    // Vincular atributos YEAR ZERO ao personagem year zero
    console.log('Vinculando atributos Year Zero...');
    const yearZeroCharacterAttributes = [];

    for (const attribute of createdYearZeroAttributes) {
      const attributeValue = Math.floor(Math.random() * 3 + 2); // Year Zero: 2-4
      yearZeroCharacterAttributes.push(
        prisma.yearZeroAttributes.create({
          data: {
            character_id: character2.id,
            attribute_id: attribute.id,
            value: attributeValue
          }
        })
      );
    }
    await Promise.all(yearZeroCharacterAttributes);
    console.log('Atributos Year Zero vinculados com sucesso');

    // Vincular perícias CLÁSSICAS ao personagem clássico
    console.log('Vinculando perícias clássicas...');
    const classicCharacterSkills = [];

    for (const skill of createdClassicSkills) {
      const skillValue = Math.floor(Math.random() * 6 + 3);
      classicCharacterSkills.push(
        prisma.characterSkills.create({
          data: {
            character_id: character1.id,
            skill_id: skill.id,
            value: skillValue
          }
        })
      );
    }
    await Promise.all(classicCharacterSkills);
    console.log('Perícias clássicas vinculadas com sucesso');

    // Vincular perícias YEAR ZERO ao personagem year zero
    console.log('Vinculando perícias Year Zero...');
    const yearZeroCharacterSkills = [];

    for (const skill of createdYearZeroSkills) {
      const skillValue = Math.floor(Math.random() * 3 + 1); // Year Zero: 1-3
      yearZeroCharacterSkills.push(
        prisma.yearZeroSkills.create({
          data: {
            character_id: character2.id,
            skill_id: skill.id,
            value: skillValue
          }
        })
      );
    }
    await Promise.all(yearZeroCharacterSkills);
    console.log('Perícias Year Zero vinculadas com sucesso');

    console.log('População do banco concluída com sucesso');
    console.log('IDs dos personagens para teste:');
    console.log('  Personagem 1 (Aragorn - Sistema Clássico):', character1.id);
    console.log('  Personagem 2 (Luna - Sistema Year Zero):', character2.id);
    console.log('Acesse: http://localhost:3000/sheet/' + character1.id);

  } catch (error) {
    console.error('Erro durante a população do banco:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });