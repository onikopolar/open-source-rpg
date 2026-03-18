// src/components/Tabletop/NuvemFOV.jsx
import { useState, useCallback, useRef } from "react";

export function useNuvemFOV() {
    console.log('[useNuvemFOV] Hook inicializado');

    // Estados principais
    const [modoDesenho, setModoDesenho] = useState(false); 
    const [ferramenta, setFerramenta] = useState('pincel'); // Agora só tem 'pincel'
    const [camadasNevoa, setCamadasNevoa] = useState([]);

    console.log('[useNuvemFOV] Estado inicial:', {
        modoDesenho: false,
        ferramenta: 'pincel',
        camadasNevoa: 0
    });

    // Estado do desenho atual
    const [desenhando, setDesenhando] = useState(false);
    const [inicioDesenho, setInicioDesenho] = useState({ x: 0, y: 0 });
    const [fimDesenho, setFimDesenho] = useState({ x: 0, y: 0 });

    console.log('[useNuvemFOV] Estado desenho inicializado');

    // Refs para performance
    const rafRef = useRef(null);
    const onRenderCallbackRef = useRef(null);

    console.log('[useNuvemFOV] Refs criadas');

    // Registra callback que o TabletopGrid vai fornecer para renderizar
    const registrarCallbackRender = useCallback((callback) => {
        console.log('[registrarCallbackRender] Callback registrado:', !!callback);
        onRenderCallbackRef.current = callback;
    }, []);

    // Inicia o desenho de uma área
    const iniciarDesenho = useCallback((x, y) => {
        console.log('[iniciarDesenho] Chamado com:', { x, y, modoDesenho });

        if (!modoDesenho) {
            console.log('[iniciarDesenho] Modo desenho desativado, ignorando');
            return;
        }

        console.log('[iniciarDesenho] Iniciando desenho');
        setDesenhando(true);
        setInicioDesenho({ x, y });
        setFimDesenho({ x, y });
    }, [modoDesenho]);

    // Atualiza o desenho enquanto arrasta
    const atualizarDesenho = useCallback((x, y) => {
        console.log('[atualizarDesenho] Chamado com:', { x, y, desenhando });

        if (!desenhando) {
            console.log('[atualizarDesenho] Não está desenhando, ignorando');
            return;
        }

        console.log('[atualizarDesenho] Atualizando posição');
        setFimDesenho({ x, y });

        // Agenda renderização via requestAnimationFrame
        if (rafRef.current) {
            console.log('[atualizarDesenho] Cancelando animação anterior');
            cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
            console.log('[atualizarDesenho] Renderizando via requestAnimationFrame');
            if (onRenderCallbackRef.current) {
                onRenderCallbackRef.current();
                console.log('[atualizarDesenho] Renderização concluída');
            } else {
                console.log('[atualizarDesenho] Nenhum callback de render registrado');
            }
            rafRef.current = null;
        });
    }, [desenhando]);

    // Finaliza o desenho e salva a área
    const finalizarDesenho = useCallback(() => {
        console.log('[finalizarDesenho] Chamado, desenhando:', desenhando);

        if (!desenhando) {
            console.log('[finalizarDesenho] Não está desenhando, ignorando');
            return;
        }

        // Calcula a área final (normaliza coordenadas)
        const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
        const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
        const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
        const y2 = Math.max(inicioDesenho.y, fimDesenho.y);

        const largura = x2 - x1;
        const altura = y2 - y1;

        console.log('[finalizarDesenho] Área calculada:', {
            x1, y1, x2, y2,
            largura,
            altura,
            tamanhoMinimo: Math.abs(largura) > 5 && Math.abs(altura) > 5
        });

        // Só salva se a área tiver tamanho mínimo
        if (Math.abs(largura) > 5 && Math.abs(altura) > 5) {
            const novaArea = {
                id: Date.now() + Math.random(),
                x: x1,
                y: y1,
                largura: largura,
                altura: altura,
                tipo: 'pincel' // Sempre pincel agora
            };

            console.log('[finalizarDesenho] Salvando nova área:', novaArea);
            setCamadasNevoa(prev => {
                console.log('[finalizarDesenho] Camadas anteriores:', prev.length);
                const novas = [...prev, novaArea];
                console.log('[finalizarDesenho] Camadas agora:', novas.length);
                return novas;
            });
        } else {
            console.log('[finalizarDesenho] Área muito pequena, ignorando');
        }

        console.log('[finalizarDesenho] Finalizando desenho');
        setDesenhando(false);

        // Renderiza uma última vez
        if (onRenderCallbackRef.current) {
            console.log('[finalizarDesenho] Renderizando estado final');
            onRenderCallbackRef.current();
        }
    }, [desenhando, inicioDesenho, fimDesenho]);

    // Limpa todas as camadas
    const limparTudo = useCallback(() => {
        console.log('[limparTudo] Limpando todas as camadas. Antes:', camadasNevoa.length);
        setCamadasNevoa([]);
        if (onRenderCallbackRef.current) {
            console.log('[limparTudo] Renderizando após limpeza');
            onRenderCallbackRef.current();
        }
        console.log('[limparTudo] Camadas removidas');
    }, [camadasNevoa.length]);

    // Desfaz a última camada
    const desfazer = useCallback(() => {
        console.log('[desfazer] Desfazendo última camada. Antes:', camadasNevoa.length);
        setCamadasNevoa(prev => {
            const novas = prev.slice(0, -1);
            console.log('[desfazer] Camadas depois:', novas.length);
            return novas;
        });
        if (onRenderCallbackRef.current) {
            console.log('[desfazer] Renderizando após desfazer');
            onRenderCallbackRef.current();
        }
    }, [camadasNevoa.length]);

    // Deleta uma camada específica pelo ID
    const deletarCamada = useCallback((id) => {
        console.log('[deletarCamada] Deletando camada:', id);
        setCamadasNevoa(prev => {
            const novas = prev.filter(camada => camada.id !== id);
            console.log('[deletarCamada] Camadas antes:', prev.length, 'depois:', novas.length);
            return novas;
        });
        if (onRenderCallbackRef.current) {
            console.log('[deletarCamada] Renderizando após deletar');
            onRenderCallbackRef.current();
        }
    }, []);

    // Encontra qual camada está em uma posição específica (para clique com botão direito)
    const encontrarCamadaNaPosicao = useCallback((mundoX, mundoY) => {
        console.log('[encontrarCamadaNaPosicao] Procurando camada em:', { mundoX, mundoY });

        // Percorre as camadas de trás pra frente (última desenhada tem prioridade)
        for (let i = camadasNevoa.length - 1; i >= 0; i--) {
            const camada = camadasNevoa[i];
            
            // Verifica se a posição está dentro da camada
            const dentro = mundoX >= camada.x &&
                mundoX <= camada.x + camada.largura &&
                mundoY >= camada.y &&
                mundoY <= camada.y + camada.altura;

            if (dentro) {
                console.log('[encontrarCamadaNaPosicao] Camada encontrada:', camada);
                return camada;
            }
        }

        console.log('[encontrarCamadaNaPosicao] Nenhuma camada encontrada');
        return null;
    }, [camadasNevoa]);

    // Renderiza a névoa no canvas (chamado pelo TabletopGrid)
    const renderizarNevoa = useCallback((context, zoom, position) => {
        console.log('[renderizarNevoa] Renderizando névoa');
        console.log('   Camadas:', camadasNevoa.length);
        console.log('   Zoom:', zoom);
        console.log('   Posição:', position);
        console.log('   Desenhando:', desenhando);

        // Desenha todas as camadas salvas (todas são pincel agora)
        camadasNevoa.forEach((area, index) => {
            console.log(`   Camada ${index}:`, {
                x: area.x,
                y: area.y,
                largura: area.largura,
                altura: area.altura
            });

            // Aplica transformação da câmera
            const telaX = area.x * zoom + position.x;
            const telaY = area.y * zoom + position.y;
            const telaLargura = area.largura * zoom;
            const telaAltura = area.altura * zoom;

            // Pincel = adiciona névoa (preto)
            context.fillStyle = 'rgba(0, 0, 0, 0.8)';
            context.fillRect(telaX, telaY, telaLargura, telaAltura);
            console.log(`      Pincel desenhado em tela: (${telaX.toFixed(0)}, ${telaY.toFixed(0)}) ${telaLargura.toFixed(0)}x${telaAltura.toFixed(0)}`);
        });

        // Desenha o preview da área sendo desenhada agora
        if (desenhando) {
            const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
            const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
            const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
            const y2 = Math.max(inicioDesenho.y, fimDesenho.y);

            const telaX = x1 * zoom + position.x;
            const telaY = y1 * zoom + position.y;
            const telaLargura = (x2 - x1) * zoom;
            const telaAltura = (y2 - y1) * zoom;

            console.log('   Preview do desenho atual:', {
                inicio: inicioDesenho,
                fim: fimDesenho,
                tela: { x: telaX, y: telaY, largura: telaLargura, altura: telaAltura }
            });

            // Preview em vermelho
            context.strokeStyle = '#ff4444';
            context.lineWidth = 2 / zoom;
            context.setLineDash([5 / zoom, 5 / zoom]);
            context.strokeRect(telaX, telaY, telaLargura, telaAltura);
            context.setLineDash([]);
            console.log('      Preview desenhado com cor vermelha');
        }

        console.log('[renderizarNevoa] Renderização concluída');
    }, [camadasNevoa, desenhando, inicioDesenho, fimDesenho]);

    // Verifica se uma posição está coberta por névoa
    const estaCoberto = useCallback((mundoX, mundoY) => {
        console.log('[estaCoberto] Verificando posição:', { mundoX, mundoY });

        for (let i = 0; i < camadasNevoa.length; i++) {
            const area = camadasNevoa[i];

            const dentro = mundoX >= area.x &&
                mundoX <= area.x + area.largura &&
                mundoY >= area.y &&
                mundoY <= area.y + area.altura;

            if (dentro) {
                console.log(`   Posição coberta pela área ${i}:`, area);
                return true;
            }
        }
        console.log('   Posição não coberta');
        return false;
    }, [camadasNevoa]);

    console.log('[useNuvemFOV] Hook configurado, retornando API');

    return {
        // Estados
        modoDesenho,
        setModoDesenho,
        desenhando,
        inicioDesenho,
        fimDesenho,

        // Ações de desenho
        iniciarDesenho,
        atualizarDesenho,
        finalizarDesenho,

        // Gerenciamento de camadas
        camadasNevoa,
        limparTudo,
        desfazer,
        deletarCamada,
        encontrarCamadaNaPosicao,

        // Renderização e utilitários
        registrarCallbackRender,
        renderizarNevoa,
        estaCoberto
    };
}