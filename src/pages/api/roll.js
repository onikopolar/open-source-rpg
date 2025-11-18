import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { character_id, max_number, rolled_number } = req.body;

      const roll = await prisma.roll.create({
        data: {
          character_id,
          max_number,
          rolled_number
        }
      });

      return res.status(200).json(roll);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao salvar rolagem' });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}