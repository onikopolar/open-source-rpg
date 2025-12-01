import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { characterId, resistenciaNome, data } = req.body
      console.log('🔥 FEITICEIROS RESISTENCIA API - Atualizando:', { characterId, resistenciaNome, data })

      // Primeiro, verificar se a resistência já existe para este personagem
      const existingResistencia = await prisma.feiticeirosResistencia.findFirst({
        where: {
          character_id: parseInt(characterId),
          nome: resistenciaNome
        }
      })

      let result;
      
      if (existingResistencia) {
        // Se existe, atualizar
        result = await prisma.feiticeirosResistencia.update({
          where: {
            id: existingResistencia.id
          },
          data: {
            treinada: data.treinada || false,
            mestre: data.mestre || false,
            outros: parseInt(data.outros) || 0,
            atributo: data.atributo || existingResistencia.atributo,
            descricao: data.descricao || existingResistencia.descricao
          }
        })
        console.log('🔥 FEITICEIROS RESISTENCIA API - Resistência atualizada com sucesso')
      } else {
        // Se não existe, criar
        result = await prisma.feiticeirosResistencia.create({
          data: {
            character_id: parseInt(characterId),
            nome: resistenciaNome,
            atributo: data.atributo || '',
            descricao: data.descricao || '',
            treinada: data.treinada || false,
            mestre: data.mestre || false,
            outros: parseInt(data.outros) || 0
          }
        })
        console.log('🔥 FEITICEIROS RESISTENCIA API - Resistência criada com sucesso')
      }

      console.log('🔥 FEITICEIROS RESISTENCIA API - Operação concluída com sucesso')
      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar resistência Feiticeiros:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}