import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const skillId = parseInt(id, 10);
      await prisma.skill.delete({
        where: { id: skillId }
      });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar perícia: ' + error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;
      const skillId = parseInt(id, 10);
      const skill = await prisma.skill.update({
        where: { id: skillId },
        data: { name, description }
      });
      return res.status(200).json(skill);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar perícia: ' + error.message });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}