import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { key } = req.query;

  if (req.method === 'PUT') {
    try {
      const { value } = req.body;

      const config = await prisma.config.upsert({
        where: { name: key },
        update: { value },
        create: {
          name: key,
          value
        }
      });

      return res.status(200).json({
        success: true,
        message: `Config ${key} atualizada com sucesso`,
        value: config.value
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      return res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
  }

  if (req.method === 'GET') {
    try {
      const config = await prisma.config.findUnique({
        where: { name: key }
      });

      if (!config) {
        return res.status(404).json({ error: 'Configuração não encontrada' });
      }

      return res.status(200).json(config);
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return res.status(500).json({ error: 'Erro ao buscar configuração' });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}