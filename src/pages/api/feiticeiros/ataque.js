import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { characterId, ataqueNome, data } = req.body
      console.log(' FEITICEIROS ATAQUE API - Atualizando:', { characterId, ataqueNome, data })

      // Primeiro, verificar se o ataque já existe para este personagem
      const existingAtaque = await prisma.feiticeirosAtaque.findFirst({
        where: {
          character_id: parseInt(characterId),
          nome: ataqueNome
        }
      })

      let result;
      
      if (existingAtaque) {
        // Se existe, atualizar
        result = await prisma.feiticeirosAtaque.update({
          where: {
            id: existingAtaque.id
          },
          data: {
            treinada: data.treinada || false,
            mestre: data.mestre || false,
            outros: parseInt(data.outros) || 0,
            atributo: data.atributo || existingAtaque.atributo,
            descricao: data.descricao || existingAtaque.descricao
          }
        })
        console.log(' FEITICEIROS ATAQUE API - Ataque atualizado com sucesso')
      } else {
        // Se não existe, criar
        result = await prisma.feiticeirosAtaque.create({
          data: {
            character_id: parseInt(characterId),
            nome: ataqueNome,
            atributo: data.atributo || '',
            descricao: data.descricao || '',
            treinada: data.treinada || false,
            mestre: data.mestre || false,
            outros: parseInt(data.outros) || 0
          }
        })
        console.log(' FEITICEIROS ATAQUE API - Ataque criado com sucesso')
      }

      console.log(' FEITICEIROS ATAQUE API - Operação concluída com sucesso')
      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar ataque Feiticeiros:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}