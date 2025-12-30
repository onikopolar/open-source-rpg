import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  console.log('=== CHARACTER SKILL API ===');
  console.log('Método:', req.method);
  console.log('Body:', req.body);

  if (req.method === 'PUT') {
    try {
      const { characterId, skillId, value } = req.body;
      
      console.log(`PUT - Atualizando skill: characterId=${characterId}, skillId=${skillId}, value=${value}`);
      
      // Converter para números inteiros
      const charId = parseInt(characterId);
      const skId = parseInt(skillId);
      const skillValue = parseInt(value);
      
      if (isNaN(charId) || isNaN(skId) || isNaN(skillValue)) {
        console.log('PUT - Erro: Valores inválidos');
        return res.status(400).json({ error: 'Valores inválidos' });
      }
      
      const result = await prisma.characterSkill.upsert({
        where: {
          character_id_skill_id: {
            character_id: charId,
            skill_id: skId
          }
        },
        update: {
          value: skillValue
        },
        create: {
          character_id: charId,
          skill_id: skId,
          value: skillValue
        }
      });

      console.log(`PUT - Skill atualizada com sucesso: ID=${result.character_id}-${result.skill_id}`);
      return res.status(200).json({ success: true, data: result });
      
    } catch (error) {
      console.error('PUT - Erro ao salvar skill:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    console.log('Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }
}
