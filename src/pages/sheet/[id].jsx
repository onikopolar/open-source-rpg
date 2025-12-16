// src/pages/sheet/[id].jsx - VERSÃO REFATORADA CORRIGIDA (SEM STATUSBAR DUPLICADO)
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { 
  Container, 
  Button, 
  Box, 
  Typography, 
  Alert, 
  CircularProgress,
  Collapse,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Casino } from '@mui/icons-material';

import { api } from '../../utils';
import socket from '../../utils/socket';

import {
  Header, 
  Section
} from '../../components';

import SheetSelector from '../../components/sheets/SheetSelector';
import YearZeroSheet from '../../components/sheets/YearZeroSheet';
import FeiticeirosSheet from '../../components/sheets/FeiticeirosSheet';

import useModal from '../../hooks/useModal';
import { prisma } from '../../database';

// Importações da refatoração
import { 
  useCharacterSheet,
  CharacterInfoSection,
  RPGSystemSelector,
  ClassicSystem,
  validateCharacterId,
  safeSerializeCharacter,
  validateNumericInput,
  createHandlers,
  createModals
} from './index';

// SSR (mantido igual)
export const getServerSideProps = async ({ params }) => {
  try {
    const characterId = validateCharacterId(params?.id);

    if (!characterId) {
      return {
        props: {
          character: null,
          error: 'ID do personagem inválido'
        }
      };
    }

    // Buscar personagem com todas as relações necessárias
    const character = await prisma.character.findUnique({
      where: {
        id: characterId
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
    });

    // Auto-setup para Year Zero se necessário
    if (character?.rpg_system === 'year_zero' && 
        (!character.yearzero_attributes || character.yearzero_attributes.length === 0)) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const setupResponse = await fetch(`${baseUrl}/api/yearzero/setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            character_id: characterId
          })
        });
        
        if (setupResponse.ok) {
          const updatedCharacter = await prisma.character.findUnique({
            where: { id: characterId },
            include: {
              attributes: { include: { attribute: true } },
              skills: { include: { skill: true } },
              yearzero_attributes: { include: { attribute: true } },
              yearzero_skills: { include: { skill: true } },
              feiticeiros_attributes: { include: { attribute: true } },
              feiticeiros_pericias: true,
              feiticeiros_oficios: true,
              feiticeiros_resistencias: true,
              feiticeiros_ataques: true
            }
          });
          
          if (updatedCharacter) {
            character.yearzero_attributes = updatedCharacter.yearzero_attributes;
            character.yearzero_skills = updatedCharacter.yearzero_skills;
          }
        }
      } catch (error) {
        console.error('Erro no auto-setup Year Zero:', error);
        // Não falhar o SSR por causa do auto-setup
      }
    }

    if (!character) {
      return {
        props: {
          character: null,
          error: 'Personagem não encontrado'
        }
      };
    }

    const serializedCharacter = safeSerializeCharacter(character);

    return {
      props: {
        rawCharacter: serializedCharacter,
        error: null
      }
    };
  } catch (error) {
    console.error('Erro crítico no SSR:', error);
    return {
      props: {
        character: null,
        error: 'Erro interno do servidor'
      }
    };
  }
};

// Componente principal da ficha do personagem (REFATORADO)
function CharacterSheet({ rawCharacter, error: serverError }) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const refreshData = useCallback(() => {
    return router.replace(router.asPath);
  }, [router]);

  // Usar hook refatorado
  const {
    character,
    setCharacter,
    attributeValues,
    setAttributeValues,
    skillValues,
    setSkillValues,
    yearZeroAttributeValues,
    setYearZeroAttributeValues,
    yearZeroSkillValues,
    setYearZeroSkillValues,
    rpgSystem,
    isChangingSystem,
    loadingStates,
    setLoading,
    errors,
    handleApiError,
    clearError,
    isSelectorExpanded,
    isSheetExpanded,
    isFirstTime,
    isInitialized,
    handleSystemChange: originalHandleSystemChange
  } = useCharacterSheet(rawCharacter, refreshData);
  
  // Wrapper para handleSystemChange que inclui o api
  const handleSystemChange = useCallback((newSystem) => {
    return originalHandleSystemChange(newSystem, api);
  }, [originalHandleSystemChange]);

  // Criar handlers
  const handlers = createHandlers({
    character,
    setCharacter,
    attributeValues,
    setAttributeValues,
    skillValues,
    setSkillValues,
    yearZeroAttributeValues,
    setYearZeroAttributeValues,
    yearZeroSkillValues,
    setYearZeroSkillValues,
    rpgSystem,
    setLoading,
    clearError,
    handleApiError,
    loadingStates,
    errors
  });

  // Criar modais
  const modals = createModals(useModal, handlers);

  // Adicionar yearZeroDiceModal aos handlers
  const enhancedHandlers = {
    ...handlers,
    handleYearZeroAttributeRoll: (attributeName, attributeValue, stressCount, stressSquares) => {
      if (!character?.id) return;
      
      modals.yearZeroDiceModal.appear({
        characterId: character.id,
        baseDice: attributeValue,
        skillDice: 0,
        gearDice: 0,
        attributeName: attributeName,
        skillName: '',
        character: character,
        stressSquares: stressSquares
      });
    },
    handleYearZeroSkillRoll: (skillName, skillValue, stressCount, stressSquares) => {
      if (!character?.id) return;
      
      const skillToAttributeMap = {
        "COMBATE CORPO A CORPO": "Força",
        "MAQUINÁRIO PESADO": "Força",
        "RESISTÊNCIA": "Força",
        "COMBATE À DISTÂNCIA": "Agilidade",
        "MOBILIDADE": "Agilidade",
        "PILOTAGEM": "Agilidade",
        "OBSERVAÇÃO": "Inteligência",
        "SOBREVIVÊNCIA": "Inteligência",
        "TECNOLOGIA": "Inteligência",
        "MANIPULAÇÃO": "Empatia",
        "COMANDO": "Empatia",
        "AJUDA MÉDICA": "Empatia"
      };
      
      const relatedAttribute = skillToAttributeMap[skillName] || 'Força';
      
      const attribute = character.yearzero_attributes?.find(attr => 
        attr.attribute?.name === relatedAttribute
      );
      const attributeValue = attribute ? parseInt(attribute.value) || 0 : 0;
      
      modals.yearZeroDiceModal.appear({
        characterId: character.id,
        baseDice: attributeValue,
        skillDice: parseInt(skillValue) || 0,
        gearDice: 0,
        attributeName: relatedAttribute,
        skillName: skillName,
        character: character,
        stressSquares: stressSquares
      });
    }
  };

  // Socket para atualizações em tempo real
  useEffect(() => {
    if (!socket || !character?.id) return;

    const handleCharacterUpdated = (data) => {
      if (data.id === character.id) {
        console.log('Character atualizado via socket');
        refreshData();
      }
    };

    socket.on('characterUpdated', handleCharacterUpdated);

    return () => {
      socket.off('characterUpdated', handleCharacterUpdated);
    };
  }, [character, refreshData]);

  // Estados de carregamento
  if (!isInitialized) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Header />
        <CircularProgress sx={{ mt: 4 }} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Carregando ficha...
        </Typography>
      </Box>
    );
  }

  // Tratamento de erros
  if (serverError || !character) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Header />
        <Alert severity="error" sx={{ mt: 2 }}>
          {serverError || 'Personagem não encontrado'}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => {
            router.push('/dashboard');
          }}
        >
          Voltar para o Dashboard
        </Button>
      </Box>
    );
  }
  
  // Renderização principal
  return (
    <>
      <Head>
        <title>{`${character.name} - RPG System`}</title>
        <meta name="description" content={`Ficha do personagem ${character.name}`} />
      </Head>

      <Header />

      <Container maxWidth="lg" sx={{ py: 2, px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Alertas de erro */}
        {Object.keys(errors).map(errorKey => (
          <Alert 
            key={errorKey} 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => {
              clearError(errorKey);
            }}
          >
            {errors[errorKey]}
          </Alert>
        ))}

        {/* Seção de informações do personagem */}
        <Section title="Informações do Personagem">
          <CharacterInfoSection
            character={character}
            isMobile={isMobile}
            changePictureModal={modals.changePictureModal}
            loadingStates={loadingStates}
            handleCharacterInfoSubmit={enhancedHandlers.handleCharacterInfoSubmit}
            refreshData={refreshData}
          />
        </Section>

        {/* Seletor de sistema RPG */}
        <RPGSystemSelector
          isSelectorExpanded={isSelectorExpanded}
          isFirstTime={isFirstTime}
          rpgSystem={rpgSystem}
          handleSystemChange={handleSystemChange}
          character={character}
          isChangingSystem={isChangingSystem}
          isMobile={isMobile}
        />

        {/* Ficha do sistema selecionado */}
        <Collapse in={isSheetExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 3,
              p: 2,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 0
            }}>
              <Typography variant="h5" fontWeight="bold" sx={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
                Ficha - {rpgSystem === 'year_zero' ? 'Year Zero Engine' : rpgSystem === 'feiticeiros' ? 'Feiticeiros & Maldições' : 'Sistema Clássico'}
              </Typography>
            </Box>

            {rpgSystem === 'year_zero' ? (
              <YearZeroSheet 
                character={character}
                attributes={character.yearzero_attributes?.map(attr => ({
                  name: attr.attribute?.name,
                  year_zero_value: yearZeroAttributeValues[attr.attribute_id] || attr.value || 0
                })) || []}
                skills={character.yearzero_skills?.map(skill => ({
                  name: skill.skill?.name,
                  year_zero_value: yearZeroSkillValues[skill.skill_id] || skill.value || 0
                })) || []}
                onUpdate={enhancedHandlers.handleYearZeroUpdate}
                onAttributeRoll={(attributeName, attributeValue, stressCount, stressSquares) => 
                  enhancedHandlers.handleYearZeroAttributeRoll(attributeName, attributeValue, stressCount, stressSquares)
                }
                onSkillRoll={(skillName, skillValue, stressCount, stressSquares) => 
                  enhancedHandlers.handleYearZeroSkillRoll(skillName, skillValue, stressCount, stressSquares)
                }
                onQuickHeal={(amount) => enhancedHandlers.handleQuickHealthChange(amount, 'heal')}
                onQuickDamage={(amount) => enhancedHandlers.handleQuickHealthChange(amount, 'damage')}
                loadingStates={loadingStates}
                errors={errors}
                isMobile={isMobile}
              />
            ) : rpgSystem === 'feiticeiros' ? (
              <FeiticeirosSheet 
                character={character}
                onUpdate={enhancedHandlers.handleFeiticeirosUpdate}
                onQuickHeal={(amount) => enhancedHandlers.handleQuickHealthChange(amount, 'heal')}
                onQuickDamage={(amount) => enhancedHandlers.handleQuickHealthChange(amount, 'damage')}
                loadingStates={loadingStates}
                errors={errors}
                isMobile={isMobile}
              />
            ) : (
              // Sistema clássico - APENAS ClassicSystem (sem StatusBar duplicado)
              <ClassicSystem
                character={character}
                attributeDiceModal={modals.attributeDiceModal}
                diceRollModal={modals.diceRollModal}
                statusBarModal={modals.statusBarModal}
                loadingStates={loadingStates}
                errors={errors}
                isMobile={isMobile}
                getAttributeValue={(charAttr) => enhancedHandlers.getAttributeValue(charAttr)}
                getSkillValue={(charSkill) => enhancedHandlers.getSkillValue(charSkill)}
                handleAttributeChange={(attributeId, newValue) => enhancedHandlers.handleAttributeChange(attributeId, newValue)}
                handleSkillChange={(skillId, newValue) => enhancedHandlers.handleSkillChange(skillId, newValue)}
                saveAttributeValue={(attributeId) => enhancedHandlers.saveAttributeValue(attributeId)}
                saveSkillValue={(skillId) => enhancedHandlers.saveSkillValue(skillId)}
                validateNumericInput={validateNumericInput}
                handleQuickHealthChange={(amount, type) => enhancedHandlers.handleQuickHealthChange(amount, type)}
                attributeValues={attributeValues}
                skillValues={skillValues}
              />
            )}
          </Box>
        </Collapse>

        {/* Botão de rolagem de dados */}
        <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
          <Button
            variant="contained"
            size={isMobile ? "medium" : "large"}
            onClick={() => {
              modals.diceRollModal.appear({
                characterId: character.id,
                characterName: character.name
              });
            }}
            sx={{ 
              px: isMobile ? 3 : 4,
              py: isMobile ? 1.5 : 2
            }}
            startIcon={<Casino />}
          >
            Rolar Dados
          </Button>
        </Box>
      </Container>

      {/* Renderização dos modais */}
      {modals.attributeDiceModal.isOpen && modals.attributeDiceModal.content}
      {modals.diceRollModal.isOpen && modals.diceRollModal.content}
      {modals.statusBarModal.isOpen && modals.statusBarModal.content}
      {modals.changePictureModal.isOpen && modals.changePictureModal.content}
      {modals.yearZeroDiceModal.isOpen && modals.yearZeroDiceModal.content}
    </>
  );
}

export default CharacterSheet;