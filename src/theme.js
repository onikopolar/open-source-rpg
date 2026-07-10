import { createTheme } from '@mui/material/styles'

const theme = createTheme({
    palette: {
        background: {
            default: '#2b2b2b'
        },
        mode: 'dark',
        primary: {
            main: '#639EC2',
            600: '#201E1E',
            900: '#181717',
        },
        secondary: {
            main: '#8c8c8c',
        }
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                // Remove o fundo azul do autofill do Chrome/Edge em tema dark.
                // O navegador aplica -webkit-autofill com !important internamente,
                // então usamos box-shadow para "cobrir" o fundo azul.
                'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus': {
                    WebkitBoxShadow: '0 0 0 100px #2b2b2b inset !important',
                    WebkitTextFillColor: '#fff !important',
                    caretColor: '#fff',
                    transition: 'background-color 5000s ease-in-out 0s',
                },
            },
        },
    },
});

export default theme