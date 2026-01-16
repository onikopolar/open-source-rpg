// SEED ESPECÍFICO PARA SISTEMA YEAR ZERO
// Baseado em AttributeComponents.jsx versão 3.1.1
// Versão 3.1.0 - FIX: Corrigida acentuação dos nomes dos atributos para compatibilidade com frontend
// REMOVIDO: Referências a armor_data que não existe no schema
// ADICIONADO: Campos corretos do schema (armadura, carga_armadura, nivel_armadura, armas)
// CORRIGIDO: Nomes dos atributos com acentuação correta em português brasileiro

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('=== SEED YEAR ZERO ESPECÍFICO ===')
    console.log('Baseado em AttributeComponents.jsx versão 3.1.1')
    console.log('Versão 3.1.0 - FIX: Acentuação corrigida para compatibilidade com frontend')
    console.log('Iniciando seed específico para Year Zero...')

    // ============================================
    // 1. VERIFICAR SE JÁ EXISTEM DADOS
    // ============================================
    console.log('Verificando dados existentes no banco...')
    const existingAttrs = await prisma.yearZeroAttribute.count()
    const existingSkills = await prisma.yearZeroSkill.count()
    
    if (existingAttrs > 0 && existingSkills > 0) {
        console.log('Dados Year Zero já existem no banco')
        console.log('Atributos encontrados:', existingAttrs, 'Skills encontradas:', existingSkills)
        
        // Verificar os nomes dos atributos existentes
        const atributosExistentes = await prisma.yearZeroAttribute.findMany({
            select: { name: true }
        })
        
        console.log('Nomes dos atributos atuais no banco:')
        atributosExistentes.forEach(attr => {
            console.log('-', attr.name)
        })
        
        // Verificar se os nomes estão corretos (com acentos)
        const nomesEsperados = ['Força', 'Agilidade', 'Inteligência', 'Empatia']
        const nomesFaltantes = nomesEsperados.filter(nome => 
            !atributosExistentes.some(attr => attr.name === nome)
        )
        
        if (nomesFaltantes.length > 0) {
            console.log('ATENÇÃO: Atributos com nomes incorretos encontrados')
            console.log('Atributos faltando acentuação:', nomesFaltantes.join(', '))
            console.log('Executando correção de acentuação...')
            await corrigirAcentuacaoAtributos()
        } else {
            console.log('Atributos já estão com acentuação correta')
        }
        
        // Verificar se precisa atualizar os personagens com novos campos
        await atualizarCamposPersonagens()
        return
    }

    // ============================================
    // 2. LIMPAR APENAS DADOS YEAR ZERO
    // ============================================
    console.log('Limpando dados Year Zero existentes...')
    
    // Ordem correta para evitar erros de chave estrangeira
    await prisma.yearZeroCharacterSkill.deleteMany({})
    await prisma.yearZeroCharacterAttribute.deleteMany({})
    await prisma.yearZeroSkill.deleteMany({})
    await prisma.yearZeroAttribute.deleteMany({})
    
    console.log('Dados Year Zero limpos')

    // ============================================
    // 3. CRIAR ATRIBUTOS YEAR ZERO COM ACENTUAÇÃO CORRETA
    // ============================================
    console.log('=== CRIANDO ATRIBUTOS YEAR ZERO ===')
    console.log('Baseado em attributeSkillMap do AttributeComponents.jsx')
    console.log('Usando acentuação correta em português brasileiro')
    
    const yearZeroAttributes = [
        { 
            name: 'Força', 
            description: 'Atributo físico e combate corpo a corpo' 
        },
        { 
            name: 'Agilidade', 
            description: 'Atributo de destreza e movimentação' 
        },
        { 
            name: 'Inteligência', 
            description: 'Atributo mental e conhecimento' 
        },
        { 
            name: 'Empatia', 
            description: 'Atributo social e influência' 
        }
    ]

    await prisma.yearZeroAttribute.createMany({
        data: yearZeroAttributes
    })

    console.log('4 atributos Year Zero criados com acentuação correta:')
    yearZeroAttributes.forEach(attr => {
        console.log('-', attr.name, '-', attr.description)
    })

    // ============================================
    // 4. CRIAR SKILLS YEAR ZERO
    // ============================================
    console.log('=== CRIANDO SKILLS YEAR ZERO ===')
    console.log('Baseado em attributeSkillMap do AttributeComponents.jsx')
    
    const yearZeroSkills = [
        // Força
        { 
            name: 'COMBATE CORPO A CORPO', 
            description: 'Luta com armas brancas e combate físico' 
        },
        { 
            name: 'MAQUINÁRIO PESADO', 
            description: 'Operação de veículos e maquinário pesado' 
        },
        { 
            name: 'RESISTÊNCIA', 
            description: 'Resistência física e suportar condições adversas' 
        },
        
        // Agilidade
        { 
            name: 'COMBATE À DISTÂNCIA', 
            description: 'Uso de armas de fogo e arremesso' 
        },
        { 
            name: 'MOBILIDADE', 
            description: 'Movimentação rápida e evasiva' 
        },
        { 
            name: 'PILOTAGEM', 
            description: 'Controle de veículos e pilotagem' 
        },
        
        // Inteligência
        { 
            name: 'OBSERVAÇÃO', 
            description: 'Percepção de detalhes e ambiente' 
        },
        { 
            name: 'SOBREVIVÊNCIA', 
            description: 'Sobrevivência em ambientes hostis' 
        },
        { 
            name: 'TECNOLOGIA', 
            description: 'Uso e compreensão de tecnologia' 
        },
        
        // Empatia
        { 
            name: 'MANIPULAÇÃO', 
            description: 'Influenciar e manipular pessoas' 
        },
        { 
            name: 'COMANDO', 
            description: 'Liderança e comando de grupo' 
        },
        { 
            name: 'AJUDA MÉDICA', 
            description: 'Primeiros socorros e medicina' 
        }
    ]

    await prisma.yearZeroSkill.createMany({
        data: yearZeroSkills
    })

    console.log('12 skills Year Zero criadas:')
    console.log('Força: COMBATE CORPO A CORPO, MAQUINÁRIO PESADO, RESISTÊNCIA')
    console.log('Agilidade: COMBATE À DISTÂNCIA, MOBILIDADE, PILOTAGEM')
    console.log('Inteligência: OBSERVAÇÃO, SOBREVIVÊNCIA, TECNOLOGIA')
    console.log('Empatia: MANIPULAÇÃO, COMANDO, AJUDA MÉDICA')

    // ============================================
    // 5. VERIFICAR INTEGRIDADE COM O COMPONENTE
    // ============================================
    console.log('=== VERIFICAÇÃO DE INTEGRIDADE ===')
    console.log('Verificando correspondência com AttributeComponents.jsx...')
    
    const createdAttrs = await prisma.yearZeroAttribute.findMany({
        orderBy: { name: 'asc' }
    })
    
    const createdSkills = await prisma.yearZeroSkill.findMany({
        orderBy: { name: 'asc' }
    })
    
    const expectedSkillMap = {
        'Força': ['COMBATE CORPO A CORPO', 'MAQUINÁRIO PESADO', 'RESISTÊNCIA'],
        'Agilidade': ['COMBATE À DISTÂNCIA', 'MOBILIDADE', 'PILOTAGEM'],
        'Inteligência': ['OBSERVAÇÃO', 'SOBREVIVÊNCIA', 'TECNOLOGIA'],
        'Empatia': ['MANIPULAÇÃO', 'COMANDO', 'AJUDA MÉDICA']
    }
    
    let allSkillsExist = true
    const missingSkills = []
    
    for (const [attributeName, skillNames] of Object.entries(expectedSkillMap)) {
        const attrExists = createdAttrs.some(a => a.name === attributeName)
        
        if (!attrExists) {
            console.log('Atributo "' + attributeName + '" não encontrado no banco!')
            allSkillsExist = false
        }
        
        for (const skillName of skillNames) {
            const skillExists = createdSkills.some(s => s.name === skillName)
            
            if (!skillExists) {
                missingSkills.push(skillName + ' (' + attributeName + ')')
                allSkillsExist = false
            }
        }
    }
    
    if (allSkillsExist) {
        console.log('Todos os atributos e skills correspondem ao componente')
        console.log('Mapeamento attributeSkillMap está completo')
        console.log('Acentuação verificada e correta')
    } else {
        console.log('Problemas encontrados:')
        if (missingSkills.length > 0) {
            console.log('Skills faltando:', missingSkills.join(', '))
        }
    }

    // ============================================
    // 6. ATUALIZAR PERSONAGENS EXISTENTES
    // ============================================
    console.log('=== ATUALIZANDO PERSONAGENS YEAR ZERO ===')
    console.log('Adicionando campos específicos do sistema...')
    
    await atualizarCamposPersonagens()
}

// Função para corrigir acentuação dos atributos existentes
async function corrigirAcentuacaoAtributos() {
    console.log('Iniciando correção de acentuação dos atributos...')
    
    // Mapeamento de nomes sem acento para nomes com acento
    const correcoesAcentuacao = {
        'Forca': 'Força',
        'Inteligencia': 'Inteligência',
        'Empatia': 'Empatia' // Já está correto, mas mantém para consistência
    }
    
    let correcoesAplicadas = 0
    
    for (const [nomeErrado, nomeCorreto] of Object.entries(correcoesAcentuacao)) {
        // Verificar se existe atributo com nome errado
        const atributoErrado = await prisma.yearZeroAttribute.findFirst({
            where: { name: nomeErrado }
        })
        
        if (atributoErrado) {
            console.log(`Corrigindo atributo: "${nomeErrado}" -> "${nomeCorreto}"`)
            
            // Atualizar o nome do atributo
            await prisma.yearZeroAttribute.update({
                where: { id: atributoErrado.id },
                data: { name: nomeCorreto }
            })
            
            correcoesAplicadas++
            
            // Também atualizar qualquer referência em yearZeroCharacterAttribute
            await prisma.yearZeroCharacterAttribute.updateMany({
                where: { attribute_id: atributoErrado.id },
                data: { 
                    // Nota: O campo attribute_id não precisa ser atualizado, 
                    // pois a relação é por ID, não por nome
                }
            })
        }
    }
    
    console.log(`Correção de acentuação concluída: ${correcoesAplicadas} atributos corrigidos`)
    
    // Verificar resultado
    const atributosAtualizados = await prisma.yearZeroAttribute.findMany({
        orderBy: { name: 'asc' }
    })
    
    console.log('Atributos após correção:')
    atributosAtualizados.forEach(attr => {
        console.log('-', attr.name)
    })
}

// Função para atualizar campos dos personagens
async function atualizarCamposPersonagens() {
    const yearZeroChars = await prisma.character.findMany({
        where: { rpg_system: 'year_zero' },
        select: { id: true, name: true }
    })
    
    console.log('Personagens Year Zero encontrados:', yearZeroChars.length)
    
    if (yearZeroChars.length > 0) {
        console.log('IDs:', yearZeroChars.map(c => c.id + ':"' + c.name + '"').join(', '))
        
        // Atualizar cada personagem com todos os novos campos
        for (const character of yearZeroChars) {
            const updateData = {
                equipment_notes: '',
                tiny_items: '',
                emotional_item: '',
                health_squares: JSON.stringify(Array(10).fill(false)),
                stress_squares: JSON.stringify(Array(10).fill(false)),
                personal_goal: '',
                camarada: '',
                rival: '',
                career: '',
                appearance: '',
                talents: JSON.stringify(['', '', '', '']),
                armadura: '',
                carga_armadura: '',
                nivel_armadura: '',
                armas: JSON.stringify([]),
                experience_squares: JSON.stringify(Array(10).fill(false)),
                history_squares: JSON.stringify(Array(3).fill(false)),
                radiation_squares: JSON.stringify(Array(10).fill(false))
            }
            
            // Verificar quais campos já existem para não sobrescrever dados
            const existingChar = await prisma.character.findUnique({
                where: { id: character.id },
                select: {
                    equipment_notes: true,
                    tiny_items: true,
                    emotional_item: true,
                    health_squares: true,
                    stress_squares: true,
                    personal_goal: true,
                    camarada: true,
                    rival: true,
                    career: true,
                    appearance: true,
                    talents: true,
                    armadura: true,
                    carga_armadura: true,
                    nivel_armadura: true,
                    armas: true,
                    experience_squares: true,
                    history_squares: true,
                    radiation_squares: true
                }
            })
            
            // Manter dados existentes ou usar valores padrão
            const camposParaPreservar = [
                'equipment_notes',
                'tiny_items',
                'emotional_item',
                'health_squares',
                'stress_squares',
                'personal_goal',
                'camarada',
                'rival',
                'career',
                'appearance',
                'talents',
                'armadura',
                'carga_armadura',
                'nivel_armadura',
                'armas',
                'experience_squares',
                'history_squares',
                'radiation_squares'
            ]
            
            camposParaPreservar.forEach(campo => {
                if (existingChar && existingChar[campo] !== null && existingChar[campo] !== '') {
                    delete updateData[campo]
                }
            })
            
            // Apenas atualizar se houver campos para atualizar
            if (Object.keys(updateData).length > 0) {
                await prisma.character.update({
                    where: { id: character.id },
                    data: updateData
                })
                
                console.log('Personagem', character.name, 'atualizado com', 
                    Object.keys(updateData).length, 'novos campos')
            } else {
                console.log('Personagem', character.name, 'já possui todos os campos')
            }
        }
        
        console.log('Campos atualizados nos personagens existentes')
        console.log('- equipment_notes: inventário completo')
        console.log('- tiny_items: itens minúsculos')
        console.log('- emotional_item: item emocional')
        console.log('- health_squares: quadrados de vida (10)')
        console.log('- stress_squares: quadrados de estresse (10)')
        console.log('- personal_goal: meta pessoal do personagem')
        console.log('- camarada: aliado do personagem')
        console.log('- rival: adversário do personagem')
        console.log('- career: carreira/profissão')
        console.log('- appearance: aparência física')
        console.log('- talents: talentos especiais (array JSON)')
        console.log('- armadura: nome da armadura')
        console.log('- carga_armadura: carga da armadura')
        console.log('- nivel_armadura: nível da armadura')
        console.log('- armas: lista de armas em JSON')
        console.log('- experience_squares: quadrados de experiência (10)')
        console.log('- history_squares: quadrados de história (3)')
        console.log('- radiation_squares: quadrados de radiação (10)')
        
        console.log('Notas sobre radiação:')
        console.log('- RadiationTracker.jsx versão 2.0.3')
        console.log('- 10 quadrados para níveis de radiação')
        console.log('- Níveis 8+ são considerados perigosos')
        console.log('- Usa array JSON de booleanos (true/false)')
    } else {
        console.log('Nenhum personagem Year Zero encontrado para atualizar')
    }
}

// ============================================
// 7. RESUMO FINAL
// ============================================
async function mostrarResumoFinal() {
    console.log('=== RESUMO DO SEED YEAR ZERO ===')
    console.log('Seed específico para Year Zero concluído!')
    console.log('Versão 3.1.0 - FIX: Acentuação corrigida para compatibilidade com frontend')
    
    // Estatísticas
    const createdAttrs = await prisma.yearZeroAttribute.findMany()
    const createdSkills = await prisma.yearZeroSkill.findMany()
    const yearZeroChars = await prisma.character.findMany({
        where: { rpg_system: 'year_zero' }
    })
    
    console.log('Estatísticas:')
    console.log('- Atributos Year Zero:', createdAttrs.length, '/4')
    console.log('- Skills Year Zero:', createdSkills.length, '/12')
    console.log('- Personagens Year Zero:', yearZeroChars.length)
    
    console.log('Verificação de acentuação:')
    createdAttrs.forEach(attr => {
        console.log('-', attr.name, '✓' )
    })
    
    console.log('Formatação de nomes (AttributeComponents.jsx):')
    console.log('- "COMBATE CORPO A CORPO" -> "CORPO A\\nCORPO"')
    console.log('- "MAQUINÁRIO PESADO" -> "MAQUINÁRIO\\nPESADO"')
    console.log('- "COMBATE À DISTÂNCIA" -> "COMBATE\\nÀ DISTÂNCIA"')
    console.log('- "AJUDA MÉDICA" -> "AJUDA MÉDICA" (sem quebra)')
    
    console.log('Sistema Year Zero completo!')
    console.log('Todos os componentes principais implementados:')
    console.log('1. AttributeComponents.jsx - Atributos e skills básicas')
    console.log('2. EquipmentNotepad.jsx - Equipamentos e inventário')
    console.log('3. HealthStressTracker.jsx - Vida e estresse')
    console.log('4. PersonalMetaTalents.jsx - Meta, relacionamentos e talentos')
    console.log('5. ArmasArmadura.jsx - Sistema de combate')
    console.log('6. ExperienceHistoryTracker.jsx - Progresso do personagem')
    console.log('7. RadiationTracker.jsx - Sistema de radiação')
    
    console.log('Resumo completo dos campos disponíveis:')
    console.log('- Básicos: name, description, rpg_system')
    console.log('- Equipamento: equipment_notes, tiny_items, emotional_item')
    console.log('- Saúde: health_squares, stress_squares')
    console.log('- Personagem: personal_goal, camarada, rival, career, appearance')
    console.log('- Progresso: talents, experience_squares, history_squares')
    console.log('- Combate: armadura, carga_armadura, nivel_armadura, armas')
    console.log('- Ambiente: radiation_squares')
    
    // Verificar estrutura dos campos para um personagem de exemplo
    if (yearZeroChars.length > 0) {
        const sampleChar = await prisma.character.findUnique({
            where: { id: yearZeroChars[0].id },
            select: {
                id: true,
                name: true,
                equipment_notes: true,
                personal_goal: true,
                armadura: true,
                carga_armadura: true,
                nivel_armadura: true,
                armas: true,
                health_squares: true,
                stress_squares: true,
                experience_squares: true,
                history_squares: true,
                radiation_squares: true
            }
        })
        
        console.log('Exemplo de estrutura final para personagem:')
        console.log('- ID:', sampleChar.id)
        console.log('- Nome:', sampleChar.name)
        console.log('- Equipamentos:', sampleChar.equipment_notes ? 'Configurados' : 'Não configurados')
        console.log('- Meta pessoal:', sampleChar.personal_goal || '(não definida)')
        console.log('- Armadura:', sampleChar.armadura || '(não configurada)')
        console.log('- Carga armadura:', sampleChar.carga_armadura || '(vazio)')
        console.log('- Nível armadura:', sampleChar.nivel_armadura || '(vazio)')
        console.log('- Armas:', sampleChar.armas ? 'Configuradas' : 'Não configuradas')
        console.log('- Quadrados vida:', sampleChar.health_squares ? 'Configurados' : 'Não configurados')
        console.log('- Quadrados estresse:', sampleChar.stress_squares ? 'Configurados' : 'Não configurados')
        console.log('- Quadrados experiência:', sampleChar.experience_squares ? 'Configurados' : 'Não configurados')
        console.log('- Quadrados história:', sampleChar.history_squares ? 'Configurados' : 'Não configurados')
        console.log('- Quadrados radiação:', sampleChar.radiation_squares ? 'Configurados' : 'Não configurados')
        
        console.log('')
        console.log('Próximo passo: Configurar a ficha completa Year Zero')
        console.log('com todos os componentes integrados no layout principal.')
    }
}

// Executar o seed específico
main()
    .then(async () => {
        await mostrarResumoFinal()
    })
    .catch((error) => {
        console.error('ERRO NO SEED YEAR ZERO:', error)
        console.error('Detalhes:', error.message)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        console.log('Conexão com banco encerrada')
    })