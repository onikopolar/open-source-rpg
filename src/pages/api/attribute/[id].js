import { prisma } from '../../../database';

export default async function handler(req, res) {
  const { id } = req.query;

  console.log('=== ATTRIBUTE DELETE DEBUG ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('ID from query:', id);
  console.log('URL:', req.url);
  console.log('==========================');

  if (req.method === 'DELETE') {
    try {
      console.log('Attempting to delete attribute with ID:', id);
      
      // Converter ID para número
      const attributeId = parseInt(id, 10);
      console.log('Converted ID:', attributeId);
      
      const result = await prisma.attribute.delete({
        where: { id: attributeId }
      });
      
      console.log('Delete successful:', result);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.log('Delete error:', error);
      console.log('Error message:', error.message);
      return res.status(500).json({ error: 'Erro ao deletar atributo: ' + error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;
      const attributeId = parseInt(id, 10);
      const attribute = await prisma.attribute.update({
        where: { id: attributeId },
        data: { name, description }
      });
      return res.status(200).json(attribute);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar atributo: ' + error.message });
    }
  }

  res.status(404).json({ error: 'Método não permitido' });
}
