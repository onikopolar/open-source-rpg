import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { prisma } from '../../../../database';

// Configurar multer para upload COM DADOS DO FORM
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads/characters',
    filename: (req, file, cb) => {
      console.log('[Multer] Dados do body:', req.body);
      console.log('[Multer] Arquivo:', file.originalname);
      
      // Os dados vêm do req.body (characterId e type)
      const characterId = req.body.characterId || 'unknown';
      const type = req.body.type || 'unknown';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${characterId}-${type}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
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

// Criar diretório se não existir
const ensureUploadDir = async () => {
  const uploadDir = './public/uploads/characters';
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// Função handler principal
export default async function handler(req, res) {
  console.log('[API Upload] Recebendo requisição de upload');
  
  // Garantir que o diretório existe
  await ensureUploadDir();

  if (req.method !== 'POST') {
    console.log('[API Upload] Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // IMPORTANTE: Configurar o multer para processar campos normais E arquivos
  const uploadMiddleware = upload.single('image');
  
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error('[API Upload] Erro no upload:', err);
      return res.status(500).json({ error: 'Erro ao processar upload: ' + err.message });
    }

    try {
      console.log('[API Upload] Upload concluído:', {
        file: req.file?.filename,
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

      // Construir URL da imagem
      const imageUrl = `/uploads/characters/${req.file.filename}`;

      console.log('[API Upload] Atualizando personagem:', { characterId, type, imageUrl });

      // Atualizar o personagem no banco de dados
      const updateData = {};
      if (type === 'standard') {
        updateData.standard_character_picture_url = imageUrl;
      } else if (type === 'injured') {
        updateData.injured_character_picture_url = imageUrl;
      }

      await prisma.character.update({
        where: { id: parseInt(characterId) },
        data: updateData
      });

      console.log(`[API Upload] Imagem ${type} atualizada para personagem ${characterId}: ${imageUrl}`);

      res.status(200).json({ 
        success: true, 
        url: imageUrl,
        message: 'Imagem atualizada com sucesso'
      });

    } catch (error) {
      console.error('[API Upload] Erro ao salvar imagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
  });
}
