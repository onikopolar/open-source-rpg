export default function handler(req, res) {
  if (req.method === 'POST') {
    // Simula setup do sistema
    return res.status(200).json({ 
      success: true, 
      message: 'Setup realizado localmente'
    });
  }
  
  res.status(404).json({ error: 'Método não permitido' });
}
