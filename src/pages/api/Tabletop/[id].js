// src/pages/api/Tabletop/[id].js
import { prisma } from '../../../lib/prisma';
import fs from 'fs';
import path from 'path';

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
        console.log('[API Tabletop/[id]] GET - Token não encontrado, ID:', id);
        return res.status(404).json({ error: 'Token não encontrado' });
      }

      console.log('[API Tabletop/[id]] GET - Token encontrado, ID:', token.id, 'nome:', token.nome);
      return res.status(200).json(token);
    } catch (error) {
      console.error('[API Tabletop/[id]] GET - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar token' });
    }
  }

  // PUT - Atualizar um token
  if (req.method === 'PUT') {
    try {
      const { x, y, escala, invertido, oculto, bloqueado, zIndex } = req.body;

      console.log('[API Tabletop/[id]] PUT - Atualizando token ID:', id);
      console.log('[API Tabletop/[id]] PUT - Dados recebidos:', JSON.stringify({ x, y, escala, invertido, oculto, bloqueado, zIndex }));

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

      console.log('[API Tabletop/[id]] PUT - Token atualizado, ID:', token.id, 'nome:', token.nome);
      return res.status(200).json(token);
    } catch (error) {
      console.error('[API Tabletop/[id]] PUT - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao atualizar token' });
    }
  }

  // DELETE - Remover um token
  if (req.method === 'DELETE') {
    try {
      console.log('[API Tabletop/[id]] DELETE - Iniciando deleção do token ID:', id);

      const token = await prisma.tabletopToken.findUnique({
        where: { id }
      });

      if (!token) {
        console.log('[API Tabletop/[id]] DELETE - Token não encontrado, ID:', id);
        return res.status(404).json({ error: 'Token não encontrado' });
      }

      console.log('[API Tabletop/[id]] DELETE - Token encontrado, nome:', token.nome, 'imageUrl:', token.imageUrl);

      if (token.imageUrl) {
        const filePath = path.join(process.cwd(), 'public', token.imageUrl);
        console.log('[API Tabletop/[id]] DELETE - Caminho do arquivo:', filePath);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('[API Tabletop/[id]] DELETE - Arquivo deletado:', filePath);
        } else {
          console.log('[API Tabletop/[id]] DELETE - Arquivo não encontrado:', filePath);
        }
      } else {
        console.log('[API Tabletop/[id]] DELETE - Token sem imageUrl, pulando deleção de arquivo');
      }

      await prisma.tabletopToken.delete({
        where: { id }
      });

      console.log('[API Tabletop/[id]] DELETE - Registro deletado do banco, ID:', id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[API Tabletop/[id]] DELETE - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao deletar token' });
    }
  }

  console.log('[API Tabletop/[id]] Método não permitido:', req.method);
  return res.status(405).json({ error: 'Método não permitido' });
}