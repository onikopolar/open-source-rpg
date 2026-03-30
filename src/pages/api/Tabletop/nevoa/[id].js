// src/pages/api/Tabletop/nevoa/[idNevoa].js
import { prisma } from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log('[API Tabletop/nevoa/[id]] Método:', req.method, 'ID:', id);

  // PUT - Atualizar uma camada
  if (req.method === 'PUT') {
    try {
      const { x, y, escala, imageData } = req.body;
      
      console.log('[API Tabletop/nevoa/[id]] Atualizando camada:', { id, x, y });
      
      const camada = await prisma.tabletopNevoa.update({
        where: { id },
        data: {
          x: x !== undefined ? x : undefined,
          y: y !== undefined ? y : undefined,
          escala: escala !== undefined ? escala : undefined,
          imageData: imageData !== undefined ? imageData : undefined,
          updatedAt: new Date()
        }
      });
      
      return res.status(200).json(camada);
    } catch (error) {
      console.error('[API Tabletop/nevoa/[id]] Erro no PUT:', error);
      return res.status(500).json({ error: 'Erro ao atualizar camada' });
    }
  }

  // DELETE - Remover uma camada
  if (req.method === 'DELETE') {
    try {
      await prisma.tabletopNevoa.delete({
        where: { id }
      });
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[API Tabletop/nevoa/[id]] Erro no DELETE:', error);
      return res.status(500).json({ error: 'Erro ao deletar camada' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}