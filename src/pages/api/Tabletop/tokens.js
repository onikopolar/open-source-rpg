// src/pages/api/Tabletop/tokens.js
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  console.log('[API Tabletop/tokens] Método:', req.method);

  // GET - Buscar todos os tokens
  if (req.method === 'GET') {
    try {
      console.log('[API Tabletop/tokens] Buscando todos os tokens');
      
      const tokens = await prisma.tabletopToken.findMany({
        orderBy: { zIndex: 'asc' }
      });
      
      console.log(`[API Tabletop/tokens] ${tokens.length} tokens encontrados`);
      
      return res.status(200).json(tokens);
    } catch (error) {
      console.error('[API Tabletop/tokens] Erro no GET:', error);
      return res.status(500).json({ error: 'Erro ao buscar tokens' });
    }
  }

  // POST - Criar um novo token
  if (req.method === 'POST') {
    try {
      const { 
        tokenId, nome, x, y, escala, larguraOriginal, alturaOriginal,
        invertido, oculto, bloqueado, imageUrl, imageBase64, mimeType 
      } = req.body;
      
      console.log('[API Tabletop/tokens] Criando token:', { tokenId, nome, x, y });
      
      // Buscar o maior zIndex atual
      const maxZIndexToken = await prisma.tabletopToken.findFirst({
        orderBy: { zIndex: 'desc' }
      });
      const novoZIndex = (maxZIndexToken?.zIndex || 0) + 1;
      
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
          mimeType: mimeType || null
        }
      });
      
      console.log('[API Tabletop/tokens] Token criado com ID:', token.id);
      
      return res.status(201).json(token);
    } catch (error) {
      console.error('[API Tabletop/tokens] Erro no POST:', error);
      return res.status(500).json({ error: 'Erro ao criar token' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}