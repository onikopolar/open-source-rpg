import React, { useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Favorite,
  Psychology,
  FitnessCenter,
  DirectionsRun,
  Security,
  LocalHospital,
  Add,
  Remove,
  Info
} from '@mui/icons-material';

const YearZeroSheet = ({ 
  character, 
  attributeDiceModal, 
  diceRollModal,
  onQuickHeal,
  onQuickDamage
}) => {
  const [stress, setStress] = useState(0);
  const [armor, setArmor] = useState(0);
  const [pushDice, setPushDice] = useState(false);

  // Agrupar atributos por tipo para organizacao visual
  const physicalAttributes = character.attributes?.filter(attr => 
    ['Força', 'Destreza', 'Constituição', 'Agilidade'].includes(attr.attribute.name)
  ) || [];

  const mentalAttributes = character.attributes?.filter(attr => 
    ['Inteligência', 'Sabedoria', 'Carisma', 'Percepção'].includes(attr.attribute.name)
  ) || [];

  // Habilidades especificas do Year Zero Engine
  const yearZeroSkills = [
    { name: 'Combate Corpo a Corpo', value: '0', category: 'Combate' },
    { name: 'Combate à Distância', value: '0', category: 'Combate' },
    { name: 'Furtividade', value: '0', category: 'Sobrevivência' },
    { name: 'Sobrevivência', value: '0', category: 'Sobrevivência' },
    { name: 'Persuasão', value: '0', category: 'Social' },
    { name: 'Intimidação', value: '0', category: 'Social' },
    { name: '
