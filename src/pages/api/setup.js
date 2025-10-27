import { prisma } from '../../../database';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Criar configurações iniciais individualmente
      await prisma.config.create({
        data: {
          name: 'DICE_ON_SCREEN_TIMEOUT_IN_MS',
          value: '5000'
        }
      });

      await prisma.config.create({
        data: {
          name: 'TIME_BETWEEN_DICES_IN_MS', 
          value: '1000'
        }
      });

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

  res.status(404).json({ error: 'Método não permitido' });
}
