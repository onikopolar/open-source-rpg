// src/pages/api/Tabletop/tokens.js
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const tokens = await prisma.tabletopToken.findMany({
        where: {
          parentId: null
        },
        orderBy: { zIndex: 'asc' }
      });
      
      return res.status(200).json(tokens);
    } catch (error) {
      console.error('[API Tabletop/tokens] GET - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar tokens' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        tokenId, nome, x, y, escala, larguraOriginal, alturaOriginal,
        invertido, oculto, bloqueado, rotacao, imageUrl, imageBase64, mimeType,
        parentId
      } = req.body;

      const maxZIndexToken = await prisma.tabletopToken.findFirst({
        orderBy: { zIndex: 'desc' }
      });
      const novoZIndex = (maxZIndexToken?.zIndex || 0) + 1;

      const rotacaoFinal = rotacao !== undefined ? Number(rotacao) : 0;

      const token = await prisma.tabletopToken.create({
        data: {
          tokenId,
          nome: nome || null,
          x,
          y,
          escala: escala || 1,
          larguraOriginal: larguraOriginal || 50,
          alturaOriginal: alturaOriginal || 50,
          invertido: invertido || false,
          oculto: oculto || false,
          bloqueado: bloqueado || false,
          ...(rotacao !== undefined && { rotacao: Number(rotacao) }),
          zIndex: novoZIndex,
          imageUrl: imageUrl || null,
          imageBase64: imageBase64 || null,
          mimeType: mimeType || null,
          parentId: parentId || null
        }
      });

      return res.status(201).json(token);
    } catch (error) {
      console.error('[API Tabletop/tokens] POST - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao criar token' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}