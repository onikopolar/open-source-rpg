import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  console.log('=== CHARACTER ATTRIBUTE API ===');
  console.log('Método:', req.method);
  console.log('Body:', req.body);

  if (req.method === 'PUT') {
    try {
      const { characterId, attributeId, value } = req.body;
      
      console.log(`PUT - Atualizando atributo: characterId=${characterId}, attributeId=${attributeId}, value=${value}`);
      
      // Converter para números inteiros
      const charId = parseInt(characterId);
      const attrId = parseInt(attributeId);
      const attributeValue = parseInt(value);
      
      if (isNaN(charId) || isNaN(attrId) || isNaN(attributeValue)) {
        console.log('PUT - Erro: Valores inválidos');
        return res.status(400).json({ error: 'Valores inválidos' });
      }
      
      const result = await prisma.characterAttribute.upsert({
        where: {
          character_id_attribute_id: {
            character_id: charId,
            attribute_id: attrId
          }
        },
        update: {
          value: attributeValue
        },
        create: {
          character_id: charId,
          attribute_id: attrId,
          value: attributeValue
        }
      });

      console.log(`PUT - Atributo atualizado com sucesso: ID=${result.character_id}-${result.attribute_id}`);
      return res.status(200).json({ success: true, data: result });
      
    } catch (error) {
      console.error('PUT - Erro ao salvar atributo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    console.log('Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }
}
