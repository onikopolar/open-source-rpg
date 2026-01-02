// NO YearZeroSheet.jsx, na parte dos estilos, adicione:
const mainStyles = (theme) => ({
  container: {
    padding: '20px',
    maxWidth: '950px',
    margin: '0 auto',
    display: 'flex',
    gap: '20px',
    minHeight: '600px',
    background: 'transparent',
    borderRadius: '8px',
    position: 'relative'
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '200px',
    flexShrink: 0
  },
  attributesContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '6px',
    position: 'relative',
    padding: '10px',
    minHeight: '500px',
    backdropFilter: 'blur(10px)'
  },
  diamondCore: {
    position: 'relative',
    width: '300px',
    height: '300px',
    margin: '0 auto'
  },
  // Incorporar estilos dos componentes
  ...healthStressStyles(theme),
  ...diamondWebStyles(theme),
  ...attributeComponentsStyles(theme),
  ...equipmentNotepadStyles(theme)
});

// E na parte do return, mude para:
return (
  <>
    <Box className={classes.container}>
      <Box className={classes.leftPanel}>
        <HealthStressTracker 
          classes={classes}
          healthSquares={healthSquares}
          stressSquares={stressSquares}
          onHealthUpdate={handleHealthUpdate}
          onStressUpdate={handleStressUpdate}
        />
        <EquipmentNotepad
          classes={classes}
          character={character}
          onSave={handleEquipmentSave}
        />
      </Box>
      <Box className={classes.attributesContainer}>
        <Box className={classes.diamondCore}>
          <DiamondWeb classes={classes} />
          {Object.entries({
            'Força': { 
              position: classes.positionTop, 
              skills: { 
                0: 'COMBATE CORPO A CORPO', 
                1: 'MAQUINÁRIO PESADO', 
                2: 'RESISTÊNCIA' 
              }
            },
            'Agilidade': { 
              position: classes.positionLeft, 
              skills: { 
                0: 'COMBATE À DISTÂNCIA', 
                1: 'MOBILIDADE', 
                2: 'PILOTAGEM' 
              }
            },
            'Inteligência': { 
              position: classes.positionRight, 
              skills: { 
                0: 'OBSERVAÇÃO', 
                1: 'SOBREVIVÊNCIA', 
                2: 'TECNOLOGIA' 
              }
            },
            'Empatia': { 
              position: classes.positionBottom, 
              skills: { 
                0: 'MANIPULAÇÃO', 
                1: 'COMANDO', 
                2: 'AJUDA MÉDICA' 
              }
            }
          }).map(([attributeName, config]) => (
            <AttributeWithSkills
              key={attributeName}
              attributeName={attributeName}
              config={config}
            />
          ))}
        </Box>
      </Box>
    </Box>
  </>
);
