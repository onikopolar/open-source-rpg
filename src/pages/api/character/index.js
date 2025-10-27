import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  console.log('=== CHARACTER API CALL ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method === 'POST') {
    try {
      const { name } = req.body;
      console.log('Creating character with name:', name);

      if (!name) {
        console.log('Error: Name is required');
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const newCharacter = await prisma.character.create({
        data: { name }
      });

      console.log('Character created successfully:', newCharacter);
      return res.status(200).json(newCharacter);

    } catch (error) {
      console.error('Error creating character:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'GET') {
    try {
      console.log('Fetching all characters');
      const characters = await prisma.character.findMany({
        orderBy: { name: 'asc' }
      });
      
      console.log('Characters fetched:', characters.length);
      return res.status(200).json(characters);

    } catch (error) {
      console.error('Error fetching characters:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  console.log('Method not allowed:', req.method);
  res.status(404).json({ error: 'Método não permitido' });
}
