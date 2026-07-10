// src/components/Tabletop/MouseTabletop.jsx
import React, { useCallback, useRef } from "react";
import { calcularPosicoesBolinhas } from './useSelecaoToken';

const MOVE_THRESHOLD = 5;
const THROTTLE_MS = 8; // 125 FPS — minima latencia — evita oscilação de socket

export function useMouseTabletop({
    containerRef,
    dragStartRef,
    resizeStartStateRef,
    isDraggingRef,
    dragInProgressRef,
    resizeInProgressRef,
    teveMovimentoRef,
    isRightClickDragRef,
    rafRef,
    uiState,
    uiStateRef,
    uiDispatch,
    tokensState,
    emitirSelecao,
    emitirDragStart,
    tokensComInfo,
    camadasComInfo,
    converterMouseParaMundo,
    verificarSeMouseSobreToken,
    tokenEstaNaAreaSelecao,
    restringirPosicao,
    processarArrastoToken,
    processarRedimensionamento,
    setStateDirect,
    atualizarToken,
    fov,
    trazerTokenParaFrente,
    socket,
    tabletopId,
    salvarToken,
        emitirTokenMoved,
    emitirDragEnd,
    isMaster,
    iniciarCapturaArrasto,
    finalizarCapturaArrasto
}) {

    const ultimoEmitRef = useRef(0);
    const ultimoEmitCamadaRef = useRef(0);
    const dragStartEmitidoRef = useRef(false);
    const movimentoIniciadoRef = useRef(false);

    const isTokenBloqueado = useCallback((tokenId, token) => {
        if (uiState.tokensBloqueados[tokenId] === true) return true;
        // Player não pode interagir com token dentro da névoa
        if (!isMaster && token && fov?.estaCoberto && fov.estaCoberto(token.x, token.y)) return true;
        return false;
    }, [uiState.tokensBloqueados, isMaster, fov]);

    // Detecção de bolinhas de redimensionamento — acessa tokensComInfo direto pra pegar rotação
    const verificarResizeHandle = useCallback((mouseX, mouseY, tokenTelaX, tokenTelaY, larguraTela, alturaTela, rotacao = 0) => {
        const { posicoes, raioDetecao } = calcularPosicoesBolinhas(tokenTelaX, tokenTelaY, larguraTela, alturaTela, uiState.zoom, rotacao);
        for (const bolinha of posicoes) {
            const dx = mouseX - bolinha.x;
            const dy = mouseY - bolinha.y;
            if (Math.sqrt(dx * dx + dy * dy) <= raioDetecao) return bolinha.nome;
        }
        return null;
    }, [uiState.zoom]);

    const getPosicaoTela = useCallback((token) => ({
        x: (token.x * uiState.zoom) + uiState.position.x,
        y: (token.y * uiState.zoom) + uiState.position.y
    }), [uiState.zoom, uiState.position]);

    const getDimensoesTela = useCallback((token) => {
        const larguraMundo = (token.larguraOriginal || 50) * (token.escala || 1);
        const alturaMundo = (token.alturaOriginal || 50) * (token.escala || 1);
        return {
            largura: larguraMundo * uiState.zoom,
            altura: alturaMundo * uiState.zoom
        };
    }, [uiState.zoom]);

        const iniciarRedimensionamento = useCallback((token, indice, canto, offset, isGroupResize = false, boundingBoxGrupo = null) => {
        const larguraMundo = (token.larguraOriginal || 50) * (token.escala || 1);
        const alturaMundo = (token.alturaOriginal || 50) * (token.escala || 1);

        resizeStartStateRef.current = {
            tokenIndice: indice,
            escalaInicial: token.escala || 1,
            isGroupResize
        };

        uiDispatch({
            type: 'START_RESIZE',
            payload: {
                token,
                indice,
                canto,
                tamanhoInicial: {
                    largura: larguraMundo,
                    altura: alturaMundo,
                    escala: token.escala || 1
                },
                boundingBoxGrupo,
                offset,
                isGroupResize
            }
        });
        
                // Iniciar captura de histórico para redimensionamento de token (não névoa)
        if (isMaster && iniciarCapturaArrasto && (!token.tipo || token.tipo !== 'nevoa')) {
            iniciarCapturaArrasto();
        }
    }, [uiDispatch, resizeStartStateRef, isMaster, iniciarCapturaArrasto]);

    const iniciarArrastoToken = useCallback((tokenInfo, offsetX, offsetY) => {
        uiDispatch({
            type: 'START_TOKEN_DRAG',
            payload: {
                tokenInfo,
                offset: { x: offsetX, y: offsetY }
            }
        });

        isDraggingRef.current = true;
        dragInProgressRef.current = true;
    }, [uiDispatch, isDraggingRef, dragInProgressRef]);

        const finalizarArrasto = useCallback(() => {
        if (dragInProgressRef.current && (uiState.tokenSendoArrastado || uiState.camadaSendoArrastada || uiState.tokensSelecionados.length > 0)) {
            if (uiState.tokenSendoArrastado) {
                const tokenId = uiState.tokenSendoArrastado.token.id;
                const tokenData = tokensState.find((t) => t.id === tokenId);
                if (tokenData) {
                    if (emitirDragEnd) emitirDragEnd(tokenId);
                    if (salvarToken) salvarToken(tokenId, { x: tokenData.x, y: tokenData.y });
                }
            }

            uiDispatch({
                type: 'SET_FEEDBACK',
                payload: {
                    message: uiState.tokensSelecionados.length > 1 ? 'Itens movidos' : 'Item movido',
                    type: 'success',
                },
            });

            if (teveMovimentoRef.current) {
                uiDispatch({ type: 'SELECT_TOKEN', payload: null });
                uiDispatch({ type: 'SELECT_CAMADA', payload: null });
            }

            // Finalizar captura de histórico se houve movimento
            if (teveMovimentoRef.current && isMaster && finalizarCapturaArrasto) {
                finalizarCapturaArrasto();
            }

            dragInProgressRef.current = false;
            teveMovimentoRef.current = false;
        }
    }, [uiState, tokensState, emitirDragEnd, salvarToken, uiDispatch, teveMovimentoRef, dragInProgressRef, isMaster, finalizarCapturaArrasto]);

    const handleMouseDown = useCallback((event) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        if (uiState.ignoreMouseMove) {
            uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }

        if (fov.modoDesenho && event.button === 0) {
            event.preventDefault();
            fov.iniciarDesenho(mouseX, mouseY);
            return;
        }

        // BOTÃO DIREITO
        if (event.button === 2) {
            event.preventDefault();

            // 1. Verificar token primeiro
            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'direito');
            if (tokenSobre) {
                const tokenBloqueado = isTokenBloqueado(tokenSobre.token.id, tokenSobre.token);
                // Guarda info para menu de contexto no mouseup (se nao houver movimento)
                uiDispatch({
                    type: 'SET_MOUSE_DOWN_INFO',
                    payload: {
                        token: tokenSobre,
                        mouseX, mouseY,
                        timestamp: Date.now(),
                        tokenIndice: tokenSobre.indice,
                        isRightClick: true,
                        isBlocked: tokenBloqueado
                    }
                });
                // Botao direito SEMPRE faz pan da viewport, nunca arrasta token.
                // Isso permite navegar sobre tokens e nevoas sem move-los.
                uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: true, isDragging: true } });
                dragStartRef.current = { x: event.clientX - uiState.position.x, y: event.clientY - uiState.position.y };
                isRightClickDragRef.current = true;
                return;
            }

            // 2. Verificar camada (apenas mestre) — permite pan na névoa também
            const { x: mundoX, y: mundoY } = converterMouseParaMundo(mouseX, mouseY);
            const camada = fov.encontrarCamadaNaPosicao(mundoX, mundoY);
            if (camada && isMaster) {
                // Guarda referência da camada para possível menu de contexto no mouseup
                // (se não houver movimento significativo)
                uiDispatch({
                    type: 'SET_MOUSE_DOWN_INFO',
                    payload: {
                        camada,
                        mouseX, mouseY,
                        timestamp: Date.now(),
                        isRightClick: true,
                        isFogClick: true
                    }
                });
                // Inicia pan da viewport (mesmo dentro da névoa)
                uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                dragStartRef.current = { x: event.clientX - uiState.position.x, y: event.clientY - uiState.position.y };
                isRightClickDragRef.current = true;
                return;
            }

            // 3. Área vazia
            uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
            dragStartRef.current = { x: event.clientX - uiState.position.x, y: event.clientY - uiState.position.y };
            isRightClickDragRef.current = true;
            return;
        }

        // BOTÃO ESQUERDO (modo normal, não desenho)
        if (event.button === 0 && !fov.modoDesenho) {
            teveMovimentoRef.current = false;
            dragStartEmitidoRef.current = false;
            movimentoIniciadoRef.current = false;

            // 1. Verificar token primeiro (independente de névoa)
            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'esquerdo');
            if (tokenSobre) {
                // Se o token clicado faz parte de uma seleção múltipla, pula para o handler de grupo
                const fazParteDeGrupo = uiState.tokensSelecionados.length > 1 &&
                    uiState.tokensSelecionados.includes(tokenSobre.indice);
                
                if (!fazParteDeGrupo) {
                const tokenBloqueado = isTokenBloqueado(tokenSobre.token.id, tokenSobre.token);
                if (tokenBloqueado) {
                    uiDispatch({ type: 'SET_FEEDBACK', payload: { message: 'Token bloqueado', type: 'warning' } });
                    event.preventDefault();
                    return;
                }

                const tokenId = tokenSobre.token.id;
                const indiceAtual = tokenSobre.indice;

                const posicao = { x: tokenSobre.telaX, y: tokenSobre.telaY };
                const dimensoes = { largura: tokenSobre.larguraTela, altura: tokenSobre.alturaTela };
                const tokenRotacao = tokensComInfo[tokenSobre.indice]?.rotacao || 0;
                const canto = verificarResizeHandle(mouseX, mouseY, posicao.x, posicao.y, dimensoes.largura, dimensoes.altura, tokenRotacao);

                if (canto) {
                    iniciarRedimensionamento(tokenSobre.token, indiceAtual, canto, { x: mouseX - posicao.x, y: mouseY - posicao.y });
                    event.preventDefault();
                    return;
                }

                uiDispatch({ type: 'SELECT_TOKEN', payload: indiceAtual });

                if (emitirSelecao && !dragInProgressRef.current && !resizeInProgressRef.current) {
                    emitirSelecao(tokenId);
                }

                                iniciarArrastoToken(
                    { token: tokenSobre.token, indice: indiceAtual, telaX: tokenSobre.telaX, telaY: tokenSobre.telaY, isGroupDrag: false },
                    mouseX - tokenSobre.telaX,
                    mouseY - tokenSobre.telaY
                );

                // IMPORTANTE: trazerTokenParaFrente DEPOIS de SELECT_TOKEN e iniciarArrastoToken
                if (trazerTokenParaFrente) {
                    trazerTokenParaFrente(tokenId);
                }
                
                if (isMaster && iniciarCapturaArrasto) {
                    iniciarCapturaArrasto();
                }
                event.preventDefault();
                return;
                } // fim if (!fazParteDeGrupo)
                // Se fazParteDeGrupo, cai direto no handler de grupo (step 3)
            }

            // 2. Verificar camada (apenas mestre) — pula se já encontramos token no grupo
            if (!tokenSobre) {
            const { x: mundoX, y: mundoY } = converterMouseParaMundo(mouseX, mouseY);
            const camadaEncontrada = fov.encontrarCamadaNaPosicao(mundoX, mundoY);
            if (camadaEncontrada && isMaster) {
                const itemComInfo = camadasComInfo.find(c => c.id === camadaEncontrada.id);
                if (!itemComInfo) return;

                // Verificar se a camada esta bloqueada
                if (uiState.camadasBloqueadas?.[camadaEncontrada.id]) {
                    uiDispatch({ type: 'SELECT_CAMADA', payload: itemComInfo.indice });
                    uiDispatch({ type: 'SET_FEEDBACK', payload: { message: 'Camada bloqueada', type: 'warning' } });
                    event.preventDefault();
                    return;
                }

                const indiceCamada = itemComInfo.indice;
                const itemClicado = { ...camadaEncontrada, indice: indiceCamada, tipo: 'nevoa', nome: 'Névoa' };

                const canto = verificarResizeHandle(
                    mouseX, mouseY,
                    itemComInfo.posicaoTela.x, itemComInfo.posicaoTela.y,
                    itemComInfo.tamanhoTela.larguraTela, itemComInfo.tamanhoTela.alturaTela,
                    0 // camadas de névoa não têm rotação
                );

                if (canto) {
                    iniciarRedimensionamento(itemClicado, indiceCamada, canto, {
                        x: mouseX - itemComInfo.posicaoTela.x,
                        y: mouseY - itemComInfo.posicaoTela.y
                    });
                    event.preventDefault();
                    return;
                }

                uiDispatch({ type: 'SELECT_CAMADA', payload: indiceCamada });
                uiDispatch({
                    type: 'START_DRAG',
                    payload: {
                        tipo: 'nevoa',
                        item: itemClicado,
                        indice: indiceCamada,
                        offset: {
                            offsetX: mouseX - itemComInfo.posicaoTela.x,
                            offsetY: mouseY - itemComInfo.posicaoTela.y,
                            telaX: itemComInfo.posicaoTela.x,
                            telaY: itemComInfo.posicaoTela.y,
                            mouseX, mouseY
                        }
                    }
                });
                isDraggingRef.current = true;
                dragInProgressRef.current = true;
                event.preventDefault();
                return;
            }
            } // fim if (!tokenSobre) — pula camada quando token já encontrado no grupo

            // 3. Lógica para múltiplos tokens selecionados (arrasto/redimensionamento de grupo)
            if (uiState.tokensSelecionados.length > 1) {
                const tokensSelecionadosInfo = uiState.tokensSelecionados
                    .map(indice => tokensComInfo[indice])
                    .filter(token => token && !token.bloqueado);

                const anyBlocked = uiState.tokensSelecionados.some(indice => {
                    const token = tokensState[indice];
                    return token && isTokenBloqueado(token.id, token);
                });

                if (anyBlocked) {
                    uiDispatch({ type: 'SET_FEEDBACK', payload: { message: 'Grupo contém token bloqueado', type: 'warning' } });
                    event.preventDefault();
                    return;
                }

                if (tokensSelecionadosInfo.length > 0) {
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    tokensSelecionadosInfo.forEach(token => {
                        minX = Math.min(minX, token.posicaoTela.x);
                        minY = Math.min(minY, token.posicaoTela.y);
                        maxX = Math.max(maxX, token.posicaoTela.x + token.tamanhoTela.larguraTela);
                        maxY = Math.max(maxY, token.posicaoTela.y + token.tamanhoTela.alturaTela);
                    });

                    const tokenClicadoDoGrupo = tokensSelecionadosInfo.find(token =>
                        mouseX >= token.posicaoTela.x && mouseX <= token.posicaoTela.x + token.tamanhoTela.larguraTela &&
                        mouseY >= token.posicaoTela.y && mouseY <= token.posicaoTela.y + token.tamanhoTela.alturaTela
                    );

                    if (tokenClicadoDoGrupo) {
                        const primeiroTokenGrupo = tokensSelecionadosInfo[0];
                                                iniciarArrastoToken(
                            { token: primeiroTokenGrupo, indice: primeiroTokenGrupo.indice, telaX: primeiroTokenGrupo.posicaoTela.x, telaY: primeiroTokenGrupo.posicaoTela.y, isGroupDrag: true },
                            mouseX - primeiroTokenGrupo.posicaoTela.x,
                            mouseY - primeiroTokenGrupo.posicaoTela.y
                        );
                        
                        if (isMaster && iniciarCapturaArrasto) {
                            iniciarCapturaArrasto();
                        }
                        event.preventDefault();
                        return;
                    }

                    const padding = 16;
                    const areaBorda = { x: minX - padding, y: minY - padding, width: (maxX - minX) + (padding * 2), height: (maxY - minY) + (padding * 2) };
                    const mouseNaBorda = mouseX >= areaBorda.x && mouseX <= areaBorda.x + areaBorda.width && mouseY >= areaBorda.y && mouseY <= areaBorda.y + areaBorda.height;

                    if (mouseNaBorda) {
                        let minXMundo = Infinity, minYMundo = Infinity, maxXMundo = -Infinity, maxYMundo = -Infinity;
                        tokensSelecionadosInfo.forEach(token => {
                            minXMundo = Math.min(minXMundo, token.x);
                            minYMundo = Math.min(minYMundo, token.y);
                            maxXMundo = Math.max(maxXMundo, token.x + (token.larguraOriginal * token.escala));
                            maxYMundo = Math.max(maxYMundo, token.y + (token.alturaOriginal * token.escala));
                        });

                        const primeiroToken = tokensSelecionadosInfo[0];
                        const boundingBoxMundo = { x: minXMundo, y: minYMundo, largura: maxXMundo - minXMundo, altura: maxYMundo - minYMundo, larguraBase: maxXMundo - minXMundo, alturaBase: maxYMundo - minYMundo };

                        iniciarRedimensionamento(
                            primeiroToken,
                            primeiroToken.indice,
                            'se',
                            { x: mouseX - minX, y: mouseY - minY },
                            true,
                            boundingBoxMundo
                        );
                        event.preventDefault();
                        return;
                    }
                }
            }

            // 4. Token já selecionado individualmente (possível redimensionamento)
            if (uiState.tokenSelecionado !== null) {
                const token = tokensState[uiState.tokenSelecionado];
                if (token && !isTokenBloqueado(token.id, token)) {
                    const posicao = getPosicaoTela(token);
                    const dimensoes = getDimensoesTela(token);
                    const tokenRotacao = tokensComInfo[uiState.tokenSelecionado]?.rotacao || 0;
                    const canto = verificarResizeHandle(mouseX, mouseY, posicao.x, posicao.y, dimensoes.largura, dimensoes.altura, tokenRotacao);
                    if (canto) {
                        iniciarRedimensionamento(token, uiState.tokenSelecionado, canto, { x: mouseX - posicao.x, y: mouseY - posicao.y });
                        event.preventDefault();
                        return;
                    }
                }
            }

            // 5. Área vazia (inicia área de seleção)
            uiDispatch({
                type: 'SET_MOUSE_DOWN_INFO',
                payload: { mouseX, mouseY, timestamp: Date.now(), isLeftClick: true, isBlankArea: true }
            });
            event.preventDefault();
        }
    }, [uiState, tokensState, tokensComInfo, camadasComInfo, containerRef, converterMouseParaMundo, verificarSeMouseSobreToken,
        verificarResizeHandle, fov, uiDispatch, isTokenBloqueado, getPosicaoTela, getDimensoesTela, iniciarRedimensionamento,
        iniciarArrastoToken, emitirSelecao, dragInProgressRef, resizeInProgressRef, trazerTokenParaFrente, teveMovimentoRef,
        dragStartRef, isRightClickDragRef, isDraggingRef, isMaster]);

    const handleMouseMove = useCallback((event) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            if (uiState.ignoreMouseMove) return;

            if (fov.modoDesenho && fov.desenhando) {
                fov.atualizarDesenho(mouseX, mouseY);
                event.preventDefault();
                return;
            }

            if (uiState.mouseDownInfo?.isBlankArea && !uiState.ui.isSelectingArea && !uiState.ui.isDragging) {
                uiDispatch({ type: 'START_AREA_SELECTION', payload: { x: uiState.mouseDownInfo.mouseX, y: uiState.mouseDownInfo.mouseY } });
            }

            if (uiState.ui.isClickingToken && uiState.mouseDownInfo && uiState.mouseDownInfo.isBlocked && !uiState.ui.isDragging && !uiState.ui.isSelectingArea) {
                const dx = mouseX - uiState.mouseDownInfo.mouseX;
                const dy = mouseY - uiState.mouseDownInfo.mouseY;
                const distancia = Math.sqrt(dx * dx + dy * dy);
                if (distancia > MOVE_THRESHOLD) {
                    uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                    dragStartRef.current = { x: event.clientX - uiState.position.x, y: event.clientY - uiState.position.y };
                    isRightClickDragRef.current = true;
                    uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: false } });
                    uiDispatch({ type: 'SET_MOUSE_DOWN_INFO', payload: null });
                }
            }

            if (uiState.ui.isSelectingArea) {
                uiDispatch({ type: 'UPDATE_AREA_SELECTION', payload: { x: mouseX, y: mouseY } });
                const tokensNaArea = [];
                for (let i = 0; i < tokensComInfo.length; i++) {
                    const token = tokensComInfo[i];
                    const escondidoNevoa = !isMaster && fov?.estaCoberto && fov.estaCoberto(token.x, token.y);
                    if (!token.bloqueado && !escondidoNevoa && tokenEstaNaAreaSelecao(token, uiState.areaSelecao)) {
                        tokensNaArea.push(i);
                    }
                }
                uiDispatch({ type: 'SELECT_MULTIPLE_TOKENS', payload: tokensNaArea });
                event.preventDefault();
                return;
            }

            // Usa uiStateRef para zoom/position atualizados em tempo real.
            // Evita stale closure que causava teleporte do token/viewport.
            const s = uiStateRef?.current ?? uiState;

            if (uiState.tokenSendoArrastado || uiState.camadaSendoArrastada) {
                const isNevoa = !!uiState.camadaSendoArrastada;
                const itemInfo = isNevoa ? uiState.camadaSendoArrastada : uiState.tokenSendoArrastado;

                if (isNevoa && !isMaster) {
                    event.preventDefault();
                    return;
                }

                teveMovimentoRef.current = true;

                if (!movimentoIniciadoRef.current && !isNevoa) {
                    movimentoIniciadoRef.current = true;
                    if (emitirDragStart && itemInfo.token?.id) {
                        emitirDragStart(itemInfo.token.id);
                    }
                }

                const arrayAtual = isNevoa ? fov.camadasNevoa : tokensState;
                const novosTokens = processarArrastoToken(
                    mouseX, mouseY, itemInfo, uiState.offsetArrasto, arrayAtual,
                    s.zoom, s.position, itemInfo.isGroupDrag || false,
                    itemInfo.isGroupDrag ? uiState.tokensSelecionados : []
                );

                if (isNevoa && fov.setCamadasNevoa) {
                    fov.setCamadasNevoa(novosTokens);
                } else if (!isNevoa && setStateDirect) {
                    setStateDirect(novosTokens);
                }

                if (!isNevoa) {
                    const agora = Date.now();
                    const timeSinceLastEmit = agora - ultimoEmitRef.current;
                    const emitir = timeSinceLastEmit >= THROTTLE_MS;

                    if (emitir && emitirTokenMoved) {
                        ultimoEmitRef.current = agora;

                        if (itemInfo.isGroupDrag && uiState.tokensSelecionados.length > 1) {
                            // Batch: 1 evento com todas as posições do grupo
                            const posicoes = [];
                            uiState.tokensSelecionados.forEach((idx) => {
                                const token = novosTokens[idx];
                                if (token) {
                                    posicoes.push({ id: token.id, x: token.x, y: token.y });
                                }
                            });
                            if (posicoes.length > 0 && socket?.connected) {
                                socket.emit('tabletop:tokensMoved', { tabletopId, tokens: posicoes, userId: socket.id });
                            }
                        } else {
                            const tokenMovido = novosTokens[itemInfo.indice];
                            if (tokenMovido && (tokenMovido.x !== itemInfo.token?.x || tokenMovido.y !== itemInfo.token?.y)) {
                                emitirTokenMoved(tokenMovido.id, { x: tokenMovido.x, y: tokenMovido.y });
                            }
                        }
                    }
                } else {
                    const camadaMovida = novosTokens[itemInfo.indice];
                    if (camadaMovida && (camadaMovida.x !== itemInfo.camada?.x || camadaMovida.y !== itemInfo.camada?.y)) {
                        const agora = Date.now();
                        const timeSinceLastEmit = agora - ultimoEmitCamadaRef.current;
                        const emitir = timeSinceLastEmit >= THROTTLE_MS;
                        if (emitir) {
                            ultimoEmitCamadaRef.current = agora;
                            if (socket?.connected) {
                                socket.emit('tabletop:nevoaMoved', {
                                    tabletopId,
                                    id: camadaMovida.id,
                                    x: camadaMovida.x,
                                    y: camadaMovida.y
                                });
                            }
                        }
                    }
                }

                event.preventDefault();
                return;
            }

            if ((uiState.tokenRedimensionando || uiState.camadaRedimensionando) && uiState.modoRedimensionamento) {
                const isNevoa = !!uiState.camadaRedimensionando;
                const itemInfo = isNevoa ? uiState.camadaRedimensionando : uiState.tokenRedimensionando;
                const indicesGrupo = itemInfo.isGroupResize ? uiState.tokensSelecionados : [];

                if (isNevoa && !isMaster) {
                    event.preventDefault();
                    return;
                }

                if (itemInfo.isGroupResize && indicesGrupo.length > 0) {
                    const anyBlocked = indicesGrupo.some(indice => {
                        const token = tokensState[indice];
                        return token && isTokenBloqueado(token.id, token);
                    });
                    if (anyBlocked) {
                        uiDispatch({ type: 'SET_FEEDBACK', payload: { message: 'Grupo contém token bloqueado', type: 'warning' } });
                        event.preventDefault();
                        return;
                    }
                }

                if (!movimentoIniciadoRef.current && !isNevoa) {
                    movimentoIniciadoRef.current = true;
                    if (emitirDragStart && itemInfo.token?.id) {
                        emitirDragStart(itemInfo.token.id);
                    }
                }

                                const arrayAtual = isNevoa ? fov.camadasNevoa : tokensState;
                const tokenRotacao = !isNevoa ? (tokensComInfo[itemInfo.indice]?.rotacao || 0) : 0;
                const novosTokens = processarRedimensionamento(
                    mouseX, mouseY, itemInfo, uiState.modoRedimensionamento,
                    uiState.tamanhoInicialRedimensionamento, uiState.boundingBoxGrupo,
                    arrayAtual, s.zoom, s.position,
                    itemInfo.isGroupResize || false, indicesGrupo, tokenRotacao
                );

                if (!resizeInProgressRef.current) {
                    resizeInProgressRef.current = true;
                }

                if (isNevoa && fov.setCamadasNevoa) {
                    console.log('[MouseTabletop] Atualizando camadas de névoa durante redimensionamento, total:', novosTokens.length, 'escala da camada:', novosTokens[itemInfo.indice]?.escala);
                    fov.setCamadasNevoa(novosTokens);
                } else if (!isNevoa && setStateDirect) {
                    setStateDirect(novosTokens);
                }

                // O emit do socket para tokens é feito pelo useRedimensionamentoToken
                // (já inclui escala, x, y com throttle de 30fps). Não emitir aqui evita duplicação.
                // Apenas névoa (camadas) emite aqui pois não passa por useRedimensionamentoToken.

                                if (isNevoa) {
                    // Emitir evento de atualização para névoa redimensionada
                    const camadaRedimensionada = novosTokens[itemInfo.indice];
                                        if (camadaRedimensionada && socket?.connected && isMaster) {
                        const agora = Date.now();
                        const timeSinceLastEmit = agora - ultimoEmitCamadaRef.current;
                        const emitir = timeSinceLastEmit >= THROTTLE_MS;
                        if (emitir) {
                            ultimoEmitCamadaRef.current = agora;
                            console.log('[MouseTabletop] Emitindo nevoaUpdated durante redimensionamento:', camadaRedimensionada.id, 'escala:', camadaRedimensionada.escala);
                            socket.emit('tabletop:nevoaUpdated', {
                                tabletopId,
                                id: camadaRedimensionada.id,
                                escala: camadaRedimensionada.escala,
                                x: camadaRedimensionada.x,
                                y: camadaRedimensionada.y,
                                larguraOriginal: camadaRedimensionada.larguraOriginal,
                                alturaOriginal: camadaRedimensionada.alturaOriginal
                            });
                        }
                    }
                }
                event.preventDefault();
                return;
            }

            if (uiState.ui.isDragging) {
                teveMovimentoRef.current = true;
                const constrained = restringirPosicao(event.clientX - dragStartRef.current.x, event.clientY - dragStartRef.current.y);
                uiDispatch({ type: 'SET_POSITION', payload: constrained });
                event.preventDefault();
                return;
            }
        });
    }, [uiState, tokensState, tokensComInfo, tokenEstaNaAreaSelecao, restringirPosicao,
        processarArrastoToken, processarRedimensionamento, setStateDirect, socket, tabletopId, uiDispatch, fov, emitirDragStart,
        isTokenBloqueado, teveMovimentoRef, dragStartRef, isRightClickDragRef, rafRef, containerRef, emitirTokenMoved, isMaster]);

    const handleMouseUp = useCallback((event) => {
        const container = containerRef.current;
        if (!container) return;

        if (fov.modoDesenho && fov.desenhando) {
            fov.finalizarDesenho();
        }

        if (event.button === 2) {
            // Clique direito em token SEM movimento → menu de contexto
            if (uiState.mouseDownInfo && uiState.ui.isClickingToken && !teveMovimentoRef.current) {
                const tokenSobre = uiState.mouseDownInfo.token;
                uiDispatch({ type: 'SELECT_TOKEN', payload: tokenSobre.indice });
                uiDispatch({
                    type: 'OPEN_CONTEXT_MENU',
                    payload: {
                        aberto: true,
                        x: event.clientX,
                        y: event.clientY,
                        tokenIndice: tokenSobre.indice,
                        tokenId: tokenSobre.token.id,
                        token: tokenSobre.token
                    }
                });
            }

            // Clique direito na névoa sem arrastar → menu de contexto da névoa
            if (uiState.mouseDownInfo?.isFogClick && !teveMovimentoRef.current) {
                const camada = uiState.mouseDownInfo.camada;
                uiDispatch({
                    type: 'OPEN_CONTEXT_MENU',
                    payload: {
                        aberto: true,
                        x: event.clientX,
                        y: event.clientY,
                        tipo: 'nevoa',
                        camadaId: camada.id,
                        camada
                    }
                });
                // Cancela o estado de pan que foi iniciado no mousedown
                uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: false } });
            }

            isRightClickDragRef.current = false;
        }

        if (event.button === 0) {
            if (uiState.mouseDownInfo?.isBlankArea && !uiState.ui.isSelectingArea) {
                uiDispatch({ type: 'SELECT_TOKEN', payload: null });
                uiDispatch({ type: 'SELECT_CAMADA', payload: null });
            }

            if (uiState.ui.isSelectingArea) {
                uiDispatch({ type: 'END_AREA_SELECTION' });
                if (uiState.tokensSelecionados.length === 0) {
                    uiDispatch({ type: 'SELECT_TOKEN', payload: null });
                }
            }

            if (isDraggingRef.current || dragInProgressRef.current) {
                if (teveMovimentoRef.current) {
                    finalizarArrasto();
                    if (uiState.camadaSendoArrastada && isMaster) {
                        const camadaId = uiState.camadaSendoArrastada.camada.id;
                        const camadaData = fov.camadasNevoa.find(c => c.id === camadaId);
                        if (camadaData) {
                            fov.atualizarPosicaoCamada(camadaId, camadaData.x, camadaData.y);
                        }
                    }
                }
                isDraggingRef.current = false;
            }

                        if (resizeInProgressRef.current || uiState.tokenRedimensionando || uiState.camadaRedimensionando) {
                if (uiState.tokenRedimensionando) {
                    const tokenId = uiState.tokenRedimensionando.token.id;
                    const tokenData = tokensState.find((t) => t.id === tokenId);
                    if (tokenData && salvarToken) {
                        salvarToken(tokenId, {
                            escala: tokenData.escala,
                            x: tokenData.x,
                            y: tokenData.y,
                        });
                    }
                }
                                if (uiState.camadaRedimensionando && isMaster) {
                    const camadaId = uiState.camadaRedimensionando.camada.id;
                    const camadaData = fov.camadasNevoa.find(c => c.id === camadaId);
                    if (camadaData) {
                                console.log('[MouseTabletop] Finalizando redimensionamento de névoa, atualizando escala:', camadaData.escala);
                                fov.atualizarEscalaCamada(camadaId, camadaData.escala);
                    }
                }
                
                // Finalizar captura de histórico para redimensionamento de token
                if (uiState.tokenRedimensionando && isMaster && finalizarCapturaArrasto) {
                    finalizarCapturaArrasto();
                }
                
                resizeInProgressRef.current = false;
                if (resizeStartStateRef.current) {
                    resizeStartStateRef.current = null;
                }
            }
        }

        dragStartEmitidoRef.current = false;
        movimentoIniciadoRef.current = false;

        if (uiState.tokenRedimensionando || uiState.camadaRedimensionando) {
            uiDispatch({ type: 'STOP_RESIZE' });
        }
        if (uiState.ui.isDragging) {
            uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: false } });
        }
        if (uiState.tokenSendoArrastado || uiState.camadaSendoArrastada) {
            uiDispatch({ type: 'STOP_DRAG' });
        }

        uiDispatch({ type: 'SET_MOUSE_DOWN_INFO', payload: null });
        uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: false } });

        dragInProgressRef.current = false;
        resizeInProgressRef.current = false;
        teveMovimentoRef.current = false;
    }, [uiState, tokensState, finalizarArrasto, uiDispatch, fov, isDraggingRef, dragInProgressRef,
        resizeInProgressRef, teveMovimentoRef, salvarToken, resizeStartStateRef, isMaster]);

    return { handleMouseDown, handleMouseMove, handleMouseUp };
}