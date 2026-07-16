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

      // Token direto (arrastado/colado, nao veio da biblioteca):
      // parentId='__direct__' -> self-reference para satisfazer a FK
      const ehTokenDireto = parentId === '__direct__';
      // Token de biblioteca: parentId ausente/null -> vai pra biblioteca
      const ehTokenBiblioteca = !parentId || parentId === null;

      // --- ANTI-DUPLICATA: token de biblioteca ---
      // Se ja existe um token com mesmo tokenId e parentId=null, faz UPDATE em vez de CREATE
      if (ehTokenBiblioteca && tokenId) {
        const existente = await prisma.tabletopToken.findFirst({
          where: { tokenId, parentId: null }
        });

        if (existente) {
          const updated = await prisma.tabletopToken.update({
            where: { id: existente.id },
            data: {
              nome: nome || existente.nome,
              imageUrl: imageUrl || existente.imageUrl,
              imageBase64: imageBase64 || existente.imageBase64,
              mimeType: mimeType || existente.mimeType,
              larguraOriginal: larguraOriginal || existente.larguraOriginal,
              alturaOriginal: alturaOriginal || existente.alturaOriginal,
              updatedAt: new Date()
            }
          });
          console.log(`[API] Token biblioteca atualizado (anti-duplicata): ${tokenId} -> ${existente.id}`);
          return res.status(200).json(updated);
        }
      }
      // --- FIM ANTI-DUPLICATA ---

      const parentIdFinal = ehTokenDireto ? null : (parentId || null);

      const maxZIndexToken = await prisma.tabletopToken.findFirst({
        orderBy: { zIndex: 'desc' }
      });
      const novoZIndex = (maxZIndexToken?.zIndex || 0) + 1;

      // Token direto (colado/arrastado do SO): cria DUAS entradas —
      // uma na biblioteca (parentId=null) e uma instância no tabletop.
      // Assim o token aparece nos dois lugares.
      if (ehTokenDireto) {
        // 1. Entrada na biblioteca (parentId=null) — aparece no sidebar
        const tokenBiblio = await prisma.tabletopToken.create({
          data: {
            tokenId: `${tokenId}-biblio`,
            nome: nome || null,
            x: 0,
            y: 0,
            escala: 1,
            larguraOriginal: larguraOriginal || 50,
            alturaOriginal: alturaOriginal || 50,
            invertido: false,
            oculto: false,
            bloqueado: false,
            zIndex: 0,
            imageUrl: imageUrl || null,
            imageBase64: imageBase64 || null,
            mimeType: mimeType || null,
            parentId: null,
          }
        });
        console.log(`[API POST] ✅ Biblioteca criada: id=${tokenBiblio.id} tokenId=${tokenBiblio.tokenId} nome="${tokenBiblio.nome}" parentId=${tokenBiblio.parentId}`);

        // 2. Instância no tabletop (parentId=biblio.id) — aparece no mapa
        const tokenInstancia = await prisma.tabletopToken.create({
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
            parentId: tokenBiblio.id,
          }
        });
        console.log(`[API POST] ✅ Instância criada: id=${tokenInstancia.id} tokenId=${tokenInstancia.tokenId} nome="${tokenInstancia.nome}" parentId=${tokenInstancia.parentId}`);

        return res.status(201).json(tokenInstancia);
      }

      // Token de biblioteca (arrastado da sidebar) ou normal
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
          parentId: parentIdFinal
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