// Arquivo: src/pages/api/uploads/character-image.js
// Versão: 2.0.0 - MAJOR: Conversão para base64 e salvamento direto no banco
console.log('[API Upload] Versão 2.0.0 - MAJOR: Conversão para base64 e salvamento direto no banco');

import multer from 'multer';
import { prisma } from '../../../../database';

// Configurar multer apenas para processar multipart (não salvar em disco)
const upload = multer({
  storage: multer.memoryStorage(), // Usar memoryStorage em vez de diskStorage
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Middleware para processar multipart/form-data
export const config = {
  api: {
    bodyParser: false, // IMPORTANTE: Desabilitar bodyParser padrão
  },
};

// Função handler principal
export default async function handler(req, res) {
  console.log('[API Upload] Recebendo requisição de upload - Modo base64');

  if (req.method !== 'POST') {
    console.log('[API Upload] Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Configurar o multer para processar campos normais E arquivos
  const uploadMiddleware = upload.single('image');
  
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error('[API Upload] Erro no upload:', err);
      return res.status(500).json({ error: 'Erro ao processar upload: ' + err.message });
    }

    try {
      console.log('[API Upload] Upload concluído:', {
        fileSize: req.file?.size,
        fileType: req.file?.mimetype,
        body: req.body,
        characterId: req.body?.characterId,
        type: req.body?.type
      });

      const characterId = req.body.characterId;
      const type = req.body.type;

      if (!characterId || !type) {
        console.error('[API Upload] Dados incompletos:', { characterId, type });
        return res.status(400).json({ error: 'characterId e type são obrigatórios' });
      }

      if (!req.file) {
        console.error('[API Upload] Nenhum arquivo recebido');
        return res.status(400).json({ error: 'Nenhuma imagem enviada' });
      }

      // Validar tipo (deve ser 'standard' ou 'injured')
      if (type !== 'standard' && type !== 'injured') {
        console.error('[API Upload] Tipo inválido:', type);
        return res.status(400).json({ error: 'Tipo deve ser "standard" ou "injured"' });
      }

      // Converter buffer para base64
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataURL = `data:${mimeType};base64,${base64Image}`;
      
      console.log('[API Upload] Imagem convertida:', {
        base64Length: base64Image.length,
        mimeType: mimeType,
        dataURLLength: dataURL.length
      });

      // Determinar campos para atualização
      const imageField = type === 'standard' ? 'standard_character_image' : 'injured_character_image';
      const mimeField = type === 'standard' ? 'standard_image_mime' : 'injured_image_mime';
      const urlField = type === 'standard' ? 'standard_character_picture_url' : 'injured_character_picture_url';

      console.log('[API Upload] Atualizando personagem no banco:', { 
        characterId, 
        type,
        imageField,
        mimeField
      });

      // Atualizar o personagem no banco de dados
      const updateData = {
        [imageField]: dataURL,
        [mimeField]: mimeType,
        [urlField]: null // Limpar URL externa se existir
      };

      await prisma.character.update({
        where: { id: parseInt(characterId) },
        data: updateData
      });

      console.log(`[API Upload] Imagem ${type} salva como base64 no banco para personagem ${characterId}`);
      console.log(`[API Upload] Tamanho do base64: ${base64Image.length} caracteres`);

      // Retornar sucesso com a URL de dados (data URL)
      res.status(200).json({ 
        success: true, 
        url: dataURL, // Retorna a data URL completa
        message: 'Imagem convertida para base64 e salva no banco de dados',
        base64Length: base64Image.length,
        mimeType: mimeType
      });

    } catch (error) {
      console.error('[API Upload] Erro ao salvar imagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
  });
}