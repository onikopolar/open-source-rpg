export default function handler(req, res) {
  if (req.method === 'PUT') {
    // Simula atualização de character
    const { id } = req.query;
    return res.status(200).json({ 
      success: true, 
      message: `Personagem ${id} atualizado localmente`,
      data: req.body
    });
  }
  
  res.status(404).json({ error: 'Método não permitido' });
}
