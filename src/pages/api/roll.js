export default function handler(req, res) {
  if (req.method === 'POST') {
    // Simula rolagem de dados
    return res.status(200).json({ 
      success: true, 
      message: 'Rolagem realizada localmente',
      result: {
        total: Math.floor(Math.random() * 20) + 1,
        dice: [Math.floor(Math.random() * 6) + 1]
      }
    });
  }
  
  res.status(404).json({ error: 'Método não permitido' });
}
