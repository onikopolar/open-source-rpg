const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando populacao completa do banco de dados...');

  try {
    // Limpar dados existentes para recriar do zero
    console.log('Limpando dados existentes...');
    await prisma.characterSkills.deleteMany();
    await prisma.characterAttributes.deleteMany();
    await prisma.roll.deleteMany();
    await prisma.character.deleteMany();
    await prisma.attribute.deleteMany();
    await prisma.skill.deleteMany();

    // Criar atributos base do sistema RPG
    console.log('Criando atributos...');
    const attributesData = [
      { name: 'Força', description: 'Poder fisico e capacidade de carga' },
      { name: 'Destreza', description: 'Agilidade, reflexos e coordenacao' },
      { name: 'Constituicao', description: 'Vigor, saude e resistencia' },
      { name: 'Inteligencia', description: 'Raciocinio, logica e memoria' },
      { name: 'Sabedoria', description: 'Percepcao, intuicao e discernimento' },
      { name: 'Carisma', description: 'Persuasao, lideranca e presenca' }
    ];

    const createdAttributes = await Promise.all(
      attributesData.map(attr => prisma.attribute.create({ data: attr }))
    );
    console.log('Atributos criados com sucesso');

    // Criar pericias base do sistema RPG
    console.log('Criando pericias...');
    const skillsData = [
      { name: 'Acrobacia', description: 'Movimentos acrobaticos e equilibrio' },
      { name: 'Arcanismo', description: 'Conhecimento arcano e magias' },
      { name: 'Atletismo', description: 'Atividades fisicas e forca' },
      { name: 'Atuacao', description: 'Habilidades artisticas e performaticas' },
      { name: 'Enganacao', description: 'Mentir e ludibriar' },
      { name: 'Furtividade', description: 'Movimento silencioso e esconder' },
      { name: 'Historia', description: 'Conhecimento historico' },
      { name: 'Intimidacao', description: 'Amedrontar e coagir' },
      { name: 'Intuicao', description: 'Percepcao de intencoes' },
      { name: 'Investigacao', description: 'Encontrar pistas e resolver misterios' },
      { name: 'Medicina', description: 'Cuidados medicos e anatomia' },
      { name: 'Natureza', description: 'Conhecimento da natureza' },
      { name: 'Percepcao', description: 'Notar detalhes e perigos' },
      { name: 'Persuasao', description: 'Convencer e negociar' },
      { name: 'Prestidigitacao', description: 'Truques manuais e agilidade' },
      { name: 'Religiao', description: 'Conhecimento religioso' },
      { name: 'Sobrevivencia', description: 'Sobreviver na natureza' }
    ];

    const createdSkills = await Promise.all(
      skillsData.map(skill => prisma.skill.create({ data: skill }))
    );
    console.log('Pericias criadas com sucesso');

    // Criar personagens de exemplo
    console.log('Criando personagens de exemplo...');

    // Personagem 1 - Sistema Classico
    const character1 = await prisma.character.create({
      data: {
        name: 'Aragorn',
        player_name: 'Joao Silva',
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

    // Vincular atributos aos personagens
    console.log('Vinculando atributos aos personagens...');
    const characterAttributes = [];

    for (const character of [character1, character2]) {
      for (const attribute of createdAttributes) {
        // Valores aleatorios entre 8-15 para os atributos
        const attributeValue = Math.floor(Math.random() * 8 + 8).toString();
        
        characterAttributes.push(
          prisma.characterAttributes.create({
            data: {
              character_id: character.id,
              attribute_id: attribute.id,
              value: attributeValue
            }
          })
        );
      }
    }
    await Promise.all(characterAttributes);
    console.log('Atributos vinculados com sucesso');

    // Vincular habilidades aos personagens
    console.log('Vinculando habilidades aos personagens...');
    const characterSkills = [];

    for (const character of [character1, character2]) {
      for (const skill of createdSkills) {
        // Valores aleatorios entre 3-8 para as habilidades
        const skillValue = Math.floor(Math.random() * 6 + 3).toString();
        
        characterSkills.push(
          prisma.characterSkills.create({
            data: {
              character_id: character.id,
              skill_id: skill.id,
              value: skillValue
            }
          })
        );
      }
    }
    await Promise.all(characterSkills);
    console.log('Habilidades vinculadas com sucesso');

    console.log('Populacao do banco concluida com sucesso');
    console.log('IDs dos personagens para teste:');
    console.log('  Personagem 1 (Aragorn - Sistema Classico):', character1.id);
    console.log('  Personagem 2 (Luna - Sistema Year Zero):', character2.id);
    console.log('Acesse: http://localhost:3000/sheet/' + character1.id);

  } catch (error) {
    console.error('Erro durante a populacao do banco:', error);
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
