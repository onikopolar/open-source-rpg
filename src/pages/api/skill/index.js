import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const skills = await prisma.skill.findMany({
        orderBy: { name: 'asc' }
      });
      return res.status(200).json(skills);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar perícias' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      const skill = await prisma.skill.create({
        data: { name, description }
      });

      console.log(`[DEBUG] Nova perícia criada: ${skill.name} (ID: ${skill.id})`);

      // Vincular a nova perícia a todos os personagens existentes do sistema clássico
      try {
        const classicCharacters = await prisma.character.findMany({
          where: {
            rpg_system: 'classic'
          },
          select: {
            id: true
          }
        });

        console.log(`[DEBUG] Vinculando perícia a ${classicCharacters.length} personagens clássicos`);

        for (const character of classicCharacters) {
          await prisma.characterSkills.upsert({
            where: {
              character_id_skill_id: {
                character_id: character.id,
                skill_id: skill.id
              }
            },
            update: {}, // Não atualiza se já existir
            create: {
              character_id: character.id,
              skill_id: skill.id,
              value: 0 // Valor padrão
            }
          });
        }

        console.log(`[DEBUG] Perícia vinculada com sucesso a ${classicCharacters.length} personagens`);
      } catch (linkError) {
        console.error('[ERROR] Erro ao vincular perícia aos personagens:', linkError);
        // Não falha a criação da perícia, apenas loga o erro
      }

      return res.status(200).json(skill);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar perícia' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, description } = req.body;
      const skill = await prisma.skill.update({
        where: { id },
        data: { name, description }
      });
      return res.status(200).json(skill);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar perícia' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      console.log('DELETE request - ID:', id);

      const skillId = parseInt(id, 10);
      await prisma.skill.delete({
        where: { id: skillId }
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar perícia: ' + error.message });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}