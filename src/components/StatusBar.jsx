import { LinearProgress, Box, Typography, Card, CardContent, IconButton, Button, styled } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useState, useEffect } from 'react';

// Usando styled components do MUI em vez de makeStyles
const StyledLinearProgress = styled(LinearProgress)(({ theme, primarycolor, secondarycolor }) => ({
  height: '35px',
  borderRadius: '8px',
  cursor: 'pointer',
  border: '2px solid #e0e0e0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  backgroundColor: secondarycolor || '#ecf0f1',
  '& .MuiLinearProgress-bar': {
    backgroundColor: primarycolor || '#27ae60',
    transition: 'all 0.3s ease-in-out'
  }
}));

const LinearProgressWithLabel = (props) => {
  const safeValue = isNaN(props.value) ? 0 : Math.max(0, Math.min(100, props.value));

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%',
        gap: 2
      }}
      onClick={props.onClick}
    >
      <Box sx={{ flex: 1 }}>
        <StyledLinearProgress
          variant="determinate"
          value={safeValue}
          primarycolor={props.primaryColor}
          secondarycolor={props.secondaryColor}
        />
      </Box>
      <Box sx={{ 
        minWidth: 100, 
        textAlign: 'center',
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #e0e0e0'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            userSelect: 'none',
            fontWeight: 'bold',
            color: '#2c3e50',
            margin: 0
          }}
        >
          {props.label}
        </Typography>
      </Box>
    </Box>
  );
};

const StatusBar = ({
    character,
    onStatusBarClick,
    onQuickHeal,
    onQuickDamage
}) => {
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    const current = character?.current_hit_points || 0;
    const max = character?.max_hit_points || 1;
    
    const normalise = (current, max) => {
        if (!current || !max || max === 0) return 0;
        return (current * 100) / max;
    };

    const progressValue = normalise(current, max);
    
    const getPrimaryColor = () => {
        if (progressValue > 70) return '#27ae60';
        if (progressValue > 40) return '#f39c12';
        if (progressValue > 20) return '#e74c3c';
        return '#c0392b';
    };

    const getStatusText = () => {
        if (progressValue > 70) return 'Saudável';
        if (progressValue > 40) return 'Ferido';
        if (progressValue > 20) return 'Gravemente Ferido';
        return 'Morrendo';
    };

    const getStatusColor = () => {
        if (progressValue > 70) return '#27ae60';
        if (progressValue > 40) return '#f39c12';
        if (progressValue > 20) return '#e74c3c';
        return '#c0392b';
    };

    const handleQuickHeal = () => {
        if (onQuickHeal) {
            onQuickHeal(1);
        }
    };

    const handleQuickDamage = () => {
        if (onQuickDamage) {
            onQuickDamage(1);
        }
    };

    const handleFullHeal = () => {
        if (onQuickHeal) {
            onQuickHeal(max - current);
        }
    };

    if (!isClient) {
        return (
            <Card sx={{ width: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
                        Pontos de Vida
                    </Typography>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body1">Carregando...</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card 
            sx={{ 
                width: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Typography 
                    variant="h5" 
                    sx={{ 
                        mb: 2, 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                    }}
                >
                    <FavoriteIcon sx={{ color: '#e74c3c' }} />
                    Pontos de Vida
                </Typography>
                
                <Box onClick={onStatusBarClick} sx={{ cursor: 'pointer' }}>
                    <LinearProgressWithLabel
                        value={progressValue}
                        label={`${current} / ${max}`}
                        primaryColor={getPrimaryColor()}
                        secondaryColor="#ecf0f1"
                    />
                </Box>
                
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    mt: 3,
                    gap: 2
                }}>
                    <IconButton
                        color="error"
                        onClick={handleQuickDamage}
                        sx={{ 
                            border: '2px solid #e74c3c',
                            backgroundColor: '#fdf2f2',
                            '&:hover': {
                                backgroundColor: '#fadbd8'
                            }
                        }}
                        disabled={current <= 0}
                    >
                        <RemoveIcon />
                    </IconButton>

                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: 120
                    }}>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                fontWeight: 'bold',
                                color: getStatusColor(),
                                fontSize: '1.1rem'
                            }}
                        >
                            {getStatusText()}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: '#7f8c8d',
                                fontWeight: 'bold'
                            }}
                        >
                            {progressValue.toFixed(0)}%
                        </Typography>
                    </Box>

                    <IconButton
                        color="success"
                        onClick={handleQuickHeal}
                        sx={{ 
                            border: '2px solid #27ae60',
                            backgroundColor: '#f2fdf2',
                            '&:hover': {
                                backgroundColor: '#d4efdf'
                            }
                        }}
                        disabled={current >= max}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                        variant="outlined"
                        color="success"
                        startIcon={<FavoriteIcon />}
                        onClick={handleFullHeal}
                        size="small"
                        disabled={current >= max}
                        sx={{ 
                            opacity: current >= max ? 0.5 : 1,
                            fontSize: '0.8rem'
                        }}
                    >
                        Restaurar Vida
                    </Button>
                </Box>

                <Box sx={{ 
                    textAlign: 'center',
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid #e0e0e0'
                }}>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: '#95a5a6',
                            display: 'block'
                        }}
                    >
                        Clique na barra para valores exatos
                    </Typography>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: '#95a5a6',
                            display: 'block'
                        }}
                    >
                        Botões para ajustar 1 ponto
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default StatusBar;
