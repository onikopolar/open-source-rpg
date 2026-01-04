// src/pages/api/yearzero/personal-meta.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('[PersonalMeta API] Carreguei endpoint personal-meta v1.0.0');

export default async function handler(req, res) {
  console.log('[PersonalMeta API] Recebi requisição:', req.method, req.body);

  if (req.method !== 'POST' && req.method !== 'PUT') {
    console.log('[PersonalMeta API] Método não permitido:', req.method);
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { character_id, field, value } = req.body;

    console.log('[PersonalMeta API] Dados recebidos:', { character_id, field, value });

    // Validação básica
    if (!character_id || !field) {
      console.error('[PersonalMeta API] character_id ou field faltando');
      return res.status(400).json({ 
        message: 'character_id e field são obrigatórios' 
      });
    }

    // Lista de campos permitidos do PersonalMetaTalents
    const allowedFields = [
      'personal_goal',
      'camarada', 
      'rival',
      'career',
      'appearance',
      'talents'
    ];

    if (!allowedFields.includes(field)) {
      console.error('[PersonalMeta API] Campo inválido:', field);
      return res.status(400).json({ 
        message: 'Campo inválido', 
        allowedFields 
      });
    }

    // Converter character_id para número
    const characterId = parseInt(character_id);
    if (isNaN(characterId)) {
      console.error('[PersonalMeta API] character_id não é número:', character_id);
      return res.status(400).json({ 
        message: 'character_id deve ser um número' 
      });
    }

    console.log('[PersonalMeta API] Buscando personagem ID:', characterId);

    // Buscar o personagem atual
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      console.error('[PersonalMeta API] Personagem não encontrado:', characterId);
      return res.status(404).json({ message: 'Personagem não encontrado' });
    }

    console.log('[PersonalMeta API] Personagem encontrado:', character.name);

    // Preparar dados para atualização
    const updateData = {};
    
    // Para o campo 'talents', garantir que seja salvo como string JSON
    if (field === 'talents') {
      let talentsValue = value;
      
      // Se já for string, tentar parsear para validar
      if (typeof talentsValue === 'string') {
        try {
          // Remover aspas extras se existirem
          talentsValue = talentsValue.replace(/^"+|"+$/g, '');
          
          // Se for string vazia, criar array vazio
          if (talentsValue.trim() === '') {
            updateData[field] = JSON.stringify([]);
          } else {
            const parsed = JSON.parse(talentsValue);
            
            // Garantir que seja um array
            if (!Array.isArray(parsed)) {
              console.error('[PersonalMeta API] Talents não é array:', parsed);
              throw new Error('Talents deve ser um array');
            }
            
            // Limitar a 4 talentos
            const limitedTalents = parsed.slice(0, 4);
            updateData[field] = JSON.stringify(limitedTalents);
          }
          
        } catch (error) {
          console.error('[PersonalMeta API] Erro ao processar talents:', error);
          return res.status(400).json({ 
            message: 'Formato inválido para talents. Use um array JSON válido.' 
          });
        }
      } else if (Array.isArray(talentsValue)) {
        // Se já for array, converter para string JSON
        const limitedTalents = talentsValue.slice(0, 4);
        updateData[field] = JSON.stringify(limitedTalents);
      } else {
        console.error('[PersonalMeta API] Formato inválido para talents:', typeof talentsValue);
        return res.status(400).json({ 
          message: 'Talents deve ser um array ou string JSON' 
        });
      }
    } else {
      // Para outros campos, salvar como string
      // Se for undefined ou null, salvar como string vazia
      updateData[field] = String(value || '');
    }

    console.log('[PersonalMeta API] Atualizando campo:', field, 'com valor:', updateData[field]);

    // Atualizar o personagem
    const updatedCharacter = await prisma.character.update({
      where: { id: characterId },
      data: updateData
    });

    console.log('[PersonalMeta API] Personagem atualizado com sucesso');

    // Retornar resposta de sucesso
    return res.status(200).json({
      success: true,
      field,
      value: updateData[field],
      character: {
        id: updatedCharacter.id,
        name: updatedCharacter.name,
        [field]: updatedCharacter[field]
      }
    });

  } catch (error) {
    console.error('[PersonalMeta API] Erro no handler:', error);
    
    // Erros específicos do Prisma
    if (error.code === 'P2025') {
      console.error('[PersonalMeta API] Personagem não encontrado no banco');
      return res.status(404).json({ 
        message: 'Personagem não encontrado' 
      });
    }
    
    if (error.code === 'P2002') {
      console.error('[PersonalMeta API] Conflito de dados:', error);
      return res.status(409).json({ 
        message: 'Conflito de dados' 
      });
    }

    console.error('[PersonalMeta API] Erro interno:', error.message);
    
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}