// src/pages/api/upload/token.js

import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('[API Upload] Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tokens');
    console.log('[API Upload] Diretório de upload:', uploadDir);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('[API Upload] Diretório criado:', uploadDir);
    }

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('[API Upload] Erro no parse do formulário:', err.message);
        return res.status(500).json({ error: 'Erro no upload' });
      }

      const file = files.file?.[0] || files.imagem?.[0];
      if (!file) {
        console.log('[API Upload] Nenhum arquivo encontrado no request');
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      console.log('[API Upload] Arquivo recebido:', {
        nomeOriginal: file.originalFilename,
        tamanho: file.size,
        tipo: file.mimetype,
        caminhoTemp: file.filepath
      });

      const ext = path.extname(file.originalFilename);
      const nomeArquivo = `${Date.now()}${ext}`;
      const caminhoAntigo = file.filepath;
      const caminhoNovo = path.join(uploadDir, nomeArquivo);

      fs.renameSync(caminhoAntigo, caminhoNovo);
      
      const url = `/uploads/tokens/${nomeArquivo}`;
      
      console.log('[API Upload] Upload concluído:', {
        nomeArquivo,
        url,
        caminhoFinal: caminhoNovo
      });
      
      return res.status(200).json({ url, nome: nomeArquivo });
    });
  } catch (error) {
    console.error('[API Upload] Erro no handler:', error.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
}