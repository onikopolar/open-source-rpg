// src/components/sheets/Yearzero-modos/design/AttributeDesignStyles.jsx

export const attributeComponentsStyles = (theme) => ({
  attributePosition: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    width: '110px',
    height: '110px'
  },
  positionTop: {
    top: '5px',
    left: '50%',
    transform: 'translateX(-50%)'
  },
  positionLeft: {
    top: '50%',
    left: '5px',
    transform: 'translateY(-50%)'
  },
  positionRight: {
    top: '50%',
    right: '5px',
    transform: 'translateY(-50%)'
  },
  positionBottom: {
    bottom: '5px',
    left: '50%',
    transform: 'translateX(-50%)'
  },
  attributeOctagonContainer: {
    position: 'relative',
    width: '100px',
    height: '100px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  attributeOctagonBorder: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #ff6b35 0%, #e65100 50%, #bf360c 100%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 1,
    filter: 'brightness(1.1) saturate(1.2)'
  },
  attributeOctagon: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.95)',
    color: '#ff6b35',
    textAlign: 'center',
    fontWeight: '900',
    width: '90px',
    height: '90px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 2,
    border: '2px solid #ff6b35',
    backdropFilter: 'blur(5px)'
  },
  attributeOctagonContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    width: '100%',
    padding: '8px'
  },
  attributeNameBox: {
    background: '#ff6b35',
    color: '#fff',
    padding: '3px 10px',
    borderRadius: '3px',
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px',
    whiteSpace: 'nowrap',
    border: '2px solid #fff',
    filter: 'brightness(1.1)',
    textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
  },
  attributeInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'center'
  },
  attributeInput: {
    width: '50px',
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '4px',
      '& fieldset': {
        borderColor: '#ff6b35',
        borderWidth: '2px'
      },
      '&:hover fieldset': {
        borderColor: '#ff6b35',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#ff6b35',
        borderWidth: '2px'
      }
    },
    '& input': {
      color: '#ff6b35',
      fontWeight: '900',
      fontSize: '1.2rem',
      textAlign: 'center',
      padding: '6px 4px',
      height: '28px',
      fontFamily: '"Roboto", "Arial", sans-serif',
      cursor: 'text',
      caretColor: 'auto',
      userSelect: 'auto',
      MozAppearance: 'textfield',
      '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
        WebkitAppearance: 'auto',
        margin: 0
      }
    }
  },
  attributeDiceButton: {
    padding: '6px',
    minWidth: 'auto',
    color: '#ff6b35',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid #ff6b35',
    borderRadius: '4px',
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
      fontWeight: 'bold'
    },
    '&:hover': {
      backgroundColor: '#ff6b35',
      color: '#fff'
    }
  },
  skillOctagonContainer: {
    position: 'relative',
    width: '90px',
    height: '90px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  skillOctagonBorder: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 1,
    filter: 'brightness(1.1) saturate(1.2)'
  },
  skillOctagon: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.95)',
    color: '#1976d2',
    textAlign: 'center',
    fontWeight: '800',
    width: '82px',
    height: '82px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 2,
    border: '2px solid #1976d2',
    backdropFilter: 'blur(5px)'
  },
  skillOctagonContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '100%',
    padding: '8px'
  },
  skillNameBox: {
    background: '#1976d2',
    color: '#fff',
    padding: '5px 10px',
    borderRadius: '3px',
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'pre-line',
    textAlign: 'center',
    lineHeight: '1.3',
    border: '2px solid #fff',
    minWidth: '85px',
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    wordWrap: 'break-word',
    filter: 'brightness(1.1)',
    textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
  },
  skillInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'center',
    marginBottom: '3px'
  },
  skillInput: {
    width: '45px',
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '4px',
      '& fieldset': {
        borderColor: '#1976d2',
        borderWidth: '2px'
      },
      '&:hover fieldset': {
        borderColor: '#1976d2',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1976d2',
        borderWidth: '2px'
      }
    },
    '& input': {
      color: '#1976d2',
      fontWeight: '800',
      fontSize: '1.2rem',
      textAlign: 'center',
      padding: '6px 4px',
      height: '28px',
      fontFamily: '"Roboto", "Arial", sans-serif',
      cursor: 'text',
      caretColor: 'auto',
      userSelect: 'auto',
      MozAppearance: 'textfield',
      '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
        WebkitAppearance: 'auto',
        margin: 0
      }
    }
  },
  skillDiceButton: {
    padding: '6px',
    minWidth: 'auto',
    color: '#1976d2',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid #1976d2',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#1976d2',
      color: '#fff'
    },
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
      fontWeight: 'bold'
    }
  },
  skillGroup: {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 20
  },
  skillTopLeft: {
    top: '-45px',
    left: '-25px',
    flexDirection: 'row'
  },
  skillTopCenter: {
    top: '-125px',
    left: '50%',
    transform: 'translateX(-50%)',
    flexDirection: 'column'
  },
  skillTopRight: {
    top: '-45px',
    right: '-37px',
    flexDirection: 'row-reverse'
  },
  skillLeftTop: {
    top: '55px',
    left: '-95px',
    flexDirection: 'row'
  },
  skillLeftMiddle: {
    top: '50%',
    left: '-180px',
    transform: 'translateY(-50%)',
    flexDirection: 'row'
  },
  skillLeftBottom: {
    bottom: '55px',
    left: '-95px',
    flexDirection: 'row'
  },
  skillRightTop: {
    top: '55px',
    right: '-95px',
    flexDirection: 'row-reverse'
  },
  skillRightMiddle: {
    top: '50%',
    right: '-200px',
    transform: 'translateY(-50%)',
    flexDirection: 'row-reverse'
  },
  skillRightBottom: {
    bottom: '55px',
    right: '-95px',
    flexDirection: 'row-reverse'
  },
  skillBottomLeft: {
    bottom: '-45px',
    left: '-35px',
    flexDirection: 'row'
  },
  skillBottomCenter: {
    bottom: '-110px',
    left: '50%',
    transform: 'translateX(-50%)',
    flexDirection: 'column-reverse'
  },
  skillBottomRight: {
    bottom: '-45px',
    right: '-35px',
    flexDirection: 'row-reverse'
  }
});