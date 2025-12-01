import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { characterId, oficioNome, data } = req.body
      console.log('🔥 FEITICEIROS OFICIO API - Atualizando:', { characterId, oficioNome, data })

      // Primeiro, verificar se o ofício já existe para este personagem
      const existingOficio = await prisma.feiticeirosOficio.findFirst({
        where: {
          character_id: parseInt(characterId),
          nome: oficioNome
        }
      })

      let result;
      
      if (existingOficio) {
        // Se existe, atualizar
        result = await prisma.feiticeirosOficio.update({
          where: {
            id: existingOficio.id
          },
          data: {
            treinada: data.treinada || false,
            mestre: data.mestre || false,
            outros: parseInt(data.outros) || 0,
            atributo: data.atributo || existingOficio.atributo,
            descricao: data.descricao || existingOficio.descricao
          }
        })
        console.log('🔥 FEITICEIROS OFICIO API - Ofício atualizado com sucesso')
      } else {
        // Se não existe, criar
        result = await prisma.feiticeirosOficio.create({
          data: {
            character_id: parseInt(characterId),
            nome: oficioNome,
            atributo: data.atributo || '',
            descricao: data.descricao || '',
            treinada: data.treinada || false,
            mestre: data.mestre || false,
            outros: parseInt(data.outros) || 0
          }
        })
        console.log('🔥 FEITICEIROS OFICIO API - Ofício criado com sucesso')
      }

      console.log('🔥 FEITICEIROS OFICIO API - Operação concluída com sucesso')
      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar ofício Feiticeiros:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}