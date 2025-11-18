import { prisma } from '../../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const character = await prisma.character.findUnique({
        where: { id: parseInt(id) },
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
      })

      if (!character) {
        return res.status(404).json({ error: 'Personagem não encontrado' })
      }

      // Formatar dados para o YearZero
      const yearZeroData = {
        character: {
          id: character.id,
          name: character.name,
          system: character.rpg_system,
          stress_level: character.stress_level,
          trauma_level: character.trauma_level,
          willpower: character.willpower,
          experience: character.experience
        },
        attributes: character.attributes.map(ca => ({
          name: ca.attribute.name,
          value: parseInt(ca.value) || 0,
          base_dice: calculateBaseDice(parseInt(ca.value) || 0),
          description: ca.attribute.description,
          skills: []
        })),
        stress: { value: character.stress_level || 0 }
      }

      // Adicionar skills aos atributos
      character.skills.forEach(cs => {
        const attributeName = getAttributeForSkill(cs.skill.name)
        const attribute = yearZeroData.attributes.find(attr => attr.name === attributeName)
        if (attribute) {
          attribute.skills.push({
            name: cs.skill.name,
            value: parseInt(cs.value) || 0,
            linked_attribute: attributeName
          })
        }
      })

      res.status(200).json(yearZeroData)
    } catch (error) {
      console.error('Erro ao buscar personagem:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}

function calculateBaseDice(value) {
  const diceMap = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 }
  return diceMap[value] || 0
}

function getAttributeForSkill(skillName) {
  const skillToAttribute = {
    'Combate Corpo a Corpo': 'FORÇA',
    'Maquinário Pesado': 'FORÇA',
    'Resistência': 'FORÇA',
    'Combate à Distância': 'AGILIDADE',
    'Mobilidade': 'AGILIDADE',
    'Pilotagem': 'AGILIDADE',
    'Observação': 'RACIOCÍNIO',
    'Sobrevivência': 'RACIOCÍNIO',
    'Tecnologia': 'RACIOCÍNIO',
    'Manipulação': 'EMPATIA',
    'Comando': 'EMPATIA',
    'Cuidados Médicos': 'EMPATIA'
  }
  return skillToAttribute[skillName] || 'FORÇA'
}