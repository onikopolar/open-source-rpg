// src/pages/api/Tabletop/[id].js
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log('[API Tabletop/[id]] Método:', req.method, 'ID:', id);

  // GET - Buscar um token específico
  if (req.method === 'GET') {
    try {
      const token = await prisma.tabletopToken.findUnique({
        where: { id }
      });
      
      if (!token) {
        return res.status(404).json({ error: 'Token não encontrado' });
      }
      
      return res.status(200).json(token);
    } catch (error) {
      console.error('[API Tabletop/[id]] Erro no GET:', error);
      return res.status(500).json({ error: 'Erro ao buscar token' });
    }
  }

  // PUT - Atualizar um token
  if (req.method === 'PUT') {
    try {
      const { x, y, escala, invertido, oculto, bloqueado, zIndex } = req.body;
      
      console.log('[API Tabletop/[id]] Atualizando token:', { id, x, y, escala, zIndex });
      
      const token = await prisma.tabletopToken.update({
        where: { id },
        data: {
          x: x !== undefined ? x : undefined,
          y: y !== undefined ? y : undefined,
          escala: escala !== undefined ? escala : undefined,
          invertido: invertido !== undefined ? invertido : undefined,
          oculto: oculto !== undefined ? oculto : undefined,
          bloqueado: bloqueado !== undefined ? bloqueado : undefined,
          zIndex: zIndex !== undefined ? zIndex : undefined,
          updatedAt: new Date()
        }
      });
      
      console.log('[API Tabletop/[id]] Token atualizado');
      
      return res.status(200).json(token);
    } catch (error) {
      console.error('[API Tabletop/[id]] Erro no PUT:', error);
      return res.status(500).json({ error: 'Erro ao atualizar token' });
    }
  }

  // DELETE - Remover um token
  if (req.method === 'DELETE') {
    try {
      console.log('[API Tabletop/[id]] Deletando token:', id);
      
      await prisma.tabletopToken.delete({
        where: { id }
      });
      
      console.log('[API Tabletop/[id]] Token deletado');
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[API Tabletop/[id]] Erro no DELETE:', error);
      return res.status(500).json({ error: 'Erro ao deletar token' });
    }
  }

  // Método não permitido
  return res.status(405).json({ error: 'Método não permitido' });
}