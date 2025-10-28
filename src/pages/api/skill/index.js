import { prisma } from '../../../../database';

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
      // Extrai o ID da URL (ex: /api/skill/43)
      const id = req.url.split('/').pop();
      await prisma.skill.delete({
        where: { id }
      });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar perícia' });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}
