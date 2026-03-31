// src/pages/api/Tabletop/[id].js
import { prisma } from '../../../lib/prisma';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { id } = req.query;

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
      console.error('[API Tabletop/[id]] GET - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar token' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { x, y, escala, invertido, oculto, bloqueado, zIndex } = req.body;

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

      return res.status(200).json(token);
    } catch (error) {
      console.error('[API Tabletop/[id]] PUT - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao atualizar token' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const token = await prisma.tabletopToken.findUnique({
        where: { id }
      });

      if (!token) {
        return res.status(404).json({ error: 'Token não encontrado' });
      }

      if (token.imageUrl) {
        const filePath = path.join(process.cwd(), 'public', token.imageUrl);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await prisma.tabletopToken.delete({
        where: { id }
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[API Tabletop/[id]] DELETE - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao deletar token' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}