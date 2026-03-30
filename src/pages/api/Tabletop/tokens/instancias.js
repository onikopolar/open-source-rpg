import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const instances = await prisma.tabletopToken.findMany({
      where: { parentId: { not: null } },
      orderBy: { zIndex: 'asc' }
    });
    res.status(200).json(instances);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar instâncias' });
  }
}