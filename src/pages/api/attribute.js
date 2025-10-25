export default function handler(req, res) {
  if (req.method === 'GET') {
    // Retorna lista vazia de attributes
    return res.status(200).json([]);
  }
  
  if (req.method === 'DELETE') {
    // Simula exclusão de attribute
    return res.status(200).json({ success: true });
  }
  
  res.status(404).json({ error: 'Método não permitido' });
}
