import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALLOWED_METHODS = ['GET', 'PUT', 'DELETE'];

const validateCharacterId = (id) => {
  if (!id || isNaN(Number(id))) {
    return { isValid: false, error: 'ID do personagem inválido' };
  }
  return { isValid: true, id: Number(id) };
};

const buildUpdateData = (body) => {
  const {
    name,
    player_name,
    age,
    gender,
    description,
    current_hit_points,
    max_hit_points,
    current_picture,
    standard_character_picture_url,
    injured_character_picture_url,
    rpg_system
  } = body;

  const updateData = {};

  // Campos de texto
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Nome do personagem é obrigatório');
    }
    updateData.name = name.trim();
  }

  if (player_name !== undefined) updateData.player_name = player_name;
  if (gender !== undefined) updateData.gender = gender;
  if (description !== undefined) updateData.description = description;
  if (rpg_system !== undefined) updateData.rpg_system = rpg_system;

  // Campos numéricos
  if (age !== undefined) {
    if (age === '') {
      updateData.age = null;
    } else {
      const ageValue = parseInt(age);
      if (isNaN(ageValue) || ageValue < 0) {
        throw new Error('Idade deve ser um número válido');
      }
      updateData.age = ageValue;
    }
  }

  if (current_hit_points !== undefined) {
    const hpValue = parseInt(current_hit_points);
    if (isNaN(hpValue) || hpValue < 0) {
      throw new Error('Pontos de vida atuais devem ser um número válido');
    }
    updateData.current_hit_points = hpValue;
  }

  if (max_hit_points !== undefined) {
    const maxHpValue = parseInt(max_hit_points);
    if (isNaN(maxHpValue) || maxHpValue < 0) {
      throw new Error('Pontos de vida máximos devem ser um número válido');
    }
    updateData.max_hit_points = maxHpValue;
  }

  if (current_picture !== undefined) {
    const pictureValue = parseInt(current_picture);
    if (isNaN(pictureValue) || pictureValue < 1) {
      throw new Error('Imagem atual deve ser um número válido maior que 0');
    }
    updateData.current_picture = pictureValue;
  }

  // Campos de URL
  if (standard_character_picture_url !== undefined) {
    updateData.standard_character_picture_url = standard_character_picture_url;
  }

  if (injured_character_picture_url !== undefined) {
    updateData.injured_character_picture_url = injured_character_picture_url;
  }

  // Validação de consistência entre current_hit_points e max_hit_points
  if (updateData.current_hit_points !== undefined && updateData.max_hit_points !== undefined) {
    if (updateData.current_hit_points > updateData.max_hit_points) {
      throw new Error('Pontos de vida atuais não podem ser maiores que os pontos de vida máximos');
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('Nenhum dado válido fornecido para atualização');
  }

  return updateData;
};

const handleGetCharacter = async (id) => {
  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      attributes: {
        include: {
          attribute: true
        }
      },
      skills: {
        include: {
          skill: true
        }
      }
    }
  });

  if (!character) {
    throw new Error('Personagem não encontrado');
  }

  return character;
};

const handleDeleteCharacter = async (id) => {
  // Verificar se o personagem existe antes de deletar
  const existingCharacter = await prisma.character.findUnique({
    where: { id }
  });

  if (!existingCharacter) {
    throw new Error('Personagem não encontrado');
  }

  // Executar transação para deletar todas as dependências
  const deleteRolls = prisma.roll.deleteMany({
    where: { character_id: id }
  });

  const deleteAttributes = prisma.characterAttributes.deleteMany({
    where: { character_id: id }
  });

  const deleteSkills = prisma.characterSkills.deleteMany({
    where: { character_id: id }
  });

  const deleteCharacter = prisma.character.delete({
    where: { id }
  });

  await prisma.$transaction([
    deleteRolls,
    deleteAttributes,
    deleteSkills,
    deleteCharacter
  ]);

  return { success: true, message: 'Personagem deletado com sucesso' };
};

const handleUpdateCharacter = async (id, body) => {
  const updateData = buildUpdateData(body);

  // Verificar se o personagem existe antes de atualizar
  const existingCharacter = await prisma.character.findUnique({
    where: { id }
  });

  if (!existingCharacter) {
    throw new Error('Personagem não encontrado');
  }

  // Validação adicional para pontos de vida se apenas um dos campos foi atualizado
  if (updateData.current_hit_points !== undefined && !updateData.max_hit_points) {
    if (updateData.current_hit_points > existingCharacter.max_hit_points) {
      throw new Error('Pontos de vida atuais não podem ser maiores que os pontos de vida máximos existentes');
    }
  }

  if (updateData.max_hit_points !== undefined && !updateData.current_hit_points) {
    if (existingCharacter.current_hit_points > updateData.max_hit_points) {
      updateData.current_hit_points = updateData.max_hit_points;
    }
  }

  const character = await prisma.character.update({
    where: { id },
    data: updateData
  });

  return character;
};

export default async function handler(req, res) {
  const { method } = req;

  // Validar método HTTP
  if (!ALLOWED_METHODS.includes(method)) {
    return res.status(405).json({
      error: 'Método não permitido',
      allowedMethods: ALLOWED_METHODS
    });
  }

  // Validar ID do personagem
  const validation = validateCharacterId(req.query.id);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  const characterId = validation.id;

  try {
    let result;

    switch (method) {
      case 'GET':
        result = await handleGetCharacter(characterId);
        return res.status(200).json(result);

      case 'DELETE':
        result = await handleDeleteCharacter(characterId);
        return res.status(200).json(result);

      case 'PUT':
        if (!req.body || typeof req.body !== 'object') {
          return res.status(400).json({ error: 'Corpo da requisição inválido' });
        }
        result = await handleUpdateCharacter(characterId, req.body);
        return res.status(200).json(result);

      default:
        return res.status(405).json({
          error: 'Método não permitido',
          allowedMethods: ALLOWED_METHODS
        });
    }

  } catch (error) {
    console.error(`Erro na API do personagem [${method}]:`, error);

    // Tratamento de erros específicos do Prisma
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Personagem não encontrado' });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Conflito de dados único' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Violação de chave estrangeira' });
    }

    // Tratamento de erros de validação customizados
    if (error.message.includes('obrigatório') || 
        error.message.includes('deve ser') || 
        error.message.includes('não podem')) {
      return res.status(400).json({ error: error.message });
    }

    // Erro genérico
    const errorResponse = {
      error: 'Erro interno do servidor',
      requestId: req.headers['x-request-id'] || null
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.message;
      errorResponse.stack = error.stack;
    }

    return res.status(500).json(errorResponse);
  } finally {
    await prisma.$disconnect();
  }
}
