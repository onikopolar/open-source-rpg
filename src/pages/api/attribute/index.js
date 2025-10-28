import { prisma } from '../../../../database';

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
      // Extrai o ID da URL (ex: /api/attribute/43)
      const id = req.url.split('/').pop();

      console.log('DELETE request - URL:', req.url);
      console.log('DELETE request - Extracted ID:', id);

      await prisma.attribute.delete({
        where: { id }
      });

      return res.status(200).json({
        success: true,
        debug: {
          url: req.url,
          extractedId: id,
          method: req.method
        }
      });
    } catch (error) {
      console.log('DELETE Error:', error);
      return res.status(500).json({
        error: 'Erro ao deletar atributo',
        debug: {
          url: req.url,
          extractedId: req.url.split('/').pop(),
          error: error.message
        }
      });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}
