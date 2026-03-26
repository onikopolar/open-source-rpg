// src/pages/api/Tabletop/nevoa.js
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  console.log('[API Tabletop/nevoa] Método:', req.method);

  // GET - Buscar todas as camadas de névoa
  if (req.method === 'GET') {
    try {
      const camadas = await prisma.tabletopNevoa.findMany({
        orderBy: { createdAt: 'asc' }
      });
      
      console.log(`[API Tabletop/nevoa] ${camadas.length} camadas encontradas`);
      
      return res.status(200).json(camadas);
    } catch (error) {
      console.error('[API Tabletop/nevoa] Erro no GET:', error);
      return res.status(500).json({ error: 'Erro ao buscar camadas' });
    }
  }

  // POST - Criar uma nova camada de névoa
  if (req.method === 'POST') {
    try {
      const { nome, x, y, escala, larguraOriginal, alturaOriginal, imageData } = req.body;
      
      console.log('[API Tabletop/nevoa] Criando camada:', { nome, x, y });
      
      const camada = await prisma.tabletopNevoa.create({
        data: {
          nome: nome || 'Camada de Névoa',
          x,
          y,
          escala: escala || 1,
          larguraOriginal: larguraOriginal || 500,
          alturaOriginal: alturaOriginal || 500,
          imageData: imageData || null
        }
      });
      
      console.log('[API Tabletop/nevoa] Camada criada com ID:', camada.id);
      
      return res.status(201).json(camada);
    } catch (error) {
      console.error('[API Tabletop/nevoa] Erro no POST:', error);
      return res.status(500).json({ error: 'Erro ao criar camada' });
    }
  }

  // Método não permitido
  return res.status(405).json({ error: 'Método não permitido' });
}