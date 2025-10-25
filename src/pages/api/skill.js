export default function handler(req, res) {
  if (req.method === 'GET') {
    // Retorna lista vazia de skills
    return res.status(200).json([]);
  }
  
  if (req.method === 'POST') {
    // Simula criação de skill
    return res.status(200).json({ success: true, id: Date.now() });
  }
  
  if (req.method === 'PUT') {
    // Simula atualização de skill
    return res.status(200).json({ success: true });
  }
  
  if (req.method === 'DELETE') {
    // Simula exclusão de skill
    return res.status(200).json({ success: true });
  }
  
  res.status(404).json({ error: 'Método não permitido' });
}
