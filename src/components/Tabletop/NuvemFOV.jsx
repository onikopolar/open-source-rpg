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

    console.log(`🔍 [NuvemFOV] Hook inicializado`);

    // Registra callback que o TabletopGrid vai fornecer para renderizar
    const registrarCallbackRender = useCallback((callback) => {
        console.log(`🔍 [NuvemFOV] registrarCallbackRender`);
        onRenderCallbackRef.current = callback;
    }, []);
    
    // Atualiza a referência do uiState (zoom e posição da câmera)
    const setUIStateRef = useCallback((zoom, position) => {
        console.log(`🔍 [NuvemFOV] setUIStateRef - zoom: ${zoom.toFixed(4)}, position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
        uiStateRef.current = { zoom, position };
    }, []);
    
    // Converte coordenadas da tela para coordenadas do mundo
    const telaParaMundo = useCallback((telaX, telaY) => {
        const { zoom, position } = uiStateRef.current;
        const resultado = {
            x: (telaX - position.x) / zoom,
            y: (telaY - position.y) / zoom
        };
        console.log(`🔍 [NuvemFOV] telaParaMundo - entrada: (${telaX.toFixed(2)}, ${telaY.toFixed(2)}) -> mundo: (${resultado.x.toFixed(2)}, ${resultado.y.toFixed(2)}) | zoom: ${zoom.toFixed(4)}, position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
        return resultado;
    }, []);

    // Converte coordenadas do mundo para coordenadas da tela
    const mundoParaTela = useCallback((mundoX, mundoY) => {
        const { zoom, position } = uiStateRef.current;
        const resultado = {
            x: mundoX * zoom + position.x,
            y: mundoY * zoom + position.y
        };
        console.log(`🔍 [NuvemFOV] mundoParaTela - entrada: (${mundoX.toFixed(2)}, ${mundoY.toFixed(2)}) -> tela: (${resultado.x.toFixed(2)}, ${resultado.y.toFixed(2)}) | zoom: ${zoom.toFixed(4)}, position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
        return resultado;
    }, []);

    // Ativa modo desenho
    const ativarModoDesenho = useCallback(() => {
        console.log(`🔍 [NuvemFOV] ativarModoDesenho - modoDesenho ativado`);
        setModoDesenho(true);
    }, []);

    // Desativa modo desenho
    const desativarModoDesenho = useCallback(() => {
        console.log(`🔍 [NuvemFOV] desativarModoDesenho - modoDesenho desativado`);
        setModoDesenho(false);
        setDesenhando(false);
    }, []);

    // Inicia o desenho de uma área (recebe coordenadas da tela, converte para mundo)
    const iniciarDesenho = useCallback((telaX, telaY) => {
        console.log(`🔍 [NuvemFOV] iniciarDesenho - tela: (${telaX.toFixed(2)}, ${telaY.toFixed(2)}), modoDesenho: ${modoDesenho}`);
        if (!modoDesenho) {
            console.log(`🔍 [NuvemFOV] iniciarDesenho - ignorado, modoDesenho false`);
            return;
        }
        
        const mundo = telaParaMundo(telaX, telaY);
        console.log(`🔍 [NuvemFOV] iniciarDesenho - mundo: (${mundo.x.toFixed(2)}, ${mundo.y.toFixed(2)})`);
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
        console.log(`🔍 [NuvemFOV] atualizarDesenho - mundo: (${mundo.x.toFixed(2)}, ${mundo.y.toFixed(2)})`);
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
        console.log(`🔍 [NuvemFOV] finalizarDesenho - desenhando: ${desenhando}`);
        if (!desenhando) {
            console.log(`🔍 [NuvemFOV] finalizarDesenho - ignorado, não estava desenhando`);
            return;
        }

        const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
        const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
        const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
        const y2 = Math.max(inicioDesenho.y, fimDesenho.y);

        const largura = x2 - x1;
        const altura = y2 - y1;

        console.log(`🔍 [NuvemFOV] finalizarDesenho - área: (${x1.toFixed(2)}, ${y1.toFixed(2)}) -> (${x2.toFixed(2)}, ${y2.toFixed(2)}) | tamanho: ${largura.toFixed(2)}x${altura.toFixed(2)}`);

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

            console.log(`🔍 [NuvemFOV] finalizarDesenho - CRIANDO NOVA CAMADA:`, {
                id: novoToken.id,
                x: novoToken.x.toFixed(2),
                y: novoToken.y.toFixed(2),
                larguraOriginal: novoToken.larguraOriginal.toFixed(2),
                alturaOriginal: novoToken.alturaOriginal.toFixed(2)
            });

            setCamadasNevoa(prev => {
                console.log(`🔍 [NuvemFOV] finalizarDesenho - camadas antes: ${prev.length}, depois: ${prev.length + 1}`);
                return [...prev, novoToken];
            });
        } else {
            console.log(`🔍 [NuvemFOV] finalizarDesenho - área muito pequena, ignorando`);
        }

        setDesenhando(false);

        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, [desenhando, inicioDesenho, fimDesenho]);

    // Limpa todas as camadas
    const limparTudo = useCallback(() => {
        console.log(`🔍 [NuvemFOV] limparTudo - removendo ${camadasNevoa.length} camadas`);
        setCamadasNevoa([]);
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, [camadasNevoa.length]);

    // Desfaz a última camada
    const desfazer = useCallback(() => {
        console.log(`🔍 [NuvemFOV] desfazer - camadas antes: ${camadasNevoa.length}`);
        setCamadasNevoa(prev => {
            const novas = prev.slice(0, -1);
            console.log(`🔍 [NuvemFOV] desfazer - camadas depois: ${novas.length}`);
            return novas;
        });
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, [camadasNevoa.length]);

    // Deleta uma camada específica pelo ID
    const deletarCamada = useCallback((id) => {
        console.log(`🔍 [NuvemFOV] deletarCamada - id: ${id}, camadas antes: ${camadasNevoa.length}`);
        setCamadasNevoa(prev => {
            const novas = prev.filter(camada => camada.id !== id);
            console.log(`🔍 [NuvemFOV] deletarCamada - camadas depois: ${novas.length}`);
            return novas;
        });
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, [camadasNevoa.length]);

    // Função para atualizar escala (necessária para redimensionamento)
    const atualizarEscalaCamada = useCallback((id, novaEscala) => {
        console.log(`🔍 [NuvemFOV] atualizarEscalaCamada - id: ${id}, novaEscala: ${novaEscala.toFixed(4)}`);
        setCamadasNevoa(prev => {
            const novas = prev.map(camada =>
                camada.id === id
                    ? { ...camada, escala: novaEscala }
                    : camada
            );
            return novas;
        });

        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Função para atualizar posição (necessária para movimento)
    const atualizarPosicaoCamada = useCallback((id, novaX, novaY) => {
        console.log(`🔍 [NuvemFOV] atualizarPosicaoCamada - id: ${id}, nova posição mundo: (${novaX.toFixed(2)}, ${novaY.toFixed(2)})`);
        setCamadasNevoa(prev => {
            const novas = prev.map(camada =>
                camada.id === id
                    ? { ...camada, x: novaX, y: novaY }
                    : camada
            );
            return novas;
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

        console.log(`🔍 [NuvemFOV] getCamadaComInfo - camada:`, {
            id: camada.id,
            mundo: { x: camada.x, y: camada.y, w: camada.larguraOriginal, h: camada.alturaOriginal, escala: camada.escala },
            tela: { x: posicaoTela.x, y: posicaoTela.y, w: larguraTela, h: alturaTela }
        });

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
                console.log(`🔍 [NuvemFOV] encontrarCamadaNaPosicao - encontrada camada ${i}:`, {
                    id: camada.id,
                    bounds: { x: camada.x, y: camada.y, w: larguraAtual, h: alturaAtual }
                });
                return camada;
            }
        }
        console.log(`🔍 [NuvemFOV] encontrarCamadaNaPosicao - nenhuma camada encontrada`);
        return null;
    }, [camadasNevoa]);

    // Renderiza a névoa no canvas
    const renderizarNevoa = useCallback((context, zoom, position) => {
        console.log(`🔍 [NuvemFOV] renderizarNevoa - zoom: ${zoom.toFixed(4)}, position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}), camadas: ${camadasNevoa.length}`);
        uiStateRef.current = { zoom, position };
        
        camadasNevoa.forEach((area, idx) => {
            const larguraMundo = area.larguraOriginal * area.escala;
            const alturaMundo = area.alturaOriginal * area.escala;

            const telaX = area.x * zoom + position.x;
            const telaY = area.y * zoom + position.y;
            const telaLargura = larguraMundo * zoom;
            const telaAltura = alturaMundo * zoom;

            console.log(`🔍 [NuvemFOV] renderizarNevoa - camada ${idx}:`, {
                mundo: { x: area.x, y: area.y, w: larguraMundo, h: alturaMundo },
                tela: { x: telaX.toFixed(2), y: telaY.toFixed(2), w: telaLargura.toFixed(2), h: telaAltura.toFixed(2) }
            });

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

            console.log(`🔍 [NuvemFOV] renderizarNevoa - desenhando preview: tela (${telaX.toFixed(2)}, ${telaY.toFixed(2)}) ${telaLargura.toFixed(2)}x${telaAltura.toFixed(2)}`);

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