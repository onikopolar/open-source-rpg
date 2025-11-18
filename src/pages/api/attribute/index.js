import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const attributes = await prisma.attribute.findMany({
        orderBy: { name: 'asc' }
      });
      return res.status(200).json(attributes);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar atributos' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      const attribute = await prisma.attribute.create({
        data: { name, description }
      });

      console.log(`[DEBUG] Novo atributo criado: ${attribute.name} (ID: ${attribute.id})`);

      // Vincular o novo atributo a todos os personagens existentes do sistema clássico
      try {
        const classicCharacters = await prisma.character.findMany({
          where: {
            rpg_system: 'classic'
          },
          select: {
            id: true
          }
        });

        console.log(`[DEBUG] Vinculando atributo a ${classicCharacters.length} personagens clássicos`);

        for (const character of classicCharacters) {
          await prisma.characterAttributes.upsert({
            where: {
              character_id_attribute_id: {
                character_id: character.id,
                attribute_id: attribute.id
              }
            },
            update: {}, // Não atualiza se já existir
            create: {
              character_id: character.id,
              attribute_id: attribute.id,
              value: 1 // Valor padrão
            }
          });
        }

        console.log(`[DEBUG] Atributo vinculado com sucesso a ${classicCharacters.length} personagens`);
      } catch (linkError) {
        console.error('[ERROR] Erro ao vincular atributo aos personagens:', linkError);
        // Não falha a criação do atributo, apenas loga o erro
      }

      return res.status(200).json(attribute);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar atributo' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, description } = req.body;
      const attribute = await prisma.attribute.update({
        where: { id },
        data: { name, description }
      });
      return res.status(200).json(attribute);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar atributo' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      console.log('DELETE request - ID:', id);

      const attributeId = parseInt(id, 10);
      await prisma.attribute.delete({
        where: { id: attributeId }
      });

      return res.status(200).json({
        success: true,
        debug: {
          id: id,
          method: req.method
        }
      });
    } catch (error) {
      console.log('DELETE Error:', error);
      return res.status(500).json({
        error: 'Erro ao deletar atributo',
        debug: {
          id: req.query.id,
          error: error.message
        }
      });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}