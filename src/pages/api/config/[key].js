export default function handler(req, res) {
  if (req.method === 'PUT') {
    const { key } = req.query;
    return res.status(200).json({ 
      success: true, 
      message: \`Config \${key} atualizada localmente\`,
      value: req.body.value
    });
  }
  
  res.status(404).json({ error: 'Método não permitido' });
}
