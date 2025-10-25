import { prisma } from '../../../database';

export default async function handler(req, res) {
    const { id } = req.query;

    if(req.method === 'DELETE') {
        // Verificar se existem personagens usando este atributo - NOME CORRETO: CharacterAttributes
        const characterAttributes = await prisma.characterAttributes.findMany({
            where: {
                attribute_id: Number(id)
            }
        });

        // Se existirem personagens usando, não podemos deletar
        if(characterAttributes.length > 0) {
            return res.status(400).json({ error: 'Cannot delete attribute: characters are using it' });
        }

        // Se não existirem, podemos deletar
        await prisma.attribute.delete({
            where: {
                id: Number(id)
            }
        });

        return res.status(200).json({ success: true });
    }
    else {
        return res.status(404);
    }
}
