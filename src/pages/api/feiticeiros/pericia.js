import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { characterId, periciaNome, data } = req.body
      console.log(' FEITICEIROS PERICIA API - Atualizando:', { characterId, periciaNome, data })

      // Primeiro, verificar se a perícia já existe para este personagem
      const existingPericia = await prisma.feiticeirosPericia.findFirst({
        where: {
          character_id: parseInt(characterId),
          nome: periciaNome
        }
      })

      let result;
      
      if (existingPericia) {
        // Se existe, atualizar
        result = await prisma.feiticeirosPericia.update({
          where: {
            id: existingPericia.id
          },
          data: {
            treinada: data.treinada || false,
            mestre: data.mestre || false,
            outros: parseInt(data.outros) || 0,
            atributo: data.atributo || existingPericia.atributo,
            descricao: data.descricao || existingPericia.descricao
          }
        })
        console.log(' FEITICEIROS PERICIA API - Perícia atualizada com sucesso')
      } else {
        // Se não existe, criar
        result = await prisma.feiticeirosPericia.create({
          data: {
            character_id: parseInt(characterId),
            nome: periciaNome,
            atributo: data.atributo || '',
            descricao: data.descricao || '',
            treinada: data.treinada || false,
            mestre: data.mestre || false,
            outros: parseInt(data.outros) || 0
          }
        })
        console.log(' FEITICEIROS PERICIA API - Perícia criada com sucesso')
      }

      console.log(' FEITICEIROS PERICIA API - Operação concluída com sucesso')
      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar perícia Feiticeiros:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}