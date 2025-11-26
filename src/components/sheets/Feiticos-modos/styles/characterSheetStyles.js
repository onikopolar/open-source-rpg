// styles/characterSheetStyles.js
export const styles = (theme) => ({
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    background: 'transparent',
    borderRadius: '8px',
    position: 'relative',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.9) 0%, rgba(74, 122, 156, 0.8) 100%)',
    borderRadius: '8px',
    color: 'white',
    boxShadow: '0 4px 12px rgba(99, 158, 194, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  setupButton: {
    background: 'linear-gradient(135deg, #639EC2 0%, #4a7a9c 100%)',
    color: 'white',
    fontWeight: 'bold',
    marginTop: '10px',
    '&:hover': {
      background: 'linear-gradient(135deg, #7ab3d9 0%, #5b8bb3 100%)',
    },
    '&:disabled': {
      background: 'rgba(140, 140, 140, 0.3)',
      color: 'rgba(255, 255, 255, 0.5)',
    }
  },
  characterInfoSection: {
    marginBottom: '30px',
  },
  characterInfoCard: {
    background: 'linear-gradient(135deg, rgba(43, 43, 43, 0.95) 0%, rgba(32, 30, 30, 0.98) 100%)',
    border: '3px solid rgba(99, 158, 194, 0.4)',
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(99, 158, 194, 0.15)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 158, 194, 0.25)',
      transform: 'translateY(-2px)',
      borderColor: 'rgba(99, 158, 194, 0.6)',
    }
  },
  characterInfoGrid: {
    marginTop: '10px',
  },
  infoFieldCard: {
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.1) 0%, rgba(74, 122, 156, 0.05) 100%)',
    border: '2px solid rgba(99, 158, 194, 0.3)',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 6px 20px rgba(99, 158, 194, 0.3)',
      borderColor: 'rgba(99, 158, 194, 0.6)',
      background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.15) 0%, rgba(74, 122, 156, 0.1) 100%)',
    }
  },
  infoFieldHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '10px'
  },
  infoFieldIcon: {
    fontSize: '24px',
    color: '#639EC2',
    filter: 'drop-shadow(0 0 6px rgba(99, 158, 194, 0.5))'
  },
  infoFieldName: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#639EC2',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textShadow: '0 0 8px rgba(99, 158, 194, 0.5)'
  },
  infoFieldValue: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#7ab3d9',
    margin: '8px 0',
    textShadow: '0 0 10px rgba(122, 179, 217, 0.6)'
  },
  infoFieldDescription: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.3'
  },
  hierarchicalLayout: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center', 
    gap: '20px',
    marginBottom: '40px',
    flexWrap: 'nowrap',
    minHeight: '650px',
    position: 'relative',
    width: '100%',
    padding: '0 20px'
  },
  leftColumn: {
    flex: '0 0 370px',
    background: 'linear-gradient(135deg, rgba(43, 43, 43, 0.95) 0%, rgba(32, 30, 30, 0.98) 100%)',
    borderRadius: '12px',
    padding: '12px',
    border: '2px solid rgba(99, 158, 194, 0.3)',
    maxHeight: '650px',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    '&::-webkit-scrollbar': {
      width: '6px'
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'linear-gradient(180deg, #639EC2 0%, #4a7a9c 100%)',
      borderRadius: '3px'
    }
  },
  centerColumn: {
    flex: '0 0 auto',
    display: 'flex',
    justifyContent: 'center', 
    alignItems: 'center', 
    minWidth: '580px',
    padding: '60px 10px',
    marginTop: '0px',
    margin: '0 auto', 
    position: 'relative',
    left: '0px' 
  },
  rightColumn: {
    flex: '0 0 370px',
    background: 'linear-gradient(135deg, rgba(43, 43, 43, 0.95) 0%, rgba(32, 30, 30, 0.98) 100%)',
    borderRadius: '12px',
    padding: '12px',
    border: '2px solid rgba(99, 158, 194, 0.3)',
    maxHeight: '650px',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    '&::-webkit-scrollbar': {
      width: '6px'
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'linear-gradient(180deg, #639EC2 0%, #4a7a9c 100%)',
      borderRadius: '3px'
    }
  },
  rightModulesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    height: '100%',
    width: '100%',
    overflow: 'hidden'
  },
  moduleSection: {
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.1) 0%, rgba(74, 122, 156, 0.05) 100%)',
    borderRadius: '8px',
    padding: '12px',
    border: '2px solid rgba(99, 158, 194, 0.3)',
    boxShadow: '0 2px 8px rgba(99, 158, 194, 0.2)',
    flex: '1',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    width: '100%',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      borderColor: 'rgba(99, 158, 194, 0.5)',
      boxShadow: '0 4px 15px rgba(99, 158, 194, 0.3)',
    }
  },
  columnTitle: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '12px',
    borderBottom: '3px solid #639EC2',
    paddingBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#639EC2',
    textShadow: '0 0 10px rgba(99, 158, 194, 0.6)'
  },
  moduleTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '10px',
    color: '#7ab3d9',
    borderBottom: '2px solid rgba(122, 179, 217, 0.4)',
    paddingBottom: '4px',
    textShadow: '0 0 8px rgba(122, 179, 217, 0.5)'
  },
  mahoragaLayout: {
    position: 'relative',
    width: '520px',
    height: '520px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '520px',
    transform: 'translateX(0px)',
    background: 'radial-gradient(circle, rgba(99, 158, 194, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
  },
  wheelPosition: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
  },
  attributeWheel: {
    background: 'linear-gradient(135deg, rgba(32, 30, 30, 0.95) 0%, rgba(24, 23, 23, 0.98) 100%)',
    border: '4px solid #639EC2',
    borderRadius: '50%',
    padding: '30px',
    textAlign: 'center',
    transition: 'all 0.4s ease',
    backdropFilter: 'blur(15px)',
    width: '150px',
    height: '150px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 158, 194, 0.4)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-8px) scale(1.08)',
      boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 158, 194, 0.6)',
      borderColor: '#7ab3d9',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-4px',
      left: '-4px',
      right: '-4px',
      bottom: '-4px',
      background: 'conic-gradient(from 0deg, #639EC2, #7ab3d9, #4a7a9c, #639EC2)',
      borderRadius: '50%',
      zIndex: -1,
      animation: '$rotate 3s linear infinite',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '2px',
      left: '2px',
      right: '2px',
      bottom: '2px',
      background: 'linear-gradient(135deg, rgba(32, 30, 30, 0.95) 0%, rgba(24, 23, 23, 0.98) 100%)',
      borderRadius: '50%',
      zIndex: -1,
    }
  },
  '@keyframes rotate': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    }
  },
  emptyWheel: {
    background: 'linear-gradient(135deg, rgba(32, 30, 30, 0.8) 0%, rgba(24, 23, 23, 0.9) 100%)',
    border: '4px solid rgba(99, 158, 194, 0.4)',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    width: '130px',
    height: '130px',
    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.4)',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-4px',
      left: '-4px',
      right: '-4px',
      bottom: '-4px',
      background: 'conic-gradient(from 0deg, transparent, rgba(99, 158, 194, 0.3), transparent)',
      borderRadius: '50%',
      zIndex: -1,
      animation: '$rotate 6s linear infinite',
    },
  },
  attributeNameWheel: {
    position: 'absolute',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#7ab3d9',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textShadow: '0 0 8px rgba(122, 179, 217, 0.8), 1px 1px 2px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
    zIndex: 20,
  },
  attributeValueContainerWheel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px',
    flexDirection: 'column',
  },
  attributeInputWheel: {
    width: '70px',
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      border: '2px solid rgba(99, 158, 194, 0.4)',
      '& fieldset': {
        border: 'none',
      },
      '&:hover fieldset': {
        border: 'none',
      },
      '&.Mui-focused fieldset': {
        border: 'none',
      }
    },
    '& input': {
      color: '#7ab3d9',
      fontWeight: 'bold',
      fontSize: '1.1rem',
      textAlign: 'center',
      padding: '8px',
      textShadow: '0 0 8px rgba(122, 179, 217, 0.5)',
      background: 'transparent',
    }
  },
  diceButtonWheel: {
    color: '#7ab3d9',
    background: 'rgba(99, 158, 194, 0.2)',
    border: '2px solid #639EC2',
    borderRadius: '50%',
    padding: '6px',
    marginTop: '5px',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#639EC2',
      color: 'white',
      transform: 'scale(1.1)',
      boxShadow: '0 0 15px rgba(99, 158, 194, 0.6)',
    },
  },
  modifierBoxWheel: {
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.2) 0%, rgba(74, 122, 156, 0.1) 100%)',
    color: '#7ab3d9',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginTop: '5px',
    border: '2px solid rgba(99, 158, 194, 0.4)',
    textShadow: '0 0 6px rgba(122, 179, 217, 0.5)',
  },
  modifierLabelWheel: {
    fontSize: '0.5rem',
    opacity: 0.8,
    marginBottom: '1px',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  periciasContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflowX: 'visible',
    overflowY: 'visible',
    padding: '6px'
  },
  periciaCardCompact: {
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.1) 0%, rgba(74, 122, 156, 0.05) 100%)',
    border: '1.5px solid rgba(99, 158, 194, 0.3)',
    borderRadius: '6px',
    padding: '4px 6px',
    marginBottom: '2px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 1px 4px rgba(99, 158, 194, 0.1)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'visible',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(99, 158, 194, 0.2)',
      borderColor: 'rgba(99, 158, 194, 0.6)',
    }
  },
  periciaHeaderCompact: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: '4px',
    minWidth: '0',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'visible'
  },
  periciaNameCompact: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#7ab3d9',
    flex: '0 1 70px',
    minWidth: '60px',
    maxWidth: '110px',
    textShadow: '0 0 6px rgba(122, 179, 217, 0.5)',
    overflow: 'visible',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box'
  },
  periciaAtributoCompact: {
    fontSize: '0.6rem',
    color: '#639EC2',
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.2) 0%, rgba(74, 122, 156, 0.1) 100%)',
    padding: '1px 4px',
    borderRadius: '8px',
    fontWeight: 'bold',
    border: '1px solid rgba(99, 158, 194, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.2px',
    flex: '0 0 auto',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap'
  },
  periciaTotalCompact: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#7ab3d9',
    margin: '0 4px',
    minWidth: '30px',
    maxWidth: '35px',
    textAlign: 'center',
    textShadow: '0 0 8px rgba(122, 179, 217, 0.6)',
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.2) 0%, rgba(74, 122, 156, 0.1) 100%)',
    padding: '2px 4px',
    borderRadius: '4px',
    border: '1px solid rgba(99, 158, 194, 0.3)',
    flex: '0 0 auto',
    boxSizing: 'border-box'
  },
  periciaControlsCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'nowrap',
    flex: '0 0 auto',
    minWidth: '0',
    maxWidth: '140px',
    boxSizing: 'border-box',
    justifyContent: 'flex-end'
  },
  periciaCheckboxContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    minWidth: '24px',
    maxWidth: '26px',
    flex: '0 0 auto',
    boxSizing: 'border-box'
  },
  checkboxLabel: {
    fontSize: '0.65rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    lineHeight: '1',
    letterSpacing: '0.8px',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
    background: 'linear-gradient(135deg, #639EC2, #7ab3d9)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    padding: '0',
    display: 'block',
    width: '100%',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  treinadaCheckboxCompact: {
    color: 'rgba(99, 158, 194, 0.6)',
    padding: '0',
    minWidth: '20px',
    '&.Mui-checked': {
      color: '#639EC2',
      transform: 'scale(1.1)',
      transition: 'all 0.3s ease',
      filter: 'drop-shadow(0 0 4px rgba(99, 158, 194, 0.8))'
    },
    '& .MuiSvgIcon-root': {
      fontSize: '18px'
    }
  },
  mestreCheckboxCompact: {
    color: 'rgba(122, 179, 217, 0.6)',
    padding: '0',
    minWidth: '20px',
    '&.Mui-checked': {
      color: '#7ab3d9',
      transform: 'scale(1.1)',
      transition: 'all 0.3s ease',
      filter: 'drop-shadow(0 0 4px rgba(122, 179, 217, 0.8))'
    },
    '& .MuiSvgIcon-root': {
      fontSize: '18px'
    }
  },
  periciaRollButtonCompact: {
    color: '#639EC2',
    border: '1px solid rgba(99, 158, 194, 0.5)',
    borderRadius: '3px',
    padding: '2px',
    minWidth: 'auto',
    width: '22px',
    height: '22px',
    maxWidth: '24px',
    transition: 'all 0.3s ease',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(99, 158, 194, 0.05) 100%)',
    fontWeight: 'bold',
    boxSizing: 'border-box',
    flex: '0 0 auto',
    '&:hover': {
      backgroundColor: '#639EC2',
      color: 'white',
      borderColor: '#639EC2',
      transform: 'scale(1.03)',
      boxShadow: '0 1px 4px rgba(99, 158, 194, 0.3)',
      filter: 'drop-shadow(0 0 6px rgba(99, 158, 194, 0.6))'
    },
    '& .MuiSvgIcon-root': {
      fontSize: '14px'
    }
  },
  outrosFieldCompact: {
    width: '36px',
    maxWidth: '38px',
    boxSizing: 'border-box',
    flex: '0 0 auto',
    '& .MuiOutlinedInput-root': {
      borderRadius: '3px',
      background: 'rgba(255, 255, 255, 0.1)',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      border: '1px solid rgba(99, 158, 194, 0.4)',
      '& fieldset': {
        border: 'none',
      },
      '&:hover': {
        borderColor: 'rgba(99, 158, 194, 0.6)',
      },
      '&.Mui-focused': {
        borderColor: '#639EC2',
        boxShadow: '0 0 8px rgba(99, 158, 194, 0.4)',
      },
      '& input': {
        textAlign: 'center',
        padding: '2px',
        fontSize: '0.65rem',
        height: '16px',
        color: '#7ab3d9',
        fontWeight: 'bold',
        background: 'transparent',
        width: '100%',
        boxSizing: 'border-box',
        textShadow: '0 0 4px rgba(122, 179, 217, 0.5)',
      }
    }
  },
  healthSection: {
    marginBottom: '30px',
  },
  healthGrid: {
    marginTop: '20px',
    '& > .MuiGrid-item': {
      display: 'flex'
    }
  },
  healthCard: {
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.1) 0%, rgba(74, 122, 156, 0.05) 100%)',
    border: '2px solid rgba(99, 158, 194, 0.4)',
    borderRadius: '8px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(99, 158, 194, 0.3)',
      borderColor: 'rgba(99, 158, 194, 0.6)',
    }
  },
  soulCard: {
    background: 'linear-gradient(135deg, rgba(122, 179, 217, 0.1) 0%, rgba(91, 139, 179, 0.05) 100%)',
    border: '2px solid rgba(122, 179, 217, 0.4)',
    borderRadius: '8px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(122, 179, 217, 0.3)',
      borderColor: 'rgba(122, 179, 217, 0.6)',
    }
  },
  energyCard: {
    background: 'linear-gradient(135deg, rgba(74, 122, 156, 0.1) 0%, rgba(59, 98, 125, 0.05) 100%)',
    border: '2px solid rgba(74, 122, 156, 0.4)',
    borderRadius: '8px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(74, 122, 156, 0.3)',
      borderColor: 'rgba(74, 122, 156, 0.6)',
    }
  },
  healthHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },
  healthTitle: {
    color: '#639EC2',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textShadow: '0 0 6px rgba(99, 158, 194, 0.5)'
  },
  soulTitle: {
    color: '#7ab3d9',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textShadow: '0 0 6px rgba(122, 179, 217, 0.5)'
  },
  energyTitle: {
    color: '#4a7a9c',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textShadow: '0 0 6px rgba(74, 122, 156, 0.5)'
  },
  healthIcon: {
    fontSize: '24px',
    filter: 'drop-shadow(0 0 4px currentColor)'
  },
  progressContainer: {
    marginBottom: '15px'
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px'
  },
  progressText: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  progressValue: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#7ab3d9',
    textShadow: '0 0 6px rgba(122, 179, 217, 0.5)'
  },
  healthProgress: {
    height: '20px',
    borderRadius: '10px',
    backgroundColor: 'rgba(99, 158, 194, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#639EC2',
      borderRadius: '10px',
      boxShadow: '0 0 10px rgba(99, 158, 194, 0.6)',
    }
  },
  soulProgress: {
    height: '20px',
    borderRadius: '10px',
    backgroundColor: 'rgba(122, 179, 217, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#7ab3d9',
      borderRadius: '10px',
      boxShadow: '0 0 10px rgba(122, 179, 217, 0.6)',
    }
  },
  energyProgress: {
    height: '20px',
    borderRadius: '10px',
    backgroundColor: 'rgba(74, 122, 156, 0.2)',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#4a7a9c',
      borderRadius: '10px',
      boxShadow: '0 0 10px rgba(74, 122, 156, 0.6)',
    }
  },
  healthDetails: {
    marginTop: '15px',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '4px'
  },
  editDialog: {
    '& .MuiDialog-paper': {
      borderRadius: '12px',
      padding: '20px',
      background: 'linear-gradient(135deg, rgba(43, 43, 43, 0.95) 0%, rgba(32, 30, 30, 0.98) 100%)',
      border: '2px solid rgba(99, 158, 194, 0.4)',
    }
  },
  editField: {
    marginBottom: '20px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '2px solid rgba(99, 158, 194, 0.3)',
    }
  },
  quickActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginTop: '15px',
    flexWrap: 'wrap'
  },
  quickButton: {
    minWidth: '100px',
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.2) 0%, rgba(74, 122, 156, 0.1) 100%)',
    border: '2px solid rgba(99, 158, 194, 0.4)',
    color: '#7ab3d9',
    fontWeight: 'bold',
    '&:hover': {
      background: 'linear-gradient(135deg, #639EC2 0%, #4a7a9c 100%)',
      color: 'white',
    }
  },
  methodSelection: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  methodGrid: {
    marginTop: '30px',
  },
  methodCard: {
    padding: '30px 20px',
    textAlign: 'center',
    border: '3px solid rgba(99, 158, 194, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.1) 0%, rgba(74, 122, 156, 0.05) 100%)',
    '&:hover': {
      borderColor: 'rgba(99, 158, 194, 0.6)',
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 25px rgba(99, 158, 194, 0.3)',
    },
    '&.selected': {
      borderColor: '#639EC2',
      background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.2) 0%, rgba(74, 122, 156, 0.15) 100%)',
    }
  },
  methodIcon: {
    fontSize: '48px',
    marginBottom: '15px',
    color: '#639EC2',
    filter: 'drop-shadow(0 0 8px rgba(99, 158, 194, 0.6))'
  },
  methodTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#7ab3d9',
    marginBottom: '10px',
    textShadow: '0 0 10px rgba(122, 179, 217, 0.6)'
  },
  methodDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '15px',
    lineHeight: '1.5'
  },
  methodBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, #639EC2 0%, #4a7a9c 100%)',
    color: 'white',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#639EC2',
    textAlign: 'center',
    borderBottom: '2px solid #639EC2',
    paddingBottom: '8px',
    textShadow: '0 0 15px rgba(99, 158, 194, 0.6)'
  },
  additionalValuesSection: {
    marginBottom: '30px',
  },
  additionalValuesGrid: {
    marginTop: '20px',
  },
  additionalValueCard: {
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.1) 0%, rgba(74, 122, 156, 0.05) 100%)',
    border: '2px solid rgba(99, 158, 194, 0.4)',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    height: '100%',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(99, 158, 194, 0.3)',
      borderColor: 'rgba(99, 158, 194, 0.6)',
    }
  },
  additionalValueHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '15px'
  },
  additionalValueIcon: {
    fontSize: '32px',
    color: '#639EC2',
    filter: 'drop-shadow(0 0 8px rgba(99, 158, 194, 0.6))'
  },
  additionalValueName: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#7ab3d9',
    textTransform: 'uppercase',
    textShadow: '0 0 10px rgba(122, 179, 217, 0.6)'
  },
  additionalValueDisplay: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#639EC2',
    margin: '15px 0',
    textShadow: '0 0 15px rgba(99, 158, 194, 0.8)'
  },
  additionalValueFormula: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  additionalValueDescription: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: '1.4'
  },
  distributionModal: {
    '& .MuiDialog-paper': {
      maxWidth: '800px',
      borderRadius: '12px',
      zIndex: '9998 !important',
      background: 'linear-gradient(135deg, rgba(43, 43, 43, 0.95) 0%, rgba(32, 30, 30, 0.98) 100%)',
      border: '2px solid rgba(99, 158, 194, 0.4)',
    }
  },
  methodSelectionModal: {
    '& .MuiDialog-paper': {
      maxWidth: '900px',
      borderRadius: '12px',
      zIndex: '9998 !important',
      background: 'linear-gradient(135deg, rgba(43, 43, 43, 0.95) 0%, rgba(32, 30, 30, 0.98) 100%)',
      border: '2px solid rgba(99, 158, 194, 0.4)',
    }
  },
  availableValues: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '15px'
  },
  valueChip: {
    padding: '8px 16px',
    border: '2px solid #639EC2',
    borderRadius: '20px',
    background: 'rgba(99, 158, 194, 0.1)',
    color: '#7ab3d9',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textShadow: '0 0 6px rgba(122, 179, 217, 0.5)',
    '&:hover': {
      background: '#639EC2',
      color: 'white',
    },
    '&.used': {
      background: 'rgba(140, 140, 140, 0.2)',
      color: 'rgba(255, 255, 255, 0.4)',
      borderColor: 'rgba(140, 140, 140, 0.3)',
      cursor: 'not-allowed',
    }
  },
  attributeDistribution: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    margin: '5px 0',
    border: '1px solid rgba(99, 158, 194, 0.3)',
    borderRadius: '4px',
    background: 'rgba(99, 158, 194, 0.05)',
    '&:hover': {
      backgroundColor: 'rgba(99, 158, 194, 0.1)',
    }
  },
  pointsSystem: {
    textAlign: 'center',
    padding: '20px'
  },
  pointsDisplay: {
    background: 'linear-gradient(135deg, #639EC2 0%, #4a7a9c 100%)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
  rollButtonContainer: {
    textAlign: 'center',
    margin: '20px 0'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(32, 30, 30, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    zIndex: 1
  }
});