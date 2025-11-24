import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { character_id, max_number, times } = req.body;

      console.log('[DEBUG] API Roll - Recebendo requisição:', {
        character_id,
        max_number,
        times
      });

      // Validar dados
      if (!character_id || !max_number || !times) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }

      if (times < 1) {
        return res.status(400).json({ error: 'Número de dados inválido' });
      }

      // Gerar múltiplas rolagens
      const rollsData = [];
      for (let i = 0; i < times; i++) {
        const rolled_number = Math.floor(Math.random() * max_number) + 1;
        rollsData.push({
          character_id,
          max_number,
          rolled_number
        });
      }

      // Criar todas as rolagens de uma vez
      const rolls = await prisma.roll.createMany({
        data: rollsData,
        skipDuplicates: true,
      });

      console.log('[DEBUG] API Roll - Rolagens criadas:', rolls);

      // Retornar os dados simulados (já que createMany não retorna os registros criados)
      const simulatedRolls = rollsData.map((data, index) => ({
        id: Date.now() + index, // ID temporário
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      }));

      return res.status(200).json(simulatedRolls);
    } catch (error) {
      console.error('[ERROR] API Roll - Erro:', error);
      return res.status(500).json({ error: 'Erro ao salvar rolagem' });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}