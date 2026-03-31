// src/components/Tabletop/MouseTabletop.jsx
import React, { useCallback, useRef } from "react";

const MOVE_THRESHOLD = 5;
const THROTTLE_MS = 16;

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
    uiDispatch,
    tokensState,
    emitirSelecao,
    emitirDragStart,
    tokensComInfo,
    camadasComInfo,
    converterMouseParaMundo,
    verificarSeMouseSobreToken,
    verificarSeMousePodeRedimensionar,
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
    isMaster
}) {

    const ultimoEmitRef = useRef(0);
    const ultimoEmitCamadaRef = useRef(0);
    const dragStartEmitidoRef = useRef(false);
    const movimentoIniciadoRef = useRef(false);

    console.log('[MouseTabletop] Hook inicializado, THROTTLE_MS:', THROTTLE_MS, 'socket conectado:', socket?.connected);

    const isTokenBloqueado = useCallback((tokenId) => {
        const bloqueado = uiState.tokensBloqueados[tokenId] === true;
        return bloqueado;
    }, [uiState.tokensBloqueados]);

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
        console.log('[MouseTabletop] iniciarRedimensionamento - token:', token.id, 'canto:', canto);
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
    }, [uiDispatch, resizeStartStateRef]);

    const iniciarArrastoToken = useCallback((tokenInfo, offsetX, offsetY) => {
        console.log('[MouseTabletop] iniciarArrastoToken - token:', tokenInfo.token.id);
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
        console.log('[MouseTabletop] finalizarArrasto - dragInProgress:', dragInProgressRef.current);
        if (dragInProgressRef.current && (uiState.tokenSendoArrastado || uiState.camadaSendoArrastada || uiState.tokensSelecionados.length > 0)) {
            if (uiState.tokenSendoArrastado) {
                const tokenId = uiState.tokenSendoArrastado.token.id;
                const tokenData = tokensState.find((t) => t.id === tokenId);
                if (tokenData) {
                    console.log('[MouseTabletop] finalizarArrasto - salvando token:', tokenId);
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

            dragInProgressRef.current = false;
            teveMovimentoRef.current = false;
        }
    }, [uiState, tokensState, emitirDragEnd, salvarToken, uiDispatch, teveMovimentoRef, dragInProgressRef]);

    const handleMouseDown = useCallback((event) => {
        console.log('[MouseTabletop] handleMouseDown - button:', event.button, 'clientX:', event.clientX, 'clientY:', event.clientY);
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        console.log('[MouseTabletop] mouseX:', mouseX, 'mouseY:', mouseY);

        if (uiState.ignoreMouseMove) {
            uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }

        if (fov.modoDesenho && event.button === 0) {
            console.log('[MouseTabletop] modo desenho ativo, iniciando desenho');
            event.preventDefault();
            fov.iniciarDesenho(mouseX, mouseY);
            return;
        }

        // BOTÃO DIREITO
        if (event.button === 2) {
            console.log('[MouseTabletop] BOTÃO DIREITO');
            event.preventDefault();

            // 1. Verificar token primeiro
            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'direito');
            console.log('[MouseTabletop] tokenSobre (botão direito):', tokenSobre ? tokenSobre.token.id : 'nenhum');
            if (tokenSobre) {
                const tokenBloqueado = isTokenBloqueado(tokenSobre.token.id);
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
                if (!tokenBloqueado) {
                    uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: true } });
                    const posicao = { x: tokenSobre.telaX, y: tokenSobre.telaY };
                    iniciarArrastoToken(
                        { token: tokenSobre.token, indice: tokenSobre.indice, telaX: posicao.x, telaY: posicao.y, isGroupDrag: false },
                        mouseX - posicao.x,
                        mouseY - posicao.y
                    );
                } else {
                    uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: true } });
                    isRightClickDragRef.current = false;
                }
                return;
            }

            // 2. Verificar camada (apenas mestre)
            const { x: mundoX, y: mundoY } = converterMouseParaMundo(mouseX, mouseY);
            const camada = fov.encontrarCamadaNaPosicao(mundoX, mundoY);
            if (camada && isMaster) {
                console.log('[MouseTabletop] abrindo menu de contexto para camada:', camada.id);
                uiDispatch({
                    type: 'OPEN_CONTEXT_MENU',
                    payload: { aberto: true, x: event.clientX, y: event.clientY, tipo: 'nevoa', camadaId: camada.id, camada }
                });
                return;
            }

            // 3. Área vazia
            console.log('[MouseTabletop] iniciando arrasto de mapa (botão direito)');
            uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
            dragStartRef.current = { x: event.clientX - uiState.position.x, y: event.clientY - uiState.position.y };
            isRightClickDragRef.current = true;
            return;
        }

        // BOTÃO ESQUERDO (modo normal, não desenho)
        if (event.button === 0 && !fov.modoDesenho) {
            console.log('[MouseTabletop] BOTÃO ESQUERDO');
            teveMovimentoRef.current = false;
            dragStartEmitidoRef.current = false;
            movimentoIniciadoRef.current = false;

            // 1. Verificar token primeiro (independente de névoa)
            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'esquerdo');
            console.log('[MouseTabletop] tokenSobre (botão esquerdo):', tokenSobre ? tokenSobre.token.id : 'nenhum');
            if (tokenSobre) {
                const tokenBloqueado = isTokenBloqueado(tokenSobre.token.id);
                if (tokenBloqueado) {
                    console.log('[MouseTabletop] token bloqueado, ignorando');
                    uiDispatch({ type: 'SET_FEEDBACK', payload: { message: 'Token bloqueado', type: 'warning' } });
                    event.preventDefault();
                    return;
                }

                const tokenId = tokenSobre.token.id;
                const indiceAtual = tokenSobre.indice;

                if (trazerTokenParaFrente) {
                    console.log('[MouseTabletop] trazendo token para frente:', tokenId);
                    trazerTokenParaFrente(tokenId);
                }

                const posicao = { x: tokenSobre.telaX, y: tokenSobre.telaY };
                const dimensoes = { largura: tokenSobre.larguraTela, altura: tokenSobre.alturaTela };
                const canto = verificarSeMousePodeRedimensionar(mouseX, mouseY, posicao.x, posicao.y, dimensoes.largura, dimensoes.altura, false);

                if (canto) {
                    console.log('[MouseTabletop] iniciando redimensionamento (canto:', canto, ')');
                    iniciarRedimensionamento(tokenSobre.token, indiceAtual, canto, { x: mouseX - posicao.x, y: mouseY - posicao.y });
                    event.preventDefault();
                    return;
                }

                uiDispatch({ type: 'SELECT_TOKEN', payload: indiceAtual });

                if (emitirSelecao && !dragInProgressRef.current && !resizeInProgressRef.current) {
                    console.log('[MouseTabletop] emitindo seleção do token:', tokenId);
                    emitirSelecao(tokenId);
                }

                console.log('[MouseTabletop] iniciando arrasto do token:', tokenId);
                iniciarArrastoToken(
                    { token: tokenSobre.token, indice: indiceAtual, telaX: tokenSobre.telaX, telaY: tokenSobre.telaY, isGroupDrag: false },
                    mouseX - tokenSobre.telaX,
                    mouseY - tokenSobre.telaY
                );
                event.preventDefault();
                return;
            }

            // 2. Verificar camada (apenas mestre)
            const { x: mundoX, y: mundoY } = converterMouseParaMundo(mouseX, mouseY);
            const camadaEncontrada = fov.encontrarCamadaNaPosicao(mundoX, mundoY);
            if (camadaEncontrada && isMaster) {
                console.log('[MouseTabletop] camada encontrada:', camadaEncontrada.id);
                const itemComInfo = camadasComInfo.find(c => c.id === camadaEncontrada.id);
                if (!itemComInfo) return;

                const indiceCamada = itemComInfo.indice;
                const itemClicado = { ...camadaEncontrada, indice: indiceCamada, tipo: 'nevoa', nome: 'Névoa' };

                const canto = verificarSeMousePodeRedimensionar(
                    mouseX, mouseY,
                    itemComInfo.posicaoTela.x, itemComInfo.posicaoTela.y,
                    itemComInfo.tamanhoTela.larguraTela, itemComInfo.tamanhoTela.alturaTela,
                    false
                );

                if (canto) {
                    console.log('[MouseTabletop] redimensionando camada');
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

            // 3. Lógica para múltiplos tokens selecionados (arrasto/redimensionamento de grupo)
            if (uiState.tokensSelecionados.length > 1) {
                console.log('[MouseTabletop] múltiplos tokens selecionados:', uiState.tokensSelecionados.length);
                const tokensSelecionadosInfo = uiState.tokensSelecionados
                    .map(indice => tokensComInfo[indice])
                    .filter(token => token && !token.bloqueado);

                const anyBlocked = uiState.tokensSelecionados.some(indice => {
                    const token = tokensState[indice];
                    return token && isTokenBloqueado(token.id);
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
                        console.log('[MouseTabletop] arrastando grupo');
                        const primeiroTokenGrupo = tokensSelecionadosInfo[0];
                        iniciarArrastoToken(
                            { token: primeiroTokenGrupo, indice: primeiroTokenGrupo.indice, telaX: primeiroTokenGrupo.posicaoTela.x, telaY: primeiroTokenGrupo.posicaoTela.y, isGroupDrag: true },
                            mouseX - primeiroTokenGrupo.posicaoTela.x,
                            mouseY - primeiroTokenGrupo.posicaoTela.y
                        );
                        event.preventDefault();
                        return;
                    }

                    const padding = 16;
                    const areaBorda = { x: minX - padding, y: minY - padding, width: (maxX - minX) + (padding * 2), height: (maxY - minY) + (padding * 2) };
                    const mouseNaBorda = mouseX >= areaBorda.x && mouseX <= areaBorda.x + areaBorda.width && mouseY >= areaBorda.y && mouseY <= areaBorda.y + areaBorda.height;

                    if (mouseNaBorda) {
                        console.log('[MouseTabletop] redimensionando grupo');
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
                console.log('[MouseTabletop] token já selecionado:', uiState.tokenSelecionado);
                const token = tokensState[uiState.tokenSelecionado];
                if (token && !isTokenBloqueado(token.id)) {
                    const posicao = getPosicaoTela(token);
                    const dimensoes = getDimensoesTela(token);
                    const canto = verificarSeMousePodeRedimensionar(mouseX, mouseY, posicao.x, posicao.y, dimensoes.largura, dimensoes.altura, false);
                    if (canto) {
                        console.log('[MouseTabletop] redimensionando token selecionado');
                        iniciarRedimensionamento(token, uiState.tokenSelecionado, canto, { x: mouseX - posicao.x, y: mouseY - posicao.y });
                        event.preventDefault();
                        return;
                    }
                }
            }

            // 5. Área vazia (inicia área de seleção)
            console.log('[MouseTabletop] iniciando área de seleção');
            uiDispatch({
                type: 'SET_MOUSE_DOWN_INFO',
                payload: { mouseX, mouseY, timestamp: Date.now(), isLeftClick: true, isBlankArea: true }
            });
            event.preventDefault();
        }
    }, [uiState, tokensState, tokensComInfo, camadasComInfo, containerRef, converterMouseParaMundo, verificarSeMouseSobreToken,
        verificarSeMousePodeRedimensionar, fov, uiDispatch, isTokenBloqueado, getPosicaoTela, getDimensoesTela, iniciarRedimensionamento,
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
                    if (!token.bloqueado && tokenEstaNaAreaSelecao(token, uiState.areaSelecao)) {
                        tokensNaArea.push(i);
                    }
                }
                uiDispatch({ type: 'SELECT_MULTIPLE_TOKENS', payload: tokensNaArea });
                event.preventDefault();
                return;
            }

            const emitirMovimentoToken = (token, id, x, y, escala) => {
                if (!socket?.connected) return;
                const agora = Date.now();
                const timeSinceLastEmit = agora - ultimoEmitRef.current;
                const emitir = timeSinceLastEmit >= THROTTLE_MS;
                if (emitir) {
                    ultimoEmitRef.current = agora;
                    if (emitirTokenMoved) {
                        emitirTokenMoved(id, { x, y });
                    }
                }
                console.log('[MouseTabletop] emitirMovimentoToken - token:', id, 'diff:', timeSinceLastEmit, 'ms, emitindo:', emitir);
            };

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
                    uiState.zoom, uiState.position, itemInfo.isGroupDrag || false,
                    itemInfo.isGroupDrag ? uiState.tokensSelecionados : []
                );

                if (isNevoa && fov.setCamadasNevoa) {
                    fov.setCamadasNevoa(novosTokens);
                } else if (!isNevoa && setStateDirect) {
                    setStateDirect(novosTokens);
                }

                if (!isNevoa) {
                    const tokenMovido = novosTokens[itemInfo.indice];
                    if (tokenMovido && (tokenMovido.x !== itemInfo.token?.x || tokenMovido.y !== itemInfo.token?.y)) {
                        const agora = Date.now();
                        const timeSinceLastEmit = agora - ultimoEmitRef.current;
                        const emitir = timeSinceLastEmit >= THROTTLE_MS;
                        if (emitir) {
                            ultimoEmitRef.current = agora;
                            if (emitirTokenMoved) {
                                emitirTokenMoved(tokenMovido.id, { x: tokenMovido.x, y: tokenMovido.y });
                            }
                        }
                        console.log('[MouseTabletop] Movimento token - diff:', timeSinceLastEmit, 'ms, emitindo:', emitir);
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
                        console.log('[MouseTabletop] Movimento camada - diff:', timeSinceLastEmit, 'ms, emitindo:', emitir);
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
                        return token && isTokenBloqueado(token.id);
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
                const novosTokens = processarRedimensionamento(
                    mouseX, mouseY, itemInfo, uiState.modoRedimensionamento,
                    uiState.tamanhoInicialRedimensionamento, uiState.boundingBoxGrupo,
                    arrayAtual, uiState.zoom, uiState.position,
                    itemInfo.isGroupResize || false, indicesGrupo
                );

                if (!resizeInProgressRef.current) {
                    resizeInProgressRef.current = true;
                }

                if (isNevoa && fov.setCamadasNevoa) {
                    fov.setCamadasNevoa(novosTokens);
                } else if (!isNevoa && setStateDirect) {
                    setStateDirect(novosTokens);
                }

                if (!isNevoa) {
                    const tokenRedimensionado = novosTokens[itemInfo.indice];
                    if (tokenRedimensionado && tokenRedimensionado.escala !== itemInfo.token?.escala) {
                        emitirMovimentoToken(tokenRedimensionado, tokenRedimensionado.id, tokenRedimensionado.x, tokenRedimensionado.y, tokenRedimensionado.escala);
                    }
                }
                event.preventDefault();
                return;
            }

            if (uiState.ui.isDragging) {
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
        console.log('[MouseTabletop] handleMouseUp - button:', event.button);
        const container = containerRef.current;
        if (!container) return;

        if (fov.modoDesenho && fov.desenhando) {
            fov.finalizarDesenho();
        }

        if (event.button === 2) {
            if (uiState.mouseDownInfo && uiState.ui.isClickingToken) {
                const tokenSobre = uiState.mouseDownInfo.token;
                console.log('[MouseTabletop] abrindo menu de contexto para token:', tokenSobre.token.id);
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
                    console.log('[MouseTabletop] finalizando arrasto');
                    finalizarArrasto();
                    if (uiState.camadaSendoArrastada && isMaster) {
                        const camadaId = uiState.camadaSendoArrastada.camada.id;
                        const camadaData = fov.camadasNevoa.find(c => c.id === camadaId);
                        if (camadaData) {
                            console.log('[MouseTabletop] salvando posição final da camada:', camadaId);
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
                        console.log('[MouseTabletop] salvando redimensionamento do token:', tokenId);
                        salvarToken(tokenId, {
                            escala: tokenData.escala,
                            x: tokenData.x,
                            y: tokenData.y,
                        });
                    }
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