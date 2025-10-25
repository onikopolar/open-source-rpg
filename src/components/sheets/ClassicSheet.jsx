import { Grid, Box } from '@mui/material';
import { Section, SheetEditableRow } from '../../components';

const ClassicSheet = ({ character, onRoll, onSkillChange }) => {
  return (
    <>
      <Section title="Atributos">
        <Grid container spacing={2}>
          {character.attributes?.map((charAttr) => (
            <Grid item xs={12} md={6} key={charAttr.attribute.id}>
              <Box sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography variant="h6" sx={{ minWidth: 120, fontWeight: 'bold' }}>
                  {charAttr.attribute.name}
                </Typography>
                
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => onRoll({
                    characterId: character.id,
                    characterName: character.name,
                    attributeName: charAttr.attribute.name,
                    attributeValue: charAttr.value
                  })}
                >
                  Rolar
                </Button>
                
                <TextField
                  value={charAttr.value || ''}
                  variant="outlined"
                  size="small"
                  sx={{ width: 80 }}
                  inputProps={{
                    style: { textAlign: 'center', padding: '8px' },
                    inputMode: 'numeric',
                    pattern: '[0-9]*'
                  }}
                  onBlur={(e) => {
                    // Implementar salvamento do atributo
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    // Atualizar estado local
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section title="Habilidades">
        <Grid container spacing={2}>
          {character.skills?.map((charSkill) => (
            <Grid item xs={12} md={6} key={charSkill.skill.id}>
              <SheetEditableRow
                characterId={character.id}
                title={charSkill.skill.name}
                value={charSkill.value}
                skillId={charSkill.skill.id}
                onRoll={() => onRoll({
                  characterId: character.id,
                  characterName: character.name,
                  skillName: charSkill.skill.name,
                  skillValue: charSkill.value
                })}
                onValueChange={onSkillChange}
              />
            </Grid>
          ))}
        </Grid>
      </Section>
    </>
  );
};

export default ClassicSheet;
