import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const updatedCharacter = await prisma.character.update({
        where: { id: parseInt(id) },
        data: { name }
      });

      return res.status(200).json(updatedCharacter);
    } catch (error) {
      console.error('Erro ao atualizar personagem:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.character.delete({
        where: { id: parseInt(id) }
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar personagem:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}
