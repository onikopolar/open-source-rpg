// src/components/Tabletop/Mobile/MobileTabletop.jsx
import { useCallback, useRef } from "react";

const MOVE_THRESHOLD = 5;
const THROTTLE_MS = 16;
const LONG_PRESS_DURATION = 500; // ms para considerar toque longo

export function useMobileTabletop({
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
    isMaster,
    iniciarCapturaArrasto,
    finalizarCapturaArrasto
}) {
    // Refs para gerenciar estado dos toques
    const touchStartRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const initialPinchDistance = useRef(0);
    const initialZoom = useRef(1);
    const initialPinchCenter = useRef({ x: 0, y: 0 }); // Centro do pinch (coordenadas da tela)
    const initialPosition = useRef({ x: 0, y: 0 }); // Posição inicial do mapa
    const ultimoEmitRef = useRef(0);
    const ultimoEmitCamadaRef = useRef(0);
    const dragStartEmitidoRef = useRef(false);
    const movimentoIniciadoRef = useRef(false);
    const currentTouchId = useRef(null);

    const isTokenBloqueado = useCallback((tokenId, token) => {
        if (uiState.tokensBloqueados[tokenId] === true) return true;
        // Player não pode interagir com token dentro da névoa
        if (!isMaster && token && fov?.estaCoberto && fov.estaCoberto(token.x, token.y)) return true;
        return false;
    }, [uiState.tokensBloqueados, isMaster, fov]);

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

                // Finalizar captura de histórico se houve movimento
                if (isMaster && finalizarCapturaArrasto) {
                    finalizarCapturaArrasto();
                }
            }

            dragInProgressRef.current = false;
            teveMovimentoRef.current = false;
        }
    }, [uiState, tokensState, emitirDragEnd, salvarToken, uiDispatch, teveMovimentoRef, dragInProgressRef, isMaster, finalizarCapturaArrasto]);

    const getTouchDistance = (touches) => {
        if (!touches || touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getRelativeTouch = (touch) => {
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    };

    const createMockMouseEvent = (clientX, clientY, button = 0) => ({
        clientX,
        clientY,
        button,
        preventDefault: () => { },
        stopPropagation: () => { }
    });

    const handleTouchStart = useCallback((event) => {
        // Verifica se é um evento de toque válido
        if (!event.touches || event.touches.length === 0) return;
        event.preventDefault();

        const container = containerRef.current;
        if (!container) return;

        const touches = event.touches;

        if (touches.length === 2) {
            const pinchDistance = getTouchDistance(touches);
            if (pinchDistance < 10) {
                // Distância muito pequena, não tratar como pinch
                return;
            }
            initialPinchDistance.current = pinchDistance;
            initialZoom.current = uiState.zoom;

            // Calcular o centro do pinch (média das coordenadas dos dois dedos)
            const touch1 = touches[0];
            const touch2 = touches[1];
            const rect = containerRef.current.getBoundingClientRect();

            // Coordenadas relativas ao container
            const touch1X = touch1.clientX - rect.left;
            const touch1Y = touch1.clientY - rect.top;
            const touch2X = touch2.clientX - rect.left;
            const touch2Y = touch2.clientY - rect.top;

            initialPinchCenter.current = {
                x: (touch1X + touch2X) / 2,
                y: (touch1Y + touch2Y) / 2
            };

            // Armazenar posição inicial do mapa
            initialPosition.current = { ...uiState.position };

                        // Debug: console.log('[MobileTabletop] Pinch iniciado:', {
            //   distance: initialPinchDistance.current,
            //   zoom: initialZoom.current,
            //   center: initialPinchCenter.current,
            //   position: initialPosition.current
            // });

            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }

            // Limpar touchStartRef para evitar conflitos com outros gestos
            touchStartRef.current = null;
            return;
        }

        if (touches.length !== 1) return;

        const touch = touches[0];
        const relative = getRelativeTouch(touch);
        const mouseX = relative.x;
        const mouseY = relative.y;
        currentTouchId.current = touch.identifier;

        const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'esquerdo');

        if (tokenSobre) {
            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = setTimeout(() => {
                const tokenBloqueado = isTokenBloqueado(tokenSobre.token.id, tokenSobre.token);
                if (!tokenBloqueado) {
                    uiDispatch({
                        type: 'OPEN_CONTEXT_MENU',
                        payload: {
                            aberto: true,
                            x: touch.clientX,
                            y: touch.clientY,
                            tokenIndice: tokenSobre.indice,
                            tokenId: tokenSobre.token.id,
                            token: tokenSobre.token
                        }
                    });
                }
                touchStartRef.current = null;
                longPressTimerRef.current = null;
            }, LONG_PRESS_DURATION);
        }

        touchStartRef.current = {
            startX: mouseX,
            startY: mouseY,
            clientStartX: touch.clientX,
            clientStartY: touch.clientY,
            token: tokenSobre,
            isPan: !tokenSobre,
            isDragStarted: false,
            hasMoved: false
        };

        if (tokenSobre) {
            const posicao = { x: tokenSobre.telaX, y: tokenSobre.telaY };
            const dimensoes = { largura: tokenSobre.larguraTela, altura: tokenSobre.alturaTela };
            const canto = verificarSeMousePodeRedimensionar(mouseX, mouseY, posicao.x, posicao.y, dimensoes.largura, dimensoes.altura, false);
            if (canto) {
                touchStartRef.current.isResize = true;
                touchStartRef.current.canto = canto;
                touchStartRef.current.token = tokenSobre;
            }
        }
    }, [uiState, verificarSeMouseSobreToken, verificarSeMousePodeRedimensionar, isTokenBloqueado, uiDispatch]);

    const handleTouchMove = useCallback((event) => {
        if (!event.touches || event.touches.length === 0) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            const container = containerRef.current;
            if (!container) return;

            const touches = event.touches;

            if (touches.length === 2 && initialPinchDistance.current > 0) {
                const currentDistance = getTouchDistance(touches);
                const scale = currentDistance / initialPinchDistance.current;
                const newZoom = Math.min(3, Math.max(0.1, initialZoom.current * scale));

                // Calcular novo centro (média atual dos dedos)
                const touch1 = touches[0];
                const touch2 = touches[1];
                const rect = containerRef.current.getBoundingClientRect();
                const touch1X = touch1.clientX - rect.left;
                const touch1Y = touch1.clientY - rect.top;
                const touch2X = touch2.clientX - rect.left;
                const touch2Y = touch2.clientY - rect.top;
                const currentCenterX = (touch1X + touch2X) / 2;
                const currentCenterY = (touch1Y + touch2Y) / 2;

                // Aplicar fórmula para manter o ponto do mundo sob o centro do pinch
                // position1 = center - (center - position0) * (zoom1 / zoom0)
                const zoomRatio = initialZoom.current > 0.01 ? newZoom / initialZoom.current : 1;
                const newPosition = {
                    x: currentCenterX - (currentCenterX - initialPosition.current.x) * zoomRatio,
                    y: currentCenterY - (currentCenterY - initialPosition.current.y) * zoomRatio
                };

                                // Restringir posição dentro dos limites (usar novo zoom para cálculo correto)
                const constrainedPosition = restringirPosicao(newPosition.x, newPosition.y, newZoom);

                                // Debug: console.log('[MobileTabletop] Pinch atualizado:', {
                //   scale,
                //   newZoom,
                //   zoomRatio,
                //   currentCenter: { x: currentCenterX, y: currentCenterY },
                //   initialCenter: initialPinchCenter.current,
                //   newPosition,
                //   constrainedPosition,
                //   initialPosition: initialPosition.current
                // });

                // Atualizar zoom e posição simultaneamente
                uiDispatch({
                    type: 'SET_ZOOM_AND_POSITION',
                    payload: {
                        zoom: newZoom,
                        position: constrainedPosition
                    }
                });

                event.preventDefault();
                return;
            }

            if (touches.length !== 1) return;

            const touch = touches[0];
            if (touch.identifier !== currentTouchId.current && currentTouchId.current !== null) return;

            const relative = getRelativeTouch(touch);
            const mouseX = relative.x;
            const mouseY = relative.y;

            if (!touchStartRef.current) return;

            const dx = mouseX - touchStartRef.current.startX;
            const dy = mouseY - touchStartRef.current.startY;
            const distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia > MOVE_THRESHOLD && !touchStartRef.current.isDragStarted) {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }
                touchStartRef.current.hasMoved = true;
                touchStartRef.current.isDragStarted = true;

                const tokenSobre = touchStartRef.current.token;
                if (tokenSobre && !touchStartRef.current.isResize) {
                    const tokenBloqueado = isTokenBloqueado(tokenSobre.token.id, tokenSobre.token);
                    if (!tokenBloqueado) {
                        if (trazerTokenParaFrente) trazerTokenParaFrente(tokenSobre.token.id);
                        uiDispatch({ type: 'SELECT_TOKEN', payload: tokenSobre.indice });
                        if (emitirSelecao) emitirSelecao(tokenSobre.token.id);
                        iniciarArrastoToken(
                            { token: tokenSobre.token, indice: tokenSobre.indice, telaX: tokenSobre.telaX, telaY: tokenSobre.telaY, isGroupDrag: false },
                            mouseX - tokenSobre.telaX,
                            mouseY - tokenSobre.telaY
                        );

                        if (isMaster && iniciarCapturaArrasto) {
                            iniciarCapturaArrasto();
                        }
                    } else {
                        uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                        dragStartRef.current = { x: touch.clientX - uiState.position.x, y: touch.clientY - uiState.position.y };
                        isRightClickDragRef.current = true;
                    }
                } else if (tokenSobre && touchStartRef.current.isResize) {
                    const tokenBloqueado = isTokenBloqueado(tokenSobre.token.id, tokenSobre.token);
                    if (!tokenBloqueado) {
                        iniciarRedimensionamento(tokenSobre.token, tokenSobre.indice, touchStartRef.current.canto, {
                            x: mouseX - tokenSobre.telaX,
                            y: mouseY - tokenSobre.telaY
                        });
                    }
                } else {
                    uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                    dragStartRef.current = { x: touch.clientX - uiState.position.x, y: touch.clientY - uiState.position.y };
                    isRightClickDragRef.current = true;
                }
            }

            if (touchStartRef.current.isDragStarted) {
                if (uiState.tokenSendoArrastado || uiState.camadaSendoArrastada) {
                    const isNevoa = !!uiState.camadaSendoArrastada;
                    const itemInfo = isNevoa ? uiState.camadaSendoArrastada : uiState.tokenSendoArrastado;
                    if (itemInfo) {
                        teveMovimentoRef.current = true;
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
                                if (agora - ultimoEmitRef.current >= THROTTLE_MS) {
                                    ultimoEmitRef.current = agora;
                                    if (emitirTokenMoved) emitirTokenMoved(tokenMovido.id, { x: tokenMovido.x, y: tokenMovido.y });
                                }
                            }
                        } else {
                            const camadaMovida = novosTokens[itemInfo.indice];
                            if (camadaMovida && (camadaMovida.x !== itemInfo.camada?.x || camadaMovida.y !== itemInfo.camada?.y)) {
                                const agora = Date.now();
                                if (agora - ultimoEmitCamadaRef.current >= THROTTLE_MS) {
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
                    }
                } else if (uiState.ui.isDragging) {
                    const constrained = restringirPosicao(touch.clientX - dragStartRef.current.x, touch.clientY - dragStartRef.current.y);
                    uiDispatch({ type: 'SET_POSITION', payload: constrained });
                } else if (uiState.tokenRedimensionando || uiState.camadaRedimensionando) {
                    const isNevoa = !!uiState.camadaRedimensionando;
                    const itemInfo = isNevoa ? uiState.camadaRedimensionando : uiState.tokenRedimensionando;
                    if (itemInfo) {
                        const indicesGrupo = itemInfo.isGroupResize ? uiState.tokensSelecionados : [];
                        const arrayAtual = isNevoa ? fov.camadasNevoa : tokensState;
                        const novosTokens = processarRedimensionamento(
                            mouseX, mouseY, itemInfo, uiState.modoRedimensionamento,
                            uiState.tamanhoInicialRedimensionamento, uiState.boundingBoxGrupo,
                            arrayAtual, uiState.zoom, uiState.position,
                            itemInfo.isGroupResize || false, indicesGrupo
                        );
                        if (!resizeInProgressRef.current) resizeInProgressRef.current = true;
                        if (isNevoa && fov.setCamadasNevoa) {
                            fov.setCamadasNevoa(novosTokens);
                        } else if (!isNevoa && setStateDirect) {
                            setStateDirect(novosTokens);
                        }
                        if (!isNevoa) {
                            const tokenRedimensionado = novosTokens[itemInfo.indice];
                            if (tokenRedimensionado && tokenRedimensionado.escala !== itemInfo.token?.escala) {
                                const agora = Date.now();
                                if (agora - ultimoEmitRef.current >= THROTTLE_MS) {
                                    ultimoEmitRef.current = agora;
                                    if (emitirTokenMoved) emitirTokenMoved(tokenRedimensionado.id, { x: tokenRedimensionado.x, y: tokenRedimensionado.y });
                                }
                            }
                        }
                    }
                }
                event.preventDefault();
            }
        });
    }, [uiState, tokensState, fov, processarArrastoToken, processarRedimensionamento, setStateDirect, socket, tabletopId, emitirTokenMoved, emitirDragStart, isMaster, restringirPosicao, iniciarArrastoToken, iniciarRedimensionamento, trazerTokenParaFrente, emitirSelecao, isTokenBloqueado, iniciarCapturaArrasto]);

    const handleTouchEnd = useCallback((event) => {
        // Verifica se o evento tem touches (pode não ter no touchend)
        if (event.touches && event.touches.length > 0) {
            // Se ainda há toques, não finaliza completamente (pode ser que outro dedo continue)
            // Mas no touchend, geralmente os toques são 0
        }
        event.preventDefault();

        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        if (touchStartRef.current?.isDragStarted) {
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

                // Finalizar captura de histórico para redimensionamento de token
                if (uiState.tokenRedimensionando && isMaster && finalizarCapturaArrasto) {
                    finalizarCapturaArrasto();
                }

                resizeInProgressRef.current = false;
                if (resizeStartStateRef.current) resizeStartStateRef.current = null;
            }

            if (uiState.tokenRedimensionando || uiState.camadaRedimensionando) uiDispatch({ type: 'STOP_RESIZE' });
            if (uiState.ui.isDragging) uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: false } });
            if (uiState.tokenSendoArrastado || uiState.camadaSendoArrastada) uiDispatch({ type: 'STOP_DRAG' });
        } else if (!touchStartRef.current?.hasMoved && touchStartRef.current?.token) {
            const tokenSobre = touchStartRef.current.token;
            if (tokenSobre) {
                const tokenBloqueado = isTokenBloqueado(tokenSobre.token.id, tokenSobre.token);
                if (!tokenBloqueado) {
                    uiDispatch({ type: 'SELECT_TOKEN', payload: tokenSobre.indice });
                    if (emitirSelecao) emitirSelecao(tokenSobre.token.id);
                }
            }
        } else if (!touchStartRef.current?.hasMoved && !touchStartRef.current?.token) {
            // Toque em espaço vazio → desselecionar
            uiDispatch({ type: 'SELECT_TOKEN', payload: null });
            uiDispatch({ type: 'SELECT_CAMADA', payload: null });
        }

        touchStartRef.current = null;
        currentTouchId.current = null;
        initialPinchDistance.current = 0;
        initialPinchCenter.current = { x: 0, y: 0 };
        initialPosition.current = { x: 0, y: 0 };
        dragStartEmitidoRef.current = false;
        movimentoIniciadoRef.current = false;
        dragInProgressRef.current = false;
        resizeInProgressRef.current = false;
        teveMovimentoRef.current = false;
        isRightClickDragRef.current = false;

        uiDispatch({ type: 'SET_MOUSE_DOWN_INFO', payload: null });
        uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: false } });
    }, [uiState, tokensState, fov, finalizarArrasto, isMaster, salvarToken, emitirSelecao, isTokenBloqueado, finalizarCapturaArrasto]);

    return {
        handleMouseDown: handleTouchStart,
        handleMouseMove: handleTouchMove,
        handleMouseUp: handleTouchEnd
    };
}