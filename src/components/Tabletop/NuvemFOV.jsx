// src/components/Tabletop/NuvemFOV.jsx
import { useState, useCallback, useRef } from "react";

export function useNuvemFOV() {
    // Estados principais
    const [modoDesenho, setModoDesenho] = useState(false);
    const [camadasNevoa, setCamadasNevoa] = useState([]);

    // Estado do desenho atual
    const [desenhando, setDesenhando] = useState(false);
    const [inicioDesenho, setInicioDesenho] = useState({ x: 0, y: 0 });
    const [fimDesenho, setFimDesenho] = useState({ x: 0, y: 0 });

    // Refs para performance
    const rafRef = useRef(null);
    const onRenderCallbackRef = useRef(null);
    
    // Ref para acessar zoom e position do uiState
    const uiStateRef = useRef({ zoom: 1, position: { x: 0, y: 0 } });

    // Registra callback que o TabletopGrid vai fornecer para renderizar
    const registrarCallbackRender = useCallback((callback) => {
        onRenderCallbackRef.current = callback;
    }, []);
    
    // Atualiza a referência do uiState (zoom e posição da câmera)
    const setUIStateRef = useCallback((zoom, position) => {
        uiStateRef.current = { zoom, position };
    }, []);
    
    // Converte coordenadas da tela para coordenadas do mundo
    const telaParaMundo = useCallback((telaX, telaY) => {
        const { zoom, position } = uiStateRef.current;
        return {
            x: (telaX - position.x) / zoom,
            y: (telaY - position.y) / zoom
        };
    }, []);

    // Converte coordenadas do mundo para coordenadas da tela
    const mundoParaTela = useCallback((mundoX, mundoY) => {
        const { zoom, position } = uiStateRef.current;
        return {
            x: mundoX * zoom + position.x,
            y: mundoY * zoom + position.y
        };
    }, []);

    // Ativa modo desenho
    const ativarModoDesenho = useCallback(() => {
        setModoDesenho(true);
    }, []);

    // Desativa modo desenho
    const desativarModoDesenho = useCallback(() => {
        setModoDesenho(false);
        setDesenhando(false);
    }, []);

    // Inicia o desenho de uma área (recebe coordenadas da tela, converte para mundo)
    const iniciarDesenho = useCallback((telaX, telaY) => {
        if (!modoDesenho) {
            return;
        }
        
        const mundo = telaParaMundo(telaX, telaY);
        setDesenhando(true);
        setInicioDesenho(mundo);
        setFimDesenho(mundo);
    }, [modoDesenho, telaParaMundo]);

    // Atualiza o desenho enquanto arrasta (recebe coordenadas da tela, converte para mundo)
    const atualizarDesenho = useCallback((telaX, telaY) => {
        if (!desenhando) {
            return;
        }
        
        const mundo = telaParaMundo(telaX, telaY);
        setFimDesenho(mundo);

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
            if (onRenderCallbackRef.current) {
                onRenderCallbackRef.current();
            }
            rafRef.current = null;
        });
    }, [desenhando, telaParaMundo]);

    // Finaliza o desenho e salva a área
    const finalizarDesenho = useCallback(() => {
        if (!desenhando) {
            return;
        }

        const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
        const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
        const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
        const y2 = Math.max(inicioDesenho.y, fimDesenho.y);

        const largura = x2 - x1;
        const altura = y2 - y1;

        if (Math.abs(largura) > 20 && Math.abs(altura) > 20) {
            const novoToken = {
                id: Date.now() + Math.random(),
                x: x1,
                y: y1,
                larguraOriginal: largura,
                alturaOriginal: altura,
                escala: 1.0,
                tipo: 'nevoa'
            };

            setCamadasNevoa(prev => [...prev, novoToken]);
        }

        setDesenhando(false);

        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, [desenhando, inicioDesenho, fimDesenho]);

    // Limpa todas as camadas
    const limparTudo = useCallback(() => {
        setCamadasNevoa([]);
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Desfaz a última camada
    const desfazer = useCallback(() => {
        setCamadasNevoa(prev => prev.slice(0, -1));
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Deleta uma camada específica pelo ID
    const deletarCamada = useCallback((id) => {
        setCamadasNevoa(prev => prev.filter(camada => camada.id !== id));
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Função para atualizar escala (necessária para redimensionamento)
    const atualizarEscalaCamada = useCallback((id, novaEscala) => {
        setCamadasNevoa(prev => {
            return prev.map(camada =>
                camada.id === id
                    ? { ...camada, escala: novaEscala }
                    : camada
            );
        });

        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Função para atualizar posição (necessária para movimento)
    const atualizarPosicaoCamada = useCallback((id, novaX, novaY) => {
        setCamadasNevoa(prev => {
            return prev.map(camada =>
                camada.id === id
                    ? { ...camada, x: novaX, y: novaY }
                    : camada
            );
        });

        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Prepara informações de tela para a camada (igual ao tokensComInfo)
    const getCamadaComInfo = useCallback((camada, zoom, position) => {
        const larguraMundo = camada.larguraOriginal * camada.escala;
        const alturaMundo = camada.alturaOriginal * camada.escala;

        const posicaoTela = {
            x: (camada.x * zoom) + position.x,
            y: (camada.y * zoom) + position.y
        };

        const larguraTela = larguraMundo * zoom;
        const alturaTela = alturaMundo * zoom;

        return {
            ...camada,
            posicaoTela,
            tamanhoTela: {
                larguraOriginal: camada.larguraOriginal,
                alturaOriginal: camada.alturaOriginal,
                larguraMundo,
                alturaMundo,
                larguraTela,
                alturaTela
            }
        };
    }, []);

    // Encontra qual camada está em uma posição específica
    const encontrarCamadaNaPosicao = useCallback((mundoX, mundoY) => {
        for (let i = camadasNevoa.length - 1; i >= 0; i--) {
            const camada = camadasNevoa[i];

            const larguraAtual = camada.larguraOriginal * camada.escala;
            const alturaAtual = camada.alturaOriginal * camada.escala;

            const dentro = mundoX >= camada.x &&
                mundoX <= camada.x + larguraAtual &&
                mundoY >= camada.y &&
                mundoY <= camada.y + alturaAtual;

            if (dentro) {
                return camada;
            }
        }
        return null;
    }, [camadasNevoa]);

    // Renderiza a névoa no canvas
    const renderizarNevoa = useCallback((context, zoom, position) => {
        uiStateRef.current = { zoom, position };
        
        camadasNevoa.forEach((area) => {
            const larguraMundo = area.larguraOriginal * area.escala;
            const alturaMundo = area.alturaOriginal * area.escala;

            const telaX = area.x * zoom + position.x;
            const telaY = area.y * zoom + position.y;
            const telaLargura = larguraMundo * zoom;
            const telaAltura = alturaMundo * zoom;

            context.fillStyle = 'rgba(0, 0, 0, 0.85)';
            context.fillRect(telaX, telaY, telaLargura, telaAltura);
        });

        if (desenhando) {
            const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
            const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
            const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
            const y2 = Math.max(inicioDesenho.y, fimDesenho.y);

            const telaX = x1 * zoom + position.x;
            const telaY = y1 * zoom + position.y;
            const telaLargura = (x2 - x1) * zoom;
            const telaAltura = (y2 - y1) * zoom;

            context.strokeStyle = '#ff4444';
            context.lineWidth = 2 / zoom;
            context.setLineDash([5 / zoom, 5 / zoom]);
            context.strokeRect(telaX, telaY, telaLargura, telaAltura);
            context.setLineDash([]);
        }
    }, [camadasNevoa, desenhando, inicioDesenho, fimDesenho]);

    // Verifica se uma posição está coberta por névoa
    const estaCoberto = useCallback((mundoX, mundoY) => {
        for (let i = 0; i < camadasNevoa.length; i++) {
            const area = camadasNevoa[i];

            const larguraAtual = area.larguraOriginal * area.escala;
            const alturaAtual = area.alturaOriginal * area.escala;

            const dentro = mundoX >= area.x &&
                mundoX <= area.x + larguraAtual &&
                mundoY >= area.y &&
                mundoY <= area.y + alturaAtual;

            if (dentro) {
                return true;
            }
        }
        return false;
    }, [camadasNevoa]);

    return {
        // Estados
        modoDesenho,
        camadasNevoa,
        setCamadasNevoa,
        desenhando,
        inicioDesenho,
        fimDesenho,

        // Conversão de coordenadas
        telaParaMundo,
        mundoParaTela,

        // Ações de desenho
        ativarModoDesenho,
        desativarModoDesenho,
        iniciarDesenho,
        atualizarDesenho,
        finalizarDesenho,
        setUIStateRef,

        // Gerenciamento de camadas
        limparTudo,
        desfazer,
        deletarCamada,
        encontrarCamadaNaPosicao,
        atualizarEscalaCamada,
        atualizarPosicaoCamada,
        getCamadaComInfo,

        // Renderização e utilitários
        registrarCallbackRender,
        renderizarNevoa,
        estaCoberto
    };
}