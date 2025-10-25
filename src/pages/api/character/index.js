import { prisma } from '../../../database';

function parseRelationArray(array, entityName) {
    return array.map(item => ({
        [entityName]: {
            connect: {
                id: item.id
            }
        }
    }));
}

// Atributos padrão do Year Zero Engine
const YEAR_ZERO_ATTRIBUTES = ['FORÇA', 'AGILIDADE', 'RACIOCÍNIO', 'EMPATIA'];

export default async function handler(req, res) {
    if(req.method === 'POST') {
        const { body } = req;

        if(!body.name) {
            return res.status(400).json({ error: 'Name not set' });
        }

        // Buscar todos os atributos disponíveis
        const allAttributes = await prisma.attribute.findMany();
        const allSkills = await prisma.skill.findMany();

        // Filtrar apenas atributos do Year Zero ou usar todos se não existirem
        const yearZeroAttributes = allAttributes.filter(attr => 
            YEAR_ZERO_ATTRIBUTES.includes(attr.name.toUpperCase())
        );
        
        const attributesToUse = yearZeroAttributes.length > 0 ? yearZeroAttributes : allAttributes;

        const character = await prisma.character.create({
            data: {
                ...body,
                // DEFINIR COMO YEAR ZERO POR PADRÃO
                rpg_system: 'year_zero',

                // Create Character With Many to Many Relations Set
                attributes: {
                    create: parseRelationArray(attributesToUse, 'attribute')
                },
                skills: {
                    create: parseRelationArray(allSkills, 'skill')
                }
            },
            include: {
                attributes: {
                    include: {
                        attribute: true
                    }
                },
                skills: {
                    include: {
                        skill: true
                    }
                }
            }
        });

        // Configurar automaticamente para Year Zero
        try {
            const setupResponse = await fetch(`http://localhost:3000/api/yearzero/system`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character_id: character.id })
            });
            // Não falha se a configuração Year Zero der erro
        } catch (error) {
            console.log('Configuração Year Zero automática falhou, mas personagem foi criado:', error.message);
        }

        return res.status(200).json(character);
    }
    else if(req.method === 'GET') {
        const characters = await prisma.character.findMany({
            include: {
                attributes: {
                    include: {
                        attribute: true
                    }
                },
                skills: {
                    include: {
                        skill: true
                    }
                }
            }
        });

        return res.status(200).json(characters);
    }
    else {
        return res.status(404);
    }
}
