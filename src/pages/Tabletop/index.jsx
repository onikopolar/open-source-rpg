// src/pages/Tabletop/index.jsx

// Importa o hook useRouter do Next.js para acessar a URL
import { useRouter } from 'next/router';

// Importa o componente principal da mesa
import TabletopGrid from './tabletopgrid';

export default function registroNoTabletop() {
    // useRouter nos dá acesso aos parâmetros da URL
    const router = useRouter();
    
    // Extrai o parâmetro "sheetId" da URL
    const { sheetId } = router.query;

    // Se sheetId existe, é player (não é mestre). Se sheetId não existe, é mestre
    const isMaster = !sheetId;

    return (
        <div style={{ padding: '40px' }}>
            <h1>Teste do Tabletop Grid</h1>
            
            {/* Passa as informações para o componente da mesa */}
            <TabletopGrid 
                isMaster={isMaster}      // true = mestre, false = player
                sheetId={sheetId}        // ID da ficha (se for player)
            />
        </div>
    );
}