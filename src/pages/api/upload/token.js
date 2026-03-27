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
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tokens');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('[Upload] Erro:', err);
        return res.status(500).json({ error: 'Erro no upload' });
      }

      const file = files.file?.[0] || files.imagem?.[0];
      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const ext = path.extname(file.originalFilename);
      const nomeArquivo = `${Date.now()}${ext}`;
      const caminhoAntigo = file.filepath;
      const caminhoNovo = path.join(uploadDir, nomeArquivo);

      fs.renameSync(caminhoAntigo, caminhoNovo);
      
      const url = `/uploads/tokens/${nomeArquivo}`;
      
      return res.status(200).json({ url, nome: nomeArquivo });
    });
  } catch (error) {
    console.error('[Upload] Erro:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}