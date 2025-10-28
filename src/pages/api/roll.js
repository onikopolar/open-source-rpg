export default function handler(req, res) {
  if (req.method === 'POST') {
    const { character_id, max_number = 20, times = 1 } = req.body;
    
    // Simula rolagem de dados múltiplos
    const rolls = Array.from({ length: times }, () => ({
      rolled_number: Math.floor(Math.random() * max_number) + 1
    }));
    
    const total = rolls.reduce((sum, roll) => sum + roll.rolled_number, 0);
    
    console.log('[DEBUG] API Roll - Rolagem realizada:', {
      character_id,
      max_number, 
      times,
      rolls,
      total
    });

    return res.status(200).json(rolls);
  }

  res.status(404).json({ error: 'Método não permitido' });
}
