import { prisma } from '../../../database';

export default async function handler(req, res) {
    const { id } = req.query;

    if(req.method === 'DELETE') {
        // Verificar se existem personagens usando esta skill - NOME CORRETO: CharacterSkills
        const characterSkills = await prisma.characterSkills.findMany({
            where: {
                skill_id: Number(id)
            }
        });

        // Se existirem personagens usando, não podemos deletar
        if(characterSkills.length > 0) {
            return res.status(400).json({ error: 'Cannot delete skill: characters are using it' });
        }

        // Se não existirem, podemos deletar
        await prisma.skills.delete({
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
