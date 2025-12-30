import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  console.log('=== ATTRIBUTE API ===');
  console.log('Método:', req.method);
  console.log('Body:', req.body);

  if (req.method === 'GET') {
    try {
      const attributes = await prisma.attribute.findMany({
        orderBy: { name: 'asc' }
      });
      console.log(`GET - ${attributes.length} atributos encontrados`);
      
      // Log detalhado dos atributos
      attributes.forEach((attr, i) => {
        console.log(`  ${i+1}. ${attr.name} (ID: ${attr.id})`);
      });
      
      return res.status(200).json(attributes);
    } catch (error) {
      console.error('GET - Erro:', error);
      return res.status(500).json({ error: 'Erro ao buscar atributos' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Nome do atributo é obrigatório' });
      }
      
      console.log(`POST - Criando atributo: "${name}"`);
      
      const attribute = await prisma.attribute.create({
        data: { name, description }
      });

      console.log(`POST - Atributo criado: "${attribute.name}" (ID: ${attribute.id})`);

      // Vincular o novo atributo a todos os personagens existentes do sistema clássico
      try {
        const classicCharacters = await prisma.character.findMany({
          where: {
            rpg_system: 'classic'
          },
          select: {
            id: true,
            name: true
          }
        });

        console.log(`POST - Personagens classicos encontrados: ${classicCharacters.length}`);
        classicCharacters.forEach((char, i) => {
          console.log(`  ${i+1}. ${char.name} (ID: ${char.id})`);
        });

        console.log(`POST - Vincular atributo "${attribute.name}" a ${classicCharacters.length} personagens`);

        let vinculados = 0;
        for (const character of classicCharacters) {
          try {
            const result = await prisma.characterAttribute.upsert({
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
            vinculados++;
            console.log(`  ✓ Vinculado a ${character.name} (ID: ${character.id})`);
          } catch (charError) {
            console.error(`  ✗ Erro ao vincular a ${character.name}:`, charError.message);
          }
        }

        console.log(`POST - Atributo vinculado com sucesso a ${vinculados}/${classicCharacters.length} personagens`);
      } catch (linkError) {
        console.error('POST - Erro geral ao vincular atributo aos personagens:', linkError);
        // Não falha a criação do atributo, apenas loga o erro
      }

      return res.status(200).json(attribute);
    } catch (error) {
      console.error('POST - Erro:', error);
      return res.status(500).json({ error: 'Erro ao criar atributo' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, description } = req.body;
      console.log(`PUT - Atualizando atributo ID: ${id}`);
      
      const attribute = await prisma.attribute.update({
        where: { id },
        data: { name, description }
      });
      
      console.log(`PUT - Atributo atualizado: ${attribute.name}`);
      return res.status(200).json(attribute);
    } catch (error) {
      console.error('PUT - Erro:', error);
      return res.status(500).json({ error: 'Erro ao atualizar atributo' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      console.log('DELETE - ID do atributo:', id);

      const attributeId = parseInt(id, 10);
      await prisma.attribute.delete({
        where: { id: attributeId }
      });

      console.log('DELETE - Atributo deletado com sucesso');
      return res.status(200).json({
        success: true,
        message: 'Atributo deletado com sucesso'
      });
    } catch (error) {
      console.log('DELETE - Erro:', error);
      return res.status(500).json({
        error: 'Erro ao deletar atributo'
      });
    }
  }

  console.log('Método não permitido:', req.method);
  res.status(404).json({ error: 'Método não permitido' });
}
