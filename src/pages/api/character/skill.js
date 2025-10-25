import { prisma } from '../../../database';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Metodo nao permitido' });
    }

    try {
        const { character_id, skill_id, value } = req.body;

        console.log('Tentando salvar habilidade:', { character_id, skill_id, value });

        // Validação simples
        if (!character_id || !skill_id || value === undefined) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        // O campo value no banco é String, então convertemos
        const stringValue = String(value || '0');
        
        console.log('Convertido para string:', stringValue);

        // Atualizar no banco
        const result = await prisma.characterSkills.update({
            where: {
                character_id_skill_id: {
                    character_id: Number(character_id),
                    skill_id: Number(skill_id)
                }
            },
            data: {
                value: stringValue
            }
        });

        console.log('Habilidade salva com sucesso');
        return res.json({ 
            success: true, 
            message: 'Habilidade atualizada com sucesso',
            data: result 
        });

    } catch (error) {
        console.error('Erro ao salvar habilidade:', error);
        
        // Erro específico do Prisma - registro não encontrado
        if (error.code === 'P2025') {
            return res.status(404).json({ 
                error: 'Relação personagem-habilidade não encontrada' 
            });
        }

        return res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
}
