// src/pages/api/Tabletop/tokens.js
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  console.log('[API Tabletop/tokens] Método:', req.method);

  // GET - Buscar tokens da biblioteca (apenas templates, sem instâncias)
  if (req.method === 'GET') {
    try {
      console.log('[API Tabletop/tokens] GET - Buscando tokens com parentId = null');
      
      const tokens = await prisma.tabletopToken.findMany({
        where: {
          parentId: null
        },
        orderBy: { zIndex: 'asc' }
      });
      
      console.log('[API Tabletop/tokens] GET - Tokens encontrados:', tokens.length);
      console.log('[API Tabletop/tokens] GET - Lista de tokens:', tokens.map(t => ({
        id: t.id,
        nome: t.nome,
        imageUrl: t.imageUrl,
        parentId: t.parentId
      })));
      
      return res.status(200).json(tokens);
    } catch (error) {
      console.error('[API Tabletop/tokens] GET - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar tokens' });
    }
  }

  // POST - Criar um novo token (pode ser template ou instância)
  if (req.method === 'POST') {
    try {
      const { 
        tokenId, nome, x, y, escala, larguraOriginal, alturaOriginal,
        invertido, oculto, bloqueado, imageUrl, imageBase64, mimeType,
        parentId
      } = req.body;
      
      console.log('[API Tabletop/tokens] POST - Criando token');
      console.log('[API Tabletop/tokens] POST - Dados recebidos:', JSON.stringify({
        tokenId, nome, x, y, escala, larguraOriginal, alturaOriginal,
        invertido, oculto, bloqueado, imageUrl, parentId
      }));
      
      const maxZIndexToken = await prisma.tabletopToken.findFirst({
        orderBy: { zIndex: 'desc' }
      });
      const novoZIndex = (maxZIndexToken?.zIndex || 0) + 1;
      console.log('[API Tabletop/tokens] POST - novoZIndex calculado:', novoZIndex);
      
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
          zIndex: novoZIndex,
          imageUrl: imageUrl || null,
          imageBase64: imageBase64 || null,
          mimeType: mimeType || null,
          parentId: parentId || null
        }
      });
      
      console.log('[API Tabletop/tokens] POST - Token criado, ID:', token.id, 'parentId:', token.parentId);
      console.log('[API Tabletop/tokens] POST - imageUrl salva:', token.imageUrl);
      
      return res.status(201).json(token);
    } catch (error) {
      console.error('[API Tabletop/tokens] POST - Erro:', error.message);
      return res.status(500).json({ error: 'Erro ao criar token' });
    }
  }

  console.log('[API Tabletop/tokens] Método não permitido:', req.method);
  return res.status(405).json({ error: 'Método não permitido' });
}