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
      const { x, y, escala, invertido, oculto, bloqueado, zIndex, rotacao, nome } = req.body;

      const updateData = {
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(escala !== undefined && { escala }),
        ...(invertido !== undefined && { invertido }),
        ...(oculto !== undefined && { oculto }),
        ...(bloqueado !== undefined && { bloqueado }),
        ...(zIndex !== undefined && { zIndex }),
        ...(rotacao !== undefined && { rotacao }),
        ...(nome !== undefined && { nome }),
        updatedAt: new Date()
      };

      const token = await prisma.tabletopToken.update({
        where: { id },
        data: updateData
      });

      // Se renomeou um token de biblioteca (parentId=null), propaga o nome
      // para todas as instâncias filhas no tabletop.
      if (nome !== undefined && token.parentId === null) {
        await prisma.tabletopToken.updateMany({
          where: { parentId: id },
          data: { nome, updatedAt: new Date() }
        });
      }

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

      // Só deleta o arquivo se for token de biblioteca (parentId=null).
      // Instâncias compartilham o arquivo com o token original.
      if (token.imageUrl && token.parentId === null) {
        const filePath = path.join(process.cwd(), 'public', token.imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await prisma.tabletopToken.delete({
        where: { id }
      });

      return res.status(200).json({ success: true, deletedParentId: token.parentId });
    } catch (error) {
      console.error('[API Tabletop/[id]] DELETE - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao deletar token' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}