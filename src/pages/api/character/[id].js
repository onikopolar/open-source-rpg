import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query
  console.log('=== CHARACTER [id] API ===')
  console.log('Método:', req.method)
  console.log('ID:', id)
  console.log('Body:', req.body)

  if (req.method === 'PUT') {
    console.log('PUT - Atualizando personagem:', id)
    try {
      const characterId = parseInt(id)
      
      // Buscar personagem atual para verificar sistema anterior
      const currentCharacter = await prisma.character.findUnique({
        where: { id: characterId },
        include: {
          attributes: true,
          skills: true,
          feiticeiros_attributes: true,
          feiticeiros_pericias: true,
          feiticeiros_oficios: true,
          feiticeiros_resistencias: true,
          feiticeiros_ataques: true
        }
      })

      // Preparar dados para atualização
      const updateData = {
        name: req.body.name,
        age: req.body.age !== undefined ? req.body.age : null,
        gender: req.body.gender !== undefined ? req.body.gender : null,
        player_name: req.body.player_name !== undefined ? req.body.player_name : null,
        rpg_system: req.body.rpg_system !== undefined ? req.body.rpg_system : undefined,
        current_hit_points: req.body.current_hit_points !== undefined ? req.body.current_hit_points : undefined,
        max_hit_points: req.body.max_hit_points !== undefined ? req.body.max_hit_points : undefined,
        stress_level: req.body.stress_level !== undefined ? req.body.stress_level : undefined,
        trauma_level: req.body.trauma_level !== undefined ? req.body.trauma_level : undefined,
        willpower: req.body.willpower !== undefined ? req.body.willpower : undefined,
        experience: req.body.experience !== undefined ? req.body.experience : undefined,
        health_squares: req.body.health_squares !== undefined ? JSON.stringify(req.body.health_squares) : undefined,
        stress_squares: req.body.stress_squares !== undefined ? JSON.stringify(req.body.stress_squares) : undefined,
        
        // Campos do Feiticeiros
        origem: req.body.origem !== undefined ? req.body.origem : undefined,
        treino: req.body.treino !== undefined ? req.body.treino : undefined,
        especializacao: req.body.especializacao !== undefined ? req.body.especializacao : undefined,
        tecnica: req.body.tecnica !== undefined ? req.body.tecnica : undefined,
        experiencia: req.body.experiencia !== undefined ? req.body.experiencia : undefined,
        multiclasse: req.body.multiclasse !== undefined ? req.body.multiclasse : undefined,
        grau: req.body.grau !== undefined ? req.body.grau : undefined,
        current_soul_integrity: req.body.current_soul_integrity !== undefined ? req.body.current_soul_integrity : undefined,
        current_energy_points: req.body.current_energy_points !== undefined ? req.body.current_energy_points : undefined,
        max_energy_points: req.body.max_energy_points !== undefined ? req.body.max_energy_points : undefined,
      }

      // Remover campos undefined para não sobrescrever com null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      console.log('PUT - Dados para atualização:', updateData)

      // Atualizar o personagem
      const character = await prisma.character.update({
        where: { id: characterId },
        data: updateData
      })

      console.log('PUT - Personagem atualizado:', character.id)
      console.log('PUT - Sistema RPG atualizado para:', character.rpg_system)

      // VERSÃO 1.2.0 - Fix: Adicionado setup para sistema Classic
      // Se o sistema foi alterado para Classic e não tem atributos/skills ainda, criar os dados
      if (req.body.rpg_system === 'classic' && currentCharacter) {
        console.log('PUT - Verificando setup do sistema Classic')
        
        const hasClassicAttributes = currentCharacter.attributes && currentCharacter.attributes.length > 0
        const hasClassicSkills = currentCharacter.skills && currentCharacter.skills.length > 0
        
        if (!hasClassicAttributes || !hasClassicSkills) {
          console.log('PUT - Iniciando setup do sistema Classic para personagem:', characterId)
          
          try {
            // Buscar todos os atributos classicos disponíveis no sistema
            const allAttributes = await prisma.attribute.findMany({
              orderBy: { name: 'asc' }
            })
            
            console.log(`PUT - Encontrados ${allAttributes.length} atributos classicos no sistema`)
            
            // Criar atributos para o personagem se não existirem
            if (allAttributes.length > 0 && !hasClassicAttributes) {
              for (const attr of allAttributes) {
                // Verificar se já existe este atributo para o personagem
                const existingAttribute = await prisma.characterAttribute.findFirst({
                  where: {
                    character_id: characterId,
                    attribute_id: attr.id
                  }
                })
                
                if (!existingAttribute) {
                  await prisma.characterAttribute.create({
                    data: {
                      character_id: characterId,
                      attribute_id: attr.id,
                      value: 1 // Valor padrão
                    }
                  })
                  console.log(`PUT - Atributo "${attr.name}" criado para o personagem`)
                }
              }
              console.log(`PUT - ${allAttributes.length} atributos classicos configurados`)
            }
            
            // Buscar todas as skills classicas disponíveis no sistema
            const allSkills = await prisma.skill.findMany({
              orderBy: { name: 'asc' }
            })
            
            console.log(`PUT - Encontradas ${allSkills.length} skills classicas no sistema`)
            
            // Criar skills para o personagem se não existirem
            if (allSkills.length > 0 && !hasClassicSkills) {
              for (const skill of allSkills) {
                // Verificar se já existe esta skill para o personagem
                const existingSkill = await prisma.characterSkill.findFirst({
                  where: {
                    character_id: characterId,
                    skill_id: skill.id
                  }
                })
                
                if (!existingSkill) {
                  await prisma.characterSkill.create({
                    data: {
                      character_id: characterId,
                      skill_id: skill.id,
                      value: 0 // Valor padrão
                    }
                  })
                  console.log(`PUT - Skill "${skill.name}" criada para o personagem`)
                }
              }
              console.log(`PUT - ${allSkills.length} skills classicas configuradas`)
            }
            
            console.log('PUT - Setup do sistema Classic concluído com sucesso')
            
          } catch (classicError) {
            console.error('PUT - Erro ao configurar sistema Classic:', classicError)
          }
        } else {
          console.log('PUT - Personagem já possui atributos e skills do Classic')
        }
      }

      // Se o sistema foi alterado para Feiticeiros e não tem dados ainda, criar os dados
      if (req.body.rpg_system === 'feiticeiros' && currentCharacter) {
        const hasFeiticeirosData = currentCharacter.feiticeiros_attributes.length > 0 || 
                                  currentCharacter.feiticeiros_pericias.length > 0

        if (!hasFeiticeirosData) {
          console.log('PUT - Criando dados do Feiticeiros para personagem:', characterId)

          try {
            // Criar atributos do Feiticeiros
            const feiticeirosAttributes = await prisma.feiticeirosAttribute.findMany()
            console.log(`PUT - Encontrados ${feiticeirosAttributes.length} atributos Feiticeiros`)

            if (feiticeirosAttributes.length > 0) {
              for (const attr of feiticeirosAttributes) {
                await prisma.feiticeirosCharacterAttribute.create({
                  data: {
                    character_id: characterId,
                    attribute_id: attr.id,
                    value: attr.base_value
                  }
                })
              }
              console.log(`PUT - ${feiticeirosAttributes.length} atributos Feiticeiros vinculados`)
            }

            // Criar perícias
            const periciasData = [
              { nome: 'ATLETISMO', atributo: 'FORÇA', descricao: 'Testes de força física, saltos, escaladas, natação' },
              { nome: 'ACROBACIA', atributo: 'DESTREZA', descricao: 'Equilíbrio, cambalhotas, esquivar, movimentos ágeis' },
              { nome: 'FURTIVIDADE', atributo: 'DESTREZA', descricao: 'Movimento silencioso, esconder-se, passar despercebido' },
              { nome: 'PRESTIDIGITAÇÃO', atributo: 'DESTREZA', descricao: 'Truques manuais, pickpocket, atos de destreza manual' },
              { nome: 'DIREÇÃO', atributo: 'SABEDORIA', descricao: 'Navegação, orientação, leitura de mapas' },
              { nome: 'INTUIÇÃO', atributo: 'SABEDORIA', descricao: 'Percepção de intenções, leitura de pessoas' },
              { nome: 'MEDICINA', atributo: 'SABEDORIA', descricao: 'Primeiros socorros, diagnóstico, tratamento de ferimentos' },
              { nome: 'OCULTISMO', atributo: 'SABEDORIA', descricao: 'Conhecimento sobre magia, criaturas sobrenaturais, símbolos' },
              { nome: 'PERCEPÇÃO', atributo: 'SABEDORIA', descricao: 'Percepção sensorial, notar detalhes, escutar sons' },
              { nome: 'SOBREVIVÊNCIA', atributo: 'SABEDORIA', descricao: 'Rastreamento, caça, acampamento, orientação na natureza' },
              { nome: 'FEITIÇARIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento específico sobre feitiços e magias' },
              { nome: 'HISTÓRIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento histórico, lendas, eventos passados' },
              { nome: 'INVESTIGAÇÃO', atributo: 'INTELIGÊNCIA', descricao: 'Análise de cenas, resolução de enigmas, dedução' },
              { nome: 'TECNOLOGIA', atributo: 'INTELIGÊNCIA', descricao: 'Uso de dispositivos tecnológicos, eletrônicos, computadores' },
              { nome: 'TEOLOGIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento sobre religiões, deuses, práticas espirituais' },
              { nome: 'ENGANAÇÃO', atributo: 'PRESENÇA', descricao: 'Mentir, disfarces, blefes, criar histórias convincentes' },
              { nome: 'INTIMIDAÇÃO', atributo: 'PRESENÇA', descricao: 'Amedrontar, coagir, impor respeito através da presença' },
              { nome: 'PERFORMANCE', atributo: 'PRESENÇA', descricao: 'Atuação, canto, dança, apresentações artísticas' },
              { nome: 'PERSUASÃO', atributo: 'PRESENÇA', descricao: 'Convencer, negociar, diplomacia, discursos persuasivos' }
            ]

            for (const pericia of periciasData) {
              await prisma.feiticeirosPericia.create({
                data: {
                  character_id: characterId,
                  ...pericia
                }
              })
            }
            console.log(`PUT - ${periciasData.length} perícias Feiticeiros criadas`)

            // Criar ofícios
            const oficiosData = [
              { nome: 'CANALIZADOR', atributo: 'INTELIGÊNCIA', descricao: 'Criação e manutenção de canais de energia amaldiçoada' },
              { nome: 'ENTALHADOR', atributo: 'INTELIGÊNCIA', descricao: 'Criação de selos, símbolos e artefatos mágicos' },
              { nome: 'ASTÚCIA', atributo: 'INTELIGÊNCIA', descricao: 'Estratégia, tática, planejamento em combate' }
            ]

            for (const oficio of oficiosData) {
              await prisma.feiticeirosOficio.create({
                data: {
                  character_id: characterId,
                  ...oficio
                }
              })
            }
            console.log(`PUT - ${oficiosData.length} ofícios Feiticeiros criados`)

            // Criar resistências
            const resistenciasData = [
              { nome: 'FORTITUDE', atributo: 'CONSTITUIÇÃO', descricao: 'Resistência a efeitos físicos, venenos, doenças' },
              { nome: 'INTEGRIDADE', atributo: 'CONSTITUIÇÃO', descricao: 'Resistência a corrupção, degeneração, decomposição' },
              { nome: 'REFLEXOS', atributo: 'DESTREZA', descricao: 'Esquiva de ataques, explosões, armadilhas' },
              { nome: 'VONTADE', atributo: 'SABEDORIA', descricao: 'Resistência a efeitos mentais, ilusões, controle mental' }
            ]

            for (const resistencia of resistenciasData) {
              await prisma.feiticeirosResistencia.create({
                data: {
                  character_id: characterId,
                  ...resistencia
                }
              })
            }
            console.log(`PUT - ${resistenciasData.length} resistências Feiticeiros criadas`)

            // Criar ataques
            const ataquesData = [
              { nome: 'CORPO-A-CORPO', atributo: 'FORÇA', descricao: 'Ataques com armas brancas e combate físico' },
              { nome: 'A DISTÂNCIA', atributo: 'DESTREZA', descricao: 'Ataques com armas de arremesso, arcos, bestas' },
              { nome: 'AMALDIÇOADO', atributo: 'INTELIGÊNCIA', descricao: 'Ataques usando energia amaldiçoada e feitiços' }
            ]

            for (const ataque of ataquesData) {
              await prisma.feiticeirosAtaque.create({
                data: {
                  character_id: characterId,
                  ...ataque
                }
              })
            }
            console.log(`PUT - ${ataquesData.length} ataques Feiticeiros criados`)

            console.log('PUT - Configuração Feiticeiros concluída com sucesso')
          } catch (feiticeirosError) {
            console.error('PUT - Erro ao configurar Feiticeiros:', feiticeirosError)
          }
        } else {
          console.log('PUT - Personagem já possui dados do Feiticeiros, pulando criação')
        }
      }

      // Buscar personagem atualizado com todos os dados
      const updatedCharacter = await prisma.character.findUnique({
        where: { id: characterId },
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
          },
          yearzero_attributes: {
            include: {
              attribute: true
            }
          },
          yearzero_skills: {
            include: {
              skill: true
            }
          },
          feiticeiros_attributes: {
            include: {
              attribute: true
            }
          },
          feiticeiros_pericias: true,
          feiticeiros_oficios: true,
          feiticeiros_resistencias: true,
          feiticeiros_ataques: true
        }
      })

      console.log('PUT - Personagem atualizado com sucesso')
      return res.status(200).json({
        success: true,
        message: `Personagem ${id} atualizado com sucesso`,
        data: updatedCharacter
      })
    } catch (error) {
      console.error('PUT - Erro ao atualizar personagem:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar personagem'
      })
    }
  }

  if (req.method === 'DELETE') {
    console.log('DELETE - Deletando personagem:', id)
    try {
      await prisma.character.delete({
        where: { id: parseInt(id) }
      })

      console.log('DELETE - Personagem deletado com sucesso')
      return res.status(200).json({
        success: true,
        message: 'Personagem deletado com sucesso'
      })
    } catch (error) {
      console.error('DELETE - Erro ao deletar personagem:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar personagem'
      })
    }
  }

  console.log('Método não permitido:', req.method)
  res.status(404).json({ error: 'Método não permitido' })
}