import { prisma } from '../../../database';

export default async function handler(req, res) {
  console.log('=== SETUP API ===')
  console.log('Método:', req.method)
  console.log('URL:', req.url)
  console.log('Body:', req.body)

  if (req.method === 'POST') {
    console.log('POST - Iniciando setup do banco')
    try {
      // Usar upsert para criar ou atualizar configurações
      console.log('Configurando DICE_ON_SCREEN_TIMEOUT_IN_MS')
      await prisma.config.upsert({
        where: { name: 'DICE_ON_SCREEN_TIMEOUT_IN_MS' },
        update: { value: '5000' },
        create: {
          name: 'DICE_ON_SCREEN_TIMEOUT_IN_MS',
          value: '5000'
        }
      });

      console.log('Configurando TIME_BETWEEN_DICES_IN_MS')
      await prisma.config.upsert({
        where: { name: 'TIME_BETWEEN_DICES_IN_MS' },
        update: { value: '1000' },
        create: {
          name: 'TIME_BETWEEN_DICES_IN_MS',
          value: '1000'
        }
      });

      console.log('Setup concluído com sucesso')
      return res.status(200).json({
        success: true,
        message: 'Setup realizado com sucesso'
      });
    } catch (error) {
      console.error('Erro no setup:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao realizar setup'
      });
    }
  }

  console.log('Método não permitido no setup:', req.method)
  res.status(404).json({ error: 'Método não permitido' });
}
