import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer } from "react";
import TokenModal from "../../components/TokenModal/TokenModal";
import { DragDropSystem } from "../../components/TokenModal/TokenModal";
import {
    GridContainer,
    BarraLateral,
    CanvasDesenho,
    desenharBordaDeArrasto,
    desenharFallbackToken,
    desenharSelecao
} from "../../components/TabletopDesign";
import { ModalNevoa } from "../../components/Tabletop/ModalNevoa";
import { MenuContextoToken } from "../../components/Tabletop/MenuContextoToken";

import { WORLD_WIDTH, WORLD_HEIGHT, TOLERANCIA_CLIQUE, RENDER_INTERVAL, BASE_GRID_SIZE, GRID_CONFIGS, clamp } from "../../components/Tabletop/ConstantesMesa";
import { useDesfazerRefazer } from "../../components/Tabletop/useDesfazerRefazer";
import { initialUIState, uiReducer } from "../../components/Tabletop/RedutorUI";
import { useMovimentoToken } from "../../components/Tabletop/useMovimentoToken";
import { useRedimensionamentoToken } from "../../components/Tabletop/useRedimensionamentoToken";
import { useEventosMouse } from "../../components/Tabletop/useEventosMouse";
import { useAtalhosTeclado } from "../../components/Tabletop/useAtalhosTeclado";
import { useSelecaoToken, calcularBoundingBoxGrupo } from "../../components/Tabletop/useSelecaoToken";
import { useRenderizacaoToken } from "../../components/Tabletop/useRenderizacaoToken";
import { trazerTokenParaFrente } from "../../components/Tabletop/UtilitariosToken";
import { useNuvemFOV } from "../../components/Tabletop/NuvemFOV";
import { useMouseTabletop } from "../../components/Tabletop/MouseTabletop";

function TabletopGrid({ isMaster = true, sheetId = null }) {
    // isMaster = true  → Mestre: acesso total (adicionar token, editar névoa, etc)
    // isMaster = false → Player: só pode mover, inverter e deletar tokens (não pode criar)

    // Controle dos modais
    const [modalTokenAberto, setModalTokenAberto] = useState(false);
    const [menuNevoaAberto, setMenuNevoaAberto] = useState(false);
    const [menuNevoaPosicao, setMenuNevoaPosicao] = useState({ x: 0, y: 0 });

    // Hook da névoa de guerra (desenha e gerencia as camadas de escuridão)
    const nevoa = useNuvemFOV();

    // Sistema de desfazer/refazer (histórico de ações)
    const {
        state: tokens,
        push: adicionarAoHistorico,
        undo,
        redo,
        canUndo,
        canRedo,
        setStateDirect
    } = useDesfazerRefazer([]);

    // Estado da interface (zoom, posição da câmera, seleções, etc)
    const [estadoUI, despacharUI] = useReducer(uiReducer, initialUIState);

    // Refs para controle de arrasto e redimensionamento
    const estaArrastandoRef = useRef(false);
    const arrastoEmProgressoRef = useRef(false);
    const redimensionandoRef = useRef(false);
    const ignoreMouseTimeoutRef = useRef(null);
    const teveMovimentoRef = useRef(false);
    const isRightClickDragRef = useRef(false);
    
    // Refs para elementos DOM
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const menuRef = useRef(null);
    
    // Cache de imagens (evita recarregar toda hora)
    const cacheImagens = useRef(new Map());
    const inicioArrastoRef = useRef({ x: 0, y: 0 });
    const frameAnimacaoRef = useRef(null);
    
    // Controle de renderização (performance)
    const renderAgendadoRef = useRef(false);
    const ultimoRenderTimeRef = useRef(0);
    const contextRef = useRef(null);
    const renderCallbackRef = useRef(null);

    // Hooks de movimento e redimensionamento
    const { processarArrastoToken } = useMovimentoToken();
    const { processarRedimensionamento, resizeStartStateRef } = useRedimensionamentoToken();

    // Limita a posição da câmera para não sair das bordas do mundo
    const limitarPosicaoMapa = useCallback((novaX, novaY) => {
        if (!containerRef.current) return { x: novaX, y: novaY };

        const rect = containerRef.current.getBoundingClientRect();
        const mundoLarguraZoom = WORLD_WIDTH * estadoUI.zoom;
        const mundoAlturaZoom = WORLD_HEIGHT * estadoUI.zoom;

        return {
            x: clamp(novaX, rect.width - mundoLarguraZoom, 0),
            y: clamp(novaY, rect.height - mundoAlturaZoom, 0)
        };
    }, [estadoUI.zoom]);

    // Converte coordenada da tela para coordenada do mundo (considerando zoom e posição da câmera)
    const telaParaMundo = useCallback((mouseX, mouseY) => {
        return {
            x: (mouseX - estadoUI.position.x) / estadoUI.zoom,
            y: (mouseY - estadoUI.position.y) / estadoUI.zoom
        };
    }, [estadoUI.position, estadoUI.zoom]);

    // Verifica se o mouse está sobre um elemento (token ou névoa)
    const estaDentroDoElemento = useCallback((mouseX, mouseY, elemX, elemY, largura, altura) => {
        return mouseX >= elemX - TOLERANCIA_CLIQUE &&
            mouseX <= elemX + largura + TOLERANCIA_CLIQUE &&
            mouseY >= elemY - TOLERANCIA_CLIQUE &&
            mouseY <= elemY + altura + TOLERANCIA_CLIQUE;
    }, []);

    // Calcula quais grades devem ser exibidas com base no zoom atual
    const gradesVisiveis = useMemo(() => {
        return GRID_CONFIGS
            .filter(config => estadoUI.zoom >= config.zoomThreshold)
            .map((config, index, array) => {
                const strokeWidth = Math.max(0.5, 1 / estadoUI.zoom);
                const baseSize = BASE_GRID_SIZE * config.sizeMultiplier;
                let alpha = config.alpha;

                if (index > 0) {
                    const configAnterior = array[index - 1];
                    const rangeTransicao = (config.zoomThreshold - configAnterior.zoomThreshold) * 0.2;
                    const inicioFade = config.zoomThreshold - rangeTransicao;

                    if (estadoUI.zoom > inicioFade && estadoUI.zoom < config.zoomThreshold + rangeTransicao) {
                        const progresso = (estadoUI.zoom - inicioFade) / (rangeTransicao * 2);
                        alpha = config.alpha * Math.min(1, Math.max(0, progresso));
                    }
                }

                return { size: baseSize, alpha, strokeWidth };
            });
    }, [estadoUI.zoom]);

    // Prepara as informações dos tokens para renderização (calcula posições na tela)
    const tokensInfo = useMemo(() => {
        return tokens.map((token, indice) => {
            const larguraOriginal = token.larguraOriginal || 50;
            const alturaOriginal = token.alturaOriginal || 50;
            const escala = token.escala || 1;

            const posicaoTela = {
                x: (token.x * estadoUI.zoom) + estadoUI.position.x,
                y: (token.y * estadoUI.zoom) + estadoUI.position.y
            };

            const larguraMundo = larguraOriginal * escala;
            const alturaMundo = alturaOriginal * escala;
            const larguraTela = larguraMundo * estadoUI.zoom;
            const alturaTela = alturaMundo * estadoUI.zoom;

            const estaSelecionado = estadoUI.tokenSelecionado === indice ||
                estadoUI.tokensSelecionados.includes(indice);
            const estaBloqueado = estadoUI.tokensBloqueados[token.id] === true;

            return {
                ...token,
                indice,
                posicaoTela,
                larguraOriginal,
                alturaOriginal,
                tamanhoTela: {
                    larguraOriginal,
                    alturaOriginal,
                    larguraMundo,
                    alturaMundo,
                    larguraTela,
                    alturaTela
                },
                oculto: estadoUI.visibilidadeTokens[token.id] === true,
                bloqueado: estaBloqueado,
                estaSelecionado,
                tipo: 'token'
            };
        });
    }, [tokens, estadoUI.zoom, estadoUI.position, estadoUI.visibilidadeTokens,
        estadoUI.tokensBloqueados, estadoUI.tokenSelecionado, estadoUI.tokensSelecionados]);

    // Prepara as informações das camadas de névoa para renderização
    const camadasInfo = useMemo(() => {
        return nevoa.camadasNevoa.map((camada, indice) => {
            const larguraMundo = camada.larguraOriginal * camada.escala;
            const alturaMundo = camada.alturaOriginal * camada.escala;

            const posicaoTela = {
                x: (camada.x * estadoUI.zoom) + estadoUI.position.x,
                y: (camada.y * estadoUI.zoom) + estadoUI.position.y
            };

            const larguraTela = larguraMundo * estadoUI.zoom;
            const alturaTela = alturaMundo * estadoUI.zoom;

            return {
                ...camada,
                indice,
                posicaoTela,
                tamanhoTela: {
                    larguraOriginal: camada.larguraOriginal,
                    alturaOriginal: camada.alturaOriginal,
                    larguraMundo,
                    alturaMundo,
                    larguraTela,
                    alturaTela
                },
                bloqueado: false,
                tipo: 'nevoa'
            };
        });
    }, [nevoa.camadasNevoa, estadoUI.zoom, estadoUI.position]);

    // Junta tokens e névoa em um único array para facilitar a renderização
    const todosItens = useMemo(() => {
        return [...tokensInfo, ...camadasInfo];
    }, [tokensInfo, camadasInfo]);

    // Hook que detecta onde o mouse está clicando (seleção de tokens)
    const { 
        verificarSeMouseSobreToken,
        verificarSeMousePodeRedimensionar,
        tokenEstaNaAreaSelecao
    } = useSelecaoToken(tokens, tokensInfo, estadoUI, estaDentroDoElemento);

    // Pega o contexto do canvas (onde desenhamos tudo)
    const pegarContextoCanvas = useCallback(() => {
        if (contextRef.current) return contextRef.current;

        const canvas = canvasRef.current;
        if (!canvas) return null;

        contextRef.current = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });

        return contextRef.current;
    }, []);

    // Desenha a grade de fundo
    const desenharGrade = useCallback(() => {
        const contexto = pegarContextoCanvas();
        if (!contexto) return;

        contexto.save();
        contexto.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        contexto.translate(estadoUI.position.x, estadoUI.position.y);
        contexto.scale(estadoUI.zoom, estadoUI.zoom);

        for (const grade of gradesVisiveis) {
            contexto.strokeStyle = `rgba(255, 255, 255, ${grade.alpha})`;
            contexto.lineWidth = grade.strokeWidth;

            for (let x = 0; x <= WORLD_WIDTH; x += grade.size) {
                contexto.beginPath();
                contexto.moveTo(x, 0);
                contexto.lineTo(x, WORLD_HEIGHT);
                contexto.stroke();
            }

            for (let y = 0; y <= WORLD_HEIGHT; y += grade.size) {
                contexto.beginPath();
                contexto.moveTo(0, y);
                contexto.lineTo(WORLD_WIDTH, y);
                contexto.stroke();
            }
        }

        contexto.restore();
    }, [estadoUI.zoom, estadoUI.position, gradesVisiveis, pegarContextoCanvas]);

    // Agenda a renderização (otimização de performance)
    const agendarRender = useCallback(() => {
        const agora = Date.now();

        if (agora - ultimoRenderTimeRef.current < RENDER_INTERVAL) {
            if (!renderAgendadoRef.current) {
                renderAgendadoRef.current = true;
                requestAnimationFrame(() => {
                    renderAgendadoRef.current = false;
                    ultimoRenderTimeRef.current = Date.now();
                    if (renderCallbackRef.current) {
                        renderCallbackRef.current();
                    }
                });
            }
            return;
        }

        ultimoRenderTimeRef.current = agora;
        if (renderCallbackRef.current) {
            renderCallbackRef.current();
        }
    }, []);

    // Hook que desenha os tokens com cache de imagens
    const { drawTokenWithCache } = useRenderizacaoToken(
        estadoUI,
        cacheImagens,
        pegarContextoCanvas,
        agendarRender,
        desenharFallbackToken,
        desenharBordaDeArrasto,
        desenharSelecao
    );

    // Registra o callback de render no hook da névoa
    useEffect(() => {
        nevoa.registrarCallbackRender(agendarRender);
        nevoa.setUIStateRef(estadoUI.zoom, estadoUI.position);
    }, [nevoa, agendarRender, estadoUI.zoom, estadoUI.position]);

    // Função principal de renderização (desenha grade, tokens, névoa, seleções)
    const renderizarTudo = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        const contexto = pegarContextoCanvas();
        if (!contexto) return;

        contexto.clearRect(0, 0, canvas.width, canvas.height);
        contexto.setTransform(1, 0, 0, 1, 0, 0);

        // 1. Desenha a grade
        desenharGrade();

        // 2. Desenha todos os tokens
        for (let i = 0; i < todosItens.length; i++) {
            const item = todosItens[i];
            if (item.tipo === 'token') {
                drawTokenWithCache(item, item.indice, contexto);
            }
        }

        // 3. Desenha a névoa (todos os players veem, só o mestre edita)
        nevoa.setUIStateRef(estadoUI.zoom, estadoUI.position);
        nevoa.renderizarNevoa(contexto, estadoUI.zoom, estadoUI.position);

        // 4. Desenha borda de arrasto (quando movendo algo)
        if (estadoUI.tokenSendoArrastado) {
            const itemInfo = todosItens[estadoUI.tokenSendoArrastado.indice];
            if (itemInfo) {
                const nome = itemInfo.tipo === 'token' ? (itemInfo.nome || "Token") : "Névoa";
                desenharBordaDeArrasto(
                    contexto,
                    itemInfo.posicaoTela.x,
                    itemInfo.posicaoTela.y,
                    itemInfo.tamanhoTela.larguraTela,
                    itemInfo.tamanhoTela.alturaTela,
                    nome
                );
            }
        }

        if (estadoUI.camadaSendoArrastada) {
            const itemInfo = todosItens[tokensInfo.length + estadoUI.camadaSendoArrastada.indice];
            if (itemInfo) {
                desenharBordaDeArrasto(
                    contexto,
                    itemInfo.posicaoTela.x,
                    itemInfo.posicaoTela.y,
                    itemInfo.tamanhoTela.larguraTela,
                    itemInfo.tamanhoTela.alturaTela,
                    "Névoa"
                );
            }
        }

        // 5. Desenha seleção múltipla de tokens
        if (estadoUI.tokensSelecionados.length > 1) {
            const itensSelecionados = estadoUI.tokensSelecionados
                .map(indice => todosItens[indice])
                .filter(item => item && !item.bloqueado && item.tipo === 'token');

            if (itensSelecionados.length > 0) {
                const boundingBox = calcularBoundingBoxGrupo(itensSelecionados);
                desenharSelecao(contexto, boundingBox, estadoUI.zoom, itensSelecionados.length, true);
            }
        }

        // 6. Desenha seleção individual de token
        if (estadoUI.tokenSelecionado !== null && !estadoUI.tokenSendoArrastado && !estadoUI.camadaSendoArrastada) {
            const itemInfo = todosItens[estadoUI.tokenSelecionado];
            if (itemInfo && !itemInfo.bloqueado && itemInfo.tipo === 'token') {
                const isPartOfGroup = estadoUI.tokensSelecionados.length > 1;
                if (!isPartOfGroup) {
                    const boundingBox = {
                        x: itemInfo.posicaoTela.x,
                        y: itemInfo.posicaoTela.y,
                        largura: itemInfo.tamanhoTela.larguraTela,
                        altura: itemInfo.tamanhoTela.alturaTela
                    };
                    desenharSelecao(contexto, boundingBox, estadoUI.zoom, 1, true);
                }
            }
        }

        // 7. Desenha seleção múltipla de névoa
        if (estadoUI.camadasSelecionadas.length > 1) {
            const itensSelecionados = estadoUI.camadasSelecionadas
                .map(indice => todosItens[tokensInfo.length + indice])
                .filter(item => item && item.tipo === 'nevoa');

            if (itensSelecionados.length > 0) {
                const boundingBox = calcularBoundingBoxGrupo(itensSelecionados);
                desenharSelecao(contexto, boundingBox, estadoUI.zoom, itensSelecionados.length, true);
            }
        }

        // 8. Desenha seleção individual de névoa
        if (estadoUI.camadaSelecionada !== null && !estadoUI.camadaSendoArrastada && !estadoUI.tokenSendoArrastado) {
            const itemInfo = todosItens[tokensInfo.length + estadoUI.camadaSelecionada];
            if (itemInfo && itemInfo.tipo === 'nevoa') {
                const boundingBox = {
                    x: itemInfo.posicaoTela.x,
                    y: itemInfo.posicaoTela.y,
                    largura: itemInfo.tamanhoTela.larguraTela,
                    altura: itemInfo.tamanhoTela.alturaTela
                };
                desenharSelecao(contexto, boundingBox, estadoUI.zoom, 1, true);
            }
        }

        // 9. Desenha área de seleção (quando arrasta o mouse para selecionar)
        if (estadoUI.areaSelecao.ativo) {
            const boundingBox = {
                x: Math.min(estadoUI.areaSelecao.inicioX, estadoUI.areaSelecao.fimX),
                y: Math.min(estadoUI.areaSelecao.inicioY, estadoUI.areaSelecao.fimY),
                largura: Math.abs(estadoUI.areaSelecao.fimX - estadoUI.areaSelecao.inicioX),
                altura: Math.abs(estadoUI.areaSelecao.fimY - estadoUI.areaSelecao.inicioY)
            };
            desenharSelecao(contexto, boundingBox, estadoUI.zoom, 1, false);
        }

    }, [todosItens, tokensInfo.length, desenharGrade, drawTokenWithCache, pegarContextoCanvas,
        estadoUI, desenharSelecao, desenharBordaDeArrasto, nevoa, calcularBoundingBoxGrupo]);

    // Guarda a função de render para ser usada no agendamento
    useEffect(() => {
        renderCallbackRef.current = renderizarTudo;
    }, [renderizarTudo]);

    // Eventos de mouse (zoom e arrasto da câmera)
    const { handleWheel, handleDragOver } = useEventosMouse(estadoUI, despacharUI, containerRef, inicioArrastoRef, limitarPosicaoMapa);

    // Finaliza o arrasto e salva no histórico
    const finalizarArrasto = useCallback(() => {
        if (arrastoEmProgressoRef.current && (estadoUI.tokenSendoArrastado || estadoUI.camadaSendoArrastada || estadoUI.tokensSelecionados.length > 0)) {
            const novosTokens = [...tokens];
            adicionarAoHistorico(novosTokens);

            despacharUI({
                type: 'SET_FEEDBACK',
                payload: {
                    message: estadoUI.tokensSelecionados.length > 1 ? 'Itens movidos' : 'Item movido',
                    type: 'success'
                }
            });

            if (teveMovimentoRef.current) {
                despacharUI({ type: 'SELECT_TOKEN', payload: null });
                despacharUI({ type: 'SELECT_CAMADA', payload: null });
            }

            arrastoEmProgressoRef.current = false;
            teveMovimentoRef.current = false;
        }
    }, [tokens, estadoUI, adicionarAoHistorico, despacharUI]);

    // Finaliza o redimensionamento
    const finalizarRedimensionamento = useCallback(() => {
        if (redimensionandoRef.current) {
            if (estadoUI.tokenRedimensionando) {
                const novosTokens = [...tokens];
                adicionarAoHistorico(novosTokens);
            }
            redimensionandoRef.current = false;
            resizeStartStateRef.current = null;
        }
    }, [tokens, estadoUI, adicionarAoHistorico, resizeStartStateRef]);

    // Deleta uma camada de névoa (só mestre)
    const deletarCamada = useCallback((camadaId) => {
        nevoa.deletarCamada(camadaId);
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
    }, [nevoa, despacharUI]);

    // Hook customizado que gerencia todos os eventos de mouse
    const { handleMouseDown, handleMouseMove, handleMouseUp } = useMouseTabletop({
        containerRef,
        dragStartRef: inicioArrastoRef,
        resizeStartStateRef,
        isDraggingRef: estaArrastandoRef,
        dragInProgressRef: arrastoEmProgressoRef,
        resizeInProgressRef: redimensionandoRef,
        teveMovimentoRef,
        isRightClickDragRef,
        rafRef: frameAnimacaoRef,
        uiState: estadoUI,
        uiDispatch: despacharUI,
        tokensState: tokens,
        tokensComInfo: tokensInfo,
        camadasComInfo: camadasInfo,
        converterMouseParaMundo: telaParaMundo,
        verificarSeMouseSobreToken,
        verificarSeMousePodeRedimensionar,
        tokenEstaNaAreaSelecao,
        restringirPosicao: limitarPosicaoMapa,
        processarArrastoToken,
        processarRedimensionamento,
        setStateDirect,
        fov: nevoa,
        trazerTokenParaFrente,
        finalizarArrasto,
        finalizarRedimensionamento
    });

    // Drag and drop: só o mestre pode arrastar imagens para criar tokens
    const handleDrop = useCallback((event) => {
        // Player não pode criar tokens por drag and drop
        if (!isMaster) return;

        event.preventDefault();
        event.stopPropagation();

        try {
            const dados = JSON.parse(event.dataTransfer.getData('application/json'));

            if (dados.origem !== 'grid' && dados.tipo === 'token') {
                setModalTokenAberto(false);

                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                const mundo = telaParaMundo(mouseX, mouseY);

                const novoToken = {
                    ...dados,
                    id: `${dados.id}-${Date.now()}`,
                    x: mundo.x - ((dados.larguraOriginal || 50) / 2),
                    y: mundo.y - ((dados.alturaOriginal || 50) / 2),
                    escala: 1.0
                };

                const novosTokens = [...tokens, novoToken];
                adicionarAoHistorico(novosTokens);
            }
        } catch (erro) {
            // Ignora erros
        }
    }, [isMaster, tokens, adicionarAoHistorico, telaParaMundo]);

    // Desfazer (Ctrl+Z)
    const handleUndo = useCallback(() => {
        if (!canUndo) {
            despacharUI({
                type: 'SET_FEEDBACK',
                payload: { message: 'Fim do histórico', type: 'warning' }
            });
            setTimeout(() => despacharUI({ type: 'RESET_UI_FEEDBACK' }), 1000);
            return;
        }

        despacharUI({ type: 'STOP_DRAG' });
        despacharUI({ type: 'STOP_RESIZE' });
        despacharUI({ type: 'SET_MOUSE_DOWN_INFO', payload: null });

        estaArrastandoRef.current = false;
        arrastoEmProgressoRef.current = false;
        redimensionandoRef.current = false;
        resizeStartStateRef.current = null;

        despacharUI({ type: 'SET_IGNORE_MOUSE_MOVE', payload: true });

        window.dispatchEvent(new MouseEvent('mouseup', {
            view: window,
            bubbles: true,
            cancelable: true
        }));

        undo();

        if (ignoreMouseTimeoutRef.current) clearTimeout(ignoreMouseTimeoutRef.current);
        ignoreMouseTimeoutRef.current = setTimeout(() => {
            despacharUI({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }, 100);
    }, [canUndo, undo, despacharUI, resizeStartStateRef]);

    // Refazer (Ctrl+Y)
    const handleRedo = useCallback(() => {
        if (!canRedo) {
            despacharUI({
                type: 'SET_FEEDBACK',
                payload: { message: 'Fim do histórico de refazer', type: 'warning' }
            });
            setTimeout(() => despacharUI({ type: 'RESET_UI_FEEDBACK' }), 1000);
            return;
        }

        despacharUI({ type: 'STOP_DRAG' });
        despacharUI({ type: 'STOP_RESIZE' });
        despacharUI({ type: 'SET_MOUSE_DOWN_INFO', payload: null });

        estaArrastandoRef.current = false;
        arrastoEmProgressoRef.current = false;
        redimensionandoRef.current = false;
        resizeStartStateRef.current = null;

        despacharUI({ type: 'SET_IGNORE_MOUSE_MOVE', payload: true });

        window.dispatchEvent(new MouseEvent('mouseup', {
            view: window,
            bubbles: true,
            cancelable: true
        }));

        redo();

        if (ignoreMouseTimeoutRef.current) clearTimeout(ignoreMouseTimeoutRef.current);
        ignoreMouseTimeoutRef.current = setTimeout(() => {
            despacharUI({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }, 100);
    }, [canRedo, redo, despacharUI, resizeStartStateRef]);

    // Atalhos de teclado (Ctrl+Z e Ctrl+Y)
    useAtalhosTeclado(handleUndo, handleRedo);

    // Inicializa o contexto do canvas
    useEffect(() => {
        pegarContextoCanvas();
        return () => {
            contextRef.current = null;
        };
    }, [pegarContextoCanvas]);

    // Agenda renderização quando algo muda
    useEffect(() => {
        agendarRender();
    }, [todosItens, estadoUI.tokenSendoArrastado, estadoUI.camadaSendoArrastada,
        estadoUI.tokenSelecionado, estadoUI.camadaSelecionada, estadoUI.zoom, estadoUI.position,
        estadoUI.areaSelecao, estadoUI.tokensSelecionados, estadoUI.camadasSelecionadas, agendarRender]);

    useEffect(() => {
        agendarRender();
    }, [estadoUI.visibilidadeTokens, agendarRender]);

    // Gerencia feedback (mensagens temporárias)
    useEffect(() => {
        if (estadoUI.ui.mostrarFeedback) {
            const timer = setTimeout(() => {
                despacharUI({ type: 'RESET_UI_FEEDBACK' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [estadoUI.ui.mostrarFeedback, despacharUI]);

    // Adiciona event listeners globais
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

    // Fecha menu quando clica fora
    useEffect(() => {
        if (!estadoUI.menuContexto.aberto) return;

        const handleClickFora = (event) => {
            if (event.button === 2) return;
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
            }
        };

        document.addEventListener('mousedown', handleClickFora);
        return () => document.removeEventListener('mousedown', handleClickFora);
    }, [estadoUI.menuContexto.aberto, despacharUI]);

    // Bloqueia menu de contexto padrão do navegador
    useEffect(() => {
        const bloquearMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', bloquearMenu);
        return () => document.removeEventListener('contextmenu', bloquearMenu);
    }, []);

    // Limpa cache de imagens quando tokens são removidos
    useEffect(() => {
        const idsTokens = new Set(tokens.map(t => t.id));
        for (const [id] of cacheImagens.current.entries()) {
            if (!idsTokens.has(id)) {
                cacheImagens.current.delete(id);
            }
        }
    }, [tokens]);

    // Sistema de drag and drop (só mestre)
    useEffect(() => {
        if (!isMaster) return;

        DragDropSystem.register('TabletopGrid', containerRef.current, (dados, event) => {
            if (dados.tipo === 'token') {
                setModalTokenAberto(false);

                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                const mundo = telaParaMundo(mouseX, mouseY);

                const novoToken = {
                    ...dados,
                    id: `${dados.id}-${Date.now()}`,
                    x: mundo.x - ((dados.larguraOriginal || 50) / 2),
                    y: mundo.y - ((dados.alturaOriginal || 50) / 2),
                    escala: 1.0
                };

                const novosTokens = [...tokens, novoToken];
                adicionarAoHistorico(novosTokens);
            }
        });

        return () => {
            DragDropSystem.unregister('TabletopGrid');
        };
    }, [isMaster, tokens, adicionarAoHistorico, telaParaMundo]);

    // Limpa timeout no unmount
    useEffect(() => {
        return () => {
            if (ignoreMouseTimeoutRef.current) {
                clearTimeout(ignoreMouseTimeoutRef.current);
            }
        };
    }, []);

    // Deleta token (player também pode deletar)
    const handleDeleteToken = useCallback((tokenIndice) => {
        const novosTokens = tokens.filter((_, i) => i !== tokenIndice);
        adicionarAoHistorico(novosTokens);
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
    }, [tokens, adicionarAoHistorico, despacharUI]);

    // Oculta token (só mestre)
    const handleToggleVisibility = useCallback((tokenId) => {
        if (!isMaster) return;
        despacharUI({ type: 'TOGGLE_VISIBILITY', payload: tokenId });
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
    }, [isMaster, despacharUI]);

    // Bloqueia/desbloqueia token (só mestre)
    const handleToggleLock = useCallback((tokenId) => {
        if (!isMaster) return;
        const estaBloqueado = !estadoUI.tokensBloqueados[tokenId];
        despacharUI({ type: 'TOGGLE_LOCK', payload: tokenId });
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });

        despacharUI({
            type: 'SET_FEEDBACK',
            payload: {
                message: estaBloqueado ? 'Token bloqueado' : 'Token desbloqueado',
                type: estaBloqueado ? 'warning' : 'success'
            }
        });
    }, [isMaster, estadoUI.tokensBloqueados, despacharUI]);

    // Bloqueia/desbloqueia camada de névoa (só mestre)
    const handleToggleCamadaLock = useCallback((camadaId) => {
        if (!isMaster) return;
        const camada = nevoa.camadasNevoa.find(c => c.id === camadaId);
        if (!camada) return;

        const estaBloqueado = estadoUI.camadasBloqueadas?.[camadaId] === true;

        despacharUI({ type: 'TOGGLE_CAMADA_LOCK', payload: camadaId });
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });

        despacharUI({
            type: 'SET_FEEDBACK',
            payload: {
                message: estaBloqueado ? 'Camada desbloqueada' : 'Camada bloqueada',
                type: estaBloqueado ? 'success' : 'warning'
            }
        });
    }, [isMaster, estadoUI.camadasBloqueadas, despacharUI, nevoa.camadasNevoa]);

    // Inverte token (player também pode inverter)
    const handleInverterToken = (tokenId) => {
        let posicaoToken = -1;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].id === tokenId) {
                posicaoToken = i;
                break;
            }
        }

        if (posicaoToken === -1) return;

        const tokenOriginal = tokens[posicaoToken];
        const tokenInvertido = {
            ...tokenOriginal,
            invertido: !tokenOriginal.invertido
        };

        const novosTokens = [...tokens];
        novosTokens[posicaoToken] = tokenInvertido;

        adicionarAoHistorico(novosTokens);
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });

        despacharUI({
            type: 'SET_FEEDBACK',
            payload: {
                message: tokenInvertido.invertido ? 'Token invertido' : 'Token normal',
                type: 'success'
            }
        });
    };

    return (
        <>
            <GridContainer
                containerRef={containerRef}
                isDragging={estadoUI.ui.isDragging}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {/* Barra lateral: botões de adicionar token e névoa - SÓ MESTRE */}
                <BarraLateral
                    onAbrirModal={isMaster ? () => setModalTokenAberto(true) : undefined}
                    onAbrirModalNevoa={isMaster ? (event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        setMenuNevoaPosicao({ x: rect.right, y: rect.top });
                        setMenuNevoaAberto(true);
                    } : undefined}
                />
                
                {/* Canvas onde tudo é desenhado */}
                <CanvasDesenho canvasRef={canvasRef} />
                
                {/* Modal de adicionar token - SÓ MESTRE */}
                {isMaster && (
                    <TokenModal
                        open={modalTokenAberto}
                        onClose={() => setModalTokenAberto(false)}
                    />
                )}
            </GridContainer>

            {/* Menu de contexto (botão direito) - Todos têm, mas opções variam */}
            <MenuContextoToken
                ref={menuRef}
                aberto={estadoUI.menuContexto.aberto}
                x={estadoUI.menuContexto.x}
                y={estadoUI.menuContexto.y}
                tokenNome={estadoUI.menuContexto.tipo === 'nevoa' ? 'Camada de Névoa' : (estadoUI.menuContexto.token?.nome || 'Token')}
                tokenId={estadoUI.menuContexto.tipo === 'nevoa' ? estadoUI.menuContexto.camadaId : estadoUI.menuContexto.tokenId}
                estaOculto={estadoUI.menuContexto.tipo === 'nevoa' ? false : estadoUI.visibilidadeTokens[estadoUI.menuContexto.tokenId] === true}
                estaBloqueado={
                    estadoUI.menuContexto.tipo === 'nevoa'
                        ? estadoUI.camadasBloqueadas?.[estadoUI.menuContexto.camadaId] === true
                        : estadoUI.tokensBloqueados[estadoUI.menuContexto.tokenId] === true
                }
                tipo={estadoUI.menuContexto.tipo || 'token'}
                onFechar={() => despacharUI({ type: 'CLOSE_CONTEXT_MENU' })}
                // Deletar: todos podem (player também)
                onDeletar={() => {
                    if (estadoUI.menuContexto.tipo === 'nevoa') {
                        if (isMaster) deletarCamada(estadoUI.menuContexto.camadaId);
                    } else {
                        handleDeleteToken(estadoUI.menuContexto.tokenIndice);
                    }
                }}
                // Ocultar: só mestre
                onOcultar={isMaster ? () => handleToggleVisibility(estadoUI.menuContexto.tokenId) : undefined}
                // Bloquear: só mestre
                onBloquear={isMaster ? () => {
                    if (estadoUI.menuContexto.tipo === 'nevoa') {
                        handleToggleCamadaLock(estadoUI.menuContexto.camadaId);
                    } else {
                        handleToggleLock(estadoUI.menuContexto.tokenId);
                    }
                } : undefined}
                // Inverter: todos podem
                onInverter={() => handleInverterToken(estadoUI.menuContexto.tokenId)}
            />

            {/* Modal da névoa (edição) - SÓ MESTRE */}
            {isMaster && (
                <ModalNevoa
                    aberto={menuNevoaAberto}
                    onClose={() => setMenuNevoaAberto(false)}
                    posicao={menuNevoaPosicao}
                    modoDesenho={nevoa.modoDesenho}
                    ativarModoDesenho={nevoa.ativarModoDesenho}
                    desativarModoDesenho={nevoa.desativarModoDesenho}
                    limparTudo={nevoa.limparTudo}
                    desfazer={nevoa.desfazer}
                />
            )}
        </>
    );
}

export default TabletopGrid;