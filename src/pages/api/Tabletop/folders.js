// src/pages/api/Tabletop/folders.js
import { prisma } from '../../../lib/prisma';

const CONFIG_KEY = 'token_library_folders';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const config = await prisma.config.findUnique({ where: { name: CONFIG_KEY } });
      const folders = config?.value ? JSON.parse(config.value) : [];
      return res.status(200).json(folders);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao carregar pastas' });
    }
  }

  if (req.method === 'POST') {
    try {
      const folders = req.body;
      const value = JSON.stringify(folders);
      await prisma.config.upsert({
        where: { name: CONFIG_KEY },
        update: { value },
        create: { name: CONFIG_KEY, value },
      });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao salvar pastas' });
    }
  }

  return res.status(405).json({ error: 'Metodo nao permitido' });
}
