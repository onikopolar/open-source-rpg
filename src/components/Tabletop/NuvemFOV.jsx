// src/components/Tabletop/NuvemFOV.jsx
import { useState, useCallback, useRef } from "react";

export function useNuvemFOV() {
    // Estados principais
    const [modoDesenho, setModoDesenho] = useState(false);
    const [ferramenta, setFerramenta] = useState('pincel');
    const [camadasNevoa, setCamadasNevoa] = useState([]);

    // Estado do desenho atual
    const [desenhando, setDesenhando] = useState(false);
    const [inicioDesenho, setInicioDesenho] = useState({ x: 0, y: 0 });
    const [fimDesenho, setFimDesenho] = useState({ x: 0, y: 0 });

    // Refs para performance
    const rafRef = useRef(null);
    const onRenderCallbackRef = useRef(null);

    // Registra callback que o TabletopGrid vai fornecer para renderizar
    const registrarCallbackRender = useCallback((callback) => {
        onRenderCallbackRef.current = callback;
    }, []);

    // Inicia o desenho de uma área
    const iniciarDesenho = useCallback((x, y) => {
        if (!modoDesenho) {
            return;
        }

        setDesenhando(true);
        setInicioDesenho({ x, y });
        setFimDesenho({ x, y });
    }, [modoDesenho]);

    // Atualiza o desenho enquanto arrasta
    const atualizarDesenho = useCallback((x, y) => {

        if (!desenhando) {
            return;
        }

        setFimDesenho({ x, y });

        // Agenda renderização via requestAnimationFrame
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
            if (onRenderCallbackRef.current) {
                onRenderCallbackRef.current();
            }
            rafRef.current = null;
        });
    }, [desenhando]);

    // Finaliza o desenho e salva a área como um token (compatível com useRedimensionamentoToken)
    const finalizarDesenho = useCallback(() => {

        if (!desenhando) {
            return;
        }

        // Calcula a área final (normaliza coordenadas)
        const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
        const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
        const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
        const y2 = Math.max(inicioDesenho.y, fimDesenho.y);

        const largura = x2 - x1;
        const altura = y2 - y1;

        // Só salva se a área tiver tamanho mínimo
        if (Math.abs(largura) > 5 && Math.abs(altura) > 5) {
            // Cria como TOKEN para ser compatível com useRedimensionamentoToken
            const novoToken = {
                id: Date.now() + Math.random(),
                x: x1,
                y: y1,
                larguraOriginal: largura,
                alturaOriginal: altura,
                escala: 1.0,
                tipo: 'pincel'
            };

            setCamadasNevoa(prev => {
                const novas = [...prev, novoToken];
                return novas;
            });
        }

        setDesenhando(false);

        // Renderiza uma última vez
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
        setCamadasNevoa(prev => {
            const novas = prev.slice(0, -1);
            return novas;
        });
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Deleta uma camada específica pelo ID
    const deletarCamada = useCallback((id) => {
        setCamadasNevoa(prev => {
            const novas = prev.filter(camada => camada.id !== id);
            return novas;
        });
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Função para atualizar escala (necessária para redimensionamento)
    const atualizarEscalaCamada = useCallback((id, novaEscala) => {
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

    // Encontra qual camada está em uma posição específica (compatível com useRedimensionamentoToken)
    const encontrarCamadaNaPosicao = useCallback((mundoX, mundoY) => {

        // Percorre as camadas de trás pra frente (última desenhada tem prioridade)
        for (let i = camadasNevoa.length - 1; i >= 0; i--) {
            const camada = camadasNevoa[i];

            // Calcula tamanho atual com escala (igual ao token)
            const larguraAtual = camada.larguraOriginal * camada.escala;
            const alturaAtual = camada.alturaOriginal * camada.escala;

            // Verifica se a posição está dentro da camada
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

        // Desenha todas as camadas salvas
        camadasNevoa.forEach((area) => {
            // Calcula tamanho atual com escala
            const larguraMundo = area.larguraOriginal * area.escala;
            const alturaMundo = area.alturaOriginal * area.escala;

            // Aplica transformação da câmera
            const telaX = area.x * zoom + position.x;
            const telaY = area.y * zoom + position.y;
            const telaLargura = larguraMundo * zoom;
            const telaAltura = alturaMundo * zoom;

            // Pincel = adiciona névoa (preto)
            context.fillStyle = 'rgba(0, 0, 0, 0.8)';
            context.fillRect(telaX, telaY, telaLargura, telaAltura);
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

            // Preview em vermelho
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
        atualizarEscalaCamada,
        atualizarPosicaoCamada,
        getCamadaComInfo,

        // Renderização e utilitários
        registrarCallbackRender,
        renderizarNevoa,
        estaCoberto
    };
}