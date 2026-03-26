// components/Tabletop/MouseTabletop.jsx
import { useCallback } from "react";

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
    fov,
    trazerTokenParaFrente,
    finalizarArrasto,
    finalizarRedimensionamento
}) {

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

        // Botão direito (igual ao original, sem logs)
        if (event.button === 2) {
            event.preventDefault();

            const { mundoX, mundoY } = converterMouseParaMundo(mouseX, mouseY);
            const camada = fov.encontrarCamadaNaPosicao(mundoX, mundoY);

            if (camada) {
                uiDispatch({
                    type: 'OPEN_CONTEXT_MENU',
                    payload: {
                        aberto: true,
                        x: event.clientX,
                        y: event.clientY,
                        tipo: 'nevoa',
                        camadaId: camada.id,
                        camada: camada
                    }
                });
                return;
            }

            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'direito');

            if (tokenSobre) {
                const tokenBloqueado = uiState.tokensBloqueados[tokenSobre.token.id] === true;

                if (tokenBloqueado) {
                    isRightClickDragRef.current = false;
                    uiDispatch({
                        type: 'SET_MOUSE_DOWN_INFO',
                        payload: {
                            token: tokenSobre,
                            mouseX, mouseY,
                            timestamp: Date.now(),
                            tokenIndice: tokenSobre.indice,
                            isRightClick: true,
                            isBlocked: true
                        }
                    });
                } else {
                    uiDispatch({
                        type: 'SET_MOUSE_DOWN_INFO',
                        payload: {
                            token: tokenSobre,
                            mouseX, mouseY,
                            timestamp: Date.now(),
                            tokenIndice: tokenSobre.indice,
                            isRightClick: true,
                            isBlocked: false
                        }
                    });
                    uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: true } });
                }
            } else {
                uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                dragStartRef.current = {
                    x: event.clientX - uiState.position.x,
                    y: event.clientY - uiState.position.y
                };
            }
            return;
        }

        // Botão esquerdo
        if (event.button === 0 && !fov.modoDesenho) {
            teveMovimentoRef.current = false;

            const { mundoX, mundoY } = converterMouseParaMundo(mouseX, mouseY);
            const camadaEncontrada = fov.encontrarCamadaNaPosicao(mundoX, mundoY);

            if (camadaEncontrada) {
                const itemComInfo = camadasComInfo.find(c => c.id === camadaEncontrada.id);
                if (!itemComInfo) return;

                const indiceCamada = itemComInfo.indice;
                const itemClicado = {
                    ...camadaEncontrada,
                    indice: indiceCamada,
                    tipo: 'nevoa',
                    nome: 'Névoa'
                };

                const canto = verificarSeMousePodeRedimensionar(
                    mouseX, mouseY,
                    itemComInfo.posicaoTela.x,
                    itemComInfo.posicaoTela.y,
                    itemComInfo.tamanhoTela.larguraTela,
                    itemComInfo.tamanhoTela.alturaTela,
                    false
                );

                if (canto) {
                    uiDispatch({
                        type: 'START_RESIZE',
                        payload: {
                            token: itemClicado,
                            indice: indiceCamada,
                            canto: canto,
                            tamanhoInicial: {
                                largura: itemClicado.larguraOriginal,
                                altura: itemClicado.alturaOriginal,
                                escala: itemClicado.escala
                            },
                            offset: {
                                x: mouseX - itemComInfo.posicaoTela.x,
                                y: mouseY - itemComInfo.posicaoTela.y
                            },
                            isGroupResize: false
                        }
                    });
                    event.preventDefault();
                    return;
                }

                // Se não for redimensionamento, inicia movimento
                const offsetX = mouseX - itemComInfo.posicaoTela.x;
                const offsetY = mouseY - itemComInfo.posicaoTela.y;

                uiDispatch({
                    type: 'SELECT_CAMADA',
                    payload: indiceCamada
                });

                uiDispatch({
                    type: 'START_DRAG',
                    payload: {
                        tipo: 'nevoa',
                        item: itemClicado,
                        indice: indiceCamada,
                        offset: {
                            offsetX, offsetY,
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

            // ===== LÓGICA DE TOKENS =====

            // Grupo selecionado
            if (uiState.tokensSelecionados.length > 1) {
                const tokensSelecionadosInfo = uiState.tokensSelecionados
                    .map(indice => tokensComInfo[indice])
                    .filter(token => token && !token.bloqueado);

                if (tokensSelecionadosInfo.length > 0) {
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                    tokensSelecionadosInfo.forEach(token => {
                        minX = Math.min(minX, token.posicaoTela.x);
                        minY = Math.min(minY, token.posicaoTela.y);
                        maxX = Math.max(maxX, token.posicaoTela.x + token.tamanhoTela.larguraTela);
                        maxY = Math.max(maxY, token.posicaoTela.y + token.tamanhoTela.alturaTela);
                    });

                    const tokenClicadoDoGrupo = tokensSelecionadosInfo.find(token =>
                        mouseX >= token.posicaoTela.x &&
                        mouseX <= token.posicaoTela.x + token.tamanhoTela.larguraTela &&
                        mouseY >= token.posicaoTela.y &&
                        mouseY <= token.posicaoTela.y + token.tamanhoTela.alturaTela
                    );

                    if (tokenClicadoDoGrupo) {
                        const primeiroTokenGrupo = tokensSelecionadosInfo[0];

                        const grupoTokenInfo = {
                            token: primeiroTokenGrupo,
                            indice: primeiroTokenGrupo.indice,
                            telaX: primeiroTokenGrupo.posicaoTela.x,
                            telaY: primeiroTokenGrupo.posicaoTela.y,
                            isGroupDrag: true
                        };

                        const offsetX = mouseX - primeiroTokenGrupo.posicaoTela.x;
                        const offsetY = mouseY - primeiroTokenGrupo.posicaoTela.y;

                        uiDispatch({
                            type: 'START_TOKEN_DRAG',
                            payload: {
                                tokenInfo: grupoTokenInfo,
                                offset: { x: offsetX, y: offsetY }
                            }
                        });

                        isDraggingRef.current = true;
                        dragInProgressRef.current = true;
                        event.preventDefault();
                        return;
                    }

                    const padding = 16;
                    const areaBorda = {
                        x: minX - padding,
                        y: minY - padding,
                        width: (maxX - minX) + (padding * 2),
                        height: (maxY - minY) + (padding * 2)
                    };

                    const mouseNaBorda = mouseX >= areaBorda.x &&
                        mouseX <= areaBorda.x + areaBorda.width &&
                        mouseY >= areaBorda.y &&
                        mouseY <= areaBorda.y + areaBorda.height;

                    if (mouseNaBorda) {
                        let minXMundo = Infinity, minYMundo = Infinity,
                            maxXMundo = -Infinity, maxYMundo = -Infinity;

                        tokensSelecionadosInfo.forEach(token => {
                            minXMundo = Math.min(minXMundo, token.x);
                            minYMundo = Math.min(minYMundo, token.y);
                            maxXMundo = Math.max(maxXMundo, token.x + (token.larguraOriginal * token.escala));
                            maxYMundo = Math.max(maxYMundo, token.y + (token.alturaOriginal * token.escala));
                        });

                        const boundingBoxMundo = {
                            x: minXMundo,
                            y: minYMundo,
                            largura: maxXMundo - minXMundo,
                            altura: maxYMundo - minYMundo,
                            larguraBase: maxXMundo - minXMundo,
                            alturaBase: maxYMundo - minYMundo
                        };

                        const primeiroToken = tokensSelecionadosInfo[0];
                        const canto = 'se';

                        resizeStartStateRef.current = {
                            tokenIndice: primeiroToken.indice,
                            escalaInicial: primeiroToken.escala || 1,
                            isGroupResize: true
                        };

                        uiDispatch({
                            type: 'START_RESIZE',
                            payload: {
                                token: primeiroToken,
                                indice: primeiroToken.indice,
                                canto: canto,
                                tamanhoInicial: {
                                    largura: boundingBoxMundo.largura,
                                    altura: boundingBoxMundo.altura,
                                    escala: 1
                                },
                                boundingBoxGrupo: boundingBoxMundo,
                                offset: {
                                    x: mouseX - minX,
                                    y: mouseY - minY
                                },
                                isGroupResize: true
                            }
                        });
                        event.preventDefault();
                        return;
                    }
                }
            }

            // Redimensionamento individual (token)
            if (uiState.tokenSelecionado !== null) {
                const token = tokensState[uiState.tokenSelecionado];
                const tokenBloqueado = uiState.tokensBloqueados[token?.id] === true;

                if (token && !tokenBloqueado) {
                    const posicaoTela = {
                        x: (token.x * uiState.zoom) + uiState.position.x,
                        y: (token.y * uiState.zoom) + uiState.position.y
                    };

                    const larguraMundo = (token.larguraOriginal || 50) * (token.escala || 1);
                    const alturaMundo = (token.alturaOriginal || 50) * (token.escala || 1);

                    const canto = verificarSeMousePodeRedimensionar(
                        mouseX, mouseY,
                        posicaoTela.x, posicaoTela.y,
                        larguraMundo * uiState.zoom,
                        alturaMundo * uiState.zoom,
                        tokenBloqueado
                    );

                    if (canto) {
                        resizeStartStateRef.current = {
                            tokenIndice: uiState.tokenSelecionado,
                            escalaInicial: token.escala || 1
                        };

                        uiDispatch({
                            type: 'START_RESIZE',
                            payload: {
                                token,
                                indice: uiState.tokenSelecionado,
                                canto,
                                tamanhoInicial: {
                                    largura: larguraMundo,
                                    altura: alturaMundo,
                                    escala: token.escala || 1
                                },
                                offset: {
                                    x: mouseX - posicaoTela.x,
                                    y: mouseY - posicaoTela.y
                                },
                                isGroupResize: false
                            }
                        });
                        event.preventDefault();
                        return;
                    }
                }
            }

            // Clique em token individual
            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'esquerdo');

            if (tokenSobre) {
                const tokenBloqueado = uiState.tokensBloqueados[tokenSobre.token.id] === true;

                if (tokenBloqueado) {
                    uiDispatch({
                        type: 'SET_FEEDBACK',
                        payload: { message: 'Token bloqueado', type: 'warning' }
                    });
                    event.preventDefault();
                    return;
                }

                const canto = verificarSeMousePodeRedimensionar(
                    mouseX, mouseY,
                    tokenSobre.telaX, tokenSobre.telaY,
                    tokenSobre.larguraTela, tokenSobre.alturaTela,
                    false
                );

                if (canto) {
                    resizeStartStateRef.current = {
                        tokenIndice: tokenSobre.indice,
                        escalaInicial: tokenSobre.token.escala || 1
                    };

                    uiDispatch({
                        type: 'START_RESIZE',
                        payload: {
                            token: tokenSobre.token,
                            indice: tokenSobre.indice,
                            canto,
                            tamanhoInicial: {
                                largura: tokenSobre.largura,
                                altura: tokenSobre.altura,
                                escala: tokenSobre.token.escala || 1
                            },
                            offset: {
                                x: mouseX - tokenSobre.telaX,
                                y: mouseY - tokenSobre.telaY
                            },
                            isGroupResize: false
                        }
                    });
                    event.preventDefault();
                    return;
                }

                const tokenJaSelecionado = uiState.tokensSelecionados.includes(tokenSobre.indice) ||
                    uiState.tokenSelecionado === tokenSobre.indice;

                if (tokenJaSelecionado && uiState.tokensSelecionados.length > 0) {
                    const novosTokens = trazerTokenParaFrente(tokensState, tokenSobre.indice);
                    setStateDirect(novosTokens);

                    const novoIndice = novosTokens.length - 1;
                    const tokenInfo = {
                        token: novosTokens[novoIndice],
                        indice: novoIndice,
                        telaX: tokenSobre.telaX,
                        telaY: tokenSobre.telaY,
                        isGroupDrag: false
                    };

                    const offsetX = mouseX - tokenSobre.telaX;
                    const offsetY = mouseY - tokenSobre.telaY;

                    uiDispatch({
                        type: 'SELECT_TOKEN',
                        payload: novoIndice
                    });

                    uiDispatch({
                        type: 'START_TOKEN_DRAG',
                        payload: {
                            tokenInfo: tokenInfo,
                            offset: { x: offsetX, y: offsetY }
                        }
                    });

                    isDraggingRef.current = true;
                    dragInProgressRef.current = true;
                    event.preventDefault();
                    return;
                } else {
                    const novosTokens = trazerTokenParaFrente(tokensState, tokenSobre.indice);
                    setStateDirect(novosTokens);

                    const novoIndice = novosTokens.length - 1;
                    const tokenInfo = {
                        token: novosTokens[novoIndice],
                        indice: novoIndice,
                        telaX: tokenSobre.telaX,
                        telaY: tokenSobre.telaY,
                        isGroupDrag: false
                    };

                    const offsetX = mouseX - tokenSobre.telaX;
                    const offsetY = mouseY - tokenSobre.telaY;

                    uiDispatch({
                        type: 'SELECT_TOKEN',
                        payload: novoIndice
                    });

                    uiDispatch({
                        type: 'START_TOKEN_DRAG',
                        payload: {
                            tokenInfo: tokenInfo,
                            offset: { x: offsetX, y: offsetY }
                        }
                    });

                    isDraggingRef.current = true;
                    dragInProgressRef.current = true;
                    event.preventDefault();
                    return;
                }
            } else {
                uiDispatch({
                    type: 'SET_MOUSE_DOWN_INFO',
                    payload: {
                        mouseX, mouseY,
                        timestamp: Date.now(),
                        isLeftClick: true,
                        isBlankArea: true
                    }
                });
                event.preventDefault();
            }
        }
    }, [uiState.tokenSelecionado, uiState.position, uiState.zoom, uiState.ignoreMouseMove,
        uiState.tokensBloqueados, uiState.tokensSelecionados, tokensState, tokensComInfo, camadasComInfo,
        verificarSeMouseSobreToken, verificarSeMousePodeRedimensionar, setStateDirect,
        resizeStartStateRef, uiDispatch, fov, converterMouseParaMundo]);

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
                uiDispatch({
                    type: 'START_AREA_SELECTION',
                    payload: {
                        x: uiState.mouseDownInfo.mouseX,
                        y: uiState.mouseDownInfo.mouseY
                    }
                });
            }

            if (uiState.mouseDownInfo?.isBlocked && !uiState.ui.isDragging && !uiState.ui.isSelectingArea) {
                uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                dragStartRef.current = {
                    x: event.clientX - uiState.position.x,
                    y: event.clientY - uiState.position.y
                };
                isRightClickDragRef.current = true;
            }

            if (uiState.ui.isSelectingArea) {
                uiDispatch({
                    type: 'UPDATE_AREA_SELECTION',
                    payload: { x: mouseX, y: mouseY }
                });

                const tokensNaArea = [];
                for (let i = 0; i < tokensComInfo.length; i++) {
                    const token = tokensComInfo[i];
                    if (!token.bloqueado && tokenEstaNaAreaSelecao(token, uiState.areaSelecao)) {
                        tokensNaArea.push(i);
                    }
                }

                uiDispatch({
                    type: 'SELECT_MULTIPLE_TOKENS',
                    payload: tokensNaArea
                });

                event.preventDefault();
                return;
            }

            // Arrasto
            if (uiState.tokenSendoArrastado || uiState.camadaSendoArrastada) {
                const isNevoa = !!uiState.camadaSendoArrastada;
                const itemInfo = isNevoa ? uiState.camadaSendoArrastada : uiState.tokenSendoArrastado;

                teveMovimentoRef.current = true;

                const arrayAtual = isNevoa ? fov.camadasNevoa : tokensState;
                const setArrayAtual = isNevoa ? fov.setCamadasNevoa : setStateDirect;

                const novosTokens = processarArrastoToken(
                    mouseX, mouseY,
                    itemInfo,
                    uiState.offsetArrasto,
                    arrayAtual,
                    uiState.zoom,
                    uiState.position,
                    itemInfo.isGroupDrag || false,
                    itemInfo.isGroupDrag ? uiState.tokensSelecionados : []
                );

                setArrayAtual(novosTokens);
                event.preventDefault();
                return;
            }

            // Redimensionamento
            if ((uiState.tokenRedimensionando || uiState.camadaRedimensionando) && uiState.modoRedimensionamento) {
                const isNevoa = !!uiState.camadaRedimensionando;
                const itemInfo = isNevoa ? uiState.camadaRedimensionando : uiState.tokenRedimensionando;
                const indicesGrupo = itemInfo.isGroupResize ? uiState.tokensSelecionados : [];
                const arrayAtual = isNevoa ? fov.camadasNevoa : tokensState;
                const setArrayAtual = isNevoa ? fov.setCamadasNevoa : setStateDirect;

                const novosTokens = processarRedimensionamento(
                    mouseX, mouseY,
                    itemInfo,
                    uiState.modoRedimensionamento,
                    uiState.tamanhoInicialRedimensionamento,
                    uiState.boundingBoxGrupo,
                    arrayAtual,
                    uiState.zoom,
                    uiState.position,
                    itemInfo.isGroupResize || false,
                    indicesGrupo
                );

                if (!resizeInProgressRef.current) {
                    resizeInProgressRef.current = true;
                }

                setArrayAtual(novosTokens);
                event.preventDefault();
                return;
            }

            if (uiState.ui.isDragging) {
                const constrained = restringirPosicao(
                    event.clientX - dragStartRef.current.x,
                    event.clientY - dragStartRef.current.y
                );

                uiDispatch({ type: 'SET_POSITION', payload: constrained });
                event.preventDefault();
                return;
            }
        });
    }, [uiState, tokensState, tokensComInfo, tokenEstaNaAreaSelecao, restringirPosicao,
        processarArrastoToken, processarRedimensionamento, setStateDirect, uiDispatch, fov]);

    const handleMouseUp = useCallback((event) => {
        const container = containerRef.current;
        if (!container) return;

        if (fov.modoDesenho && fov.desenhando) {
            fov.finalizarDesenho();
        }

        if (event.button === 2) {
            if (uiState.mouseDownInfo?.isBlocked) {
                if (!isRightClickDragRef.current) {
                    const tokenSobre = uiState.mouseDownInfo.token;
                    uiDispatch({
                        type: 'SELECT_TOKEN',
                        payload: uiState.mouseDownInfo.tokenIndice
                    });

                    uiDispatch({
                        type: 'OPEN_CONTEXT_MENU',
                        payload: {
                            aberto: true,
                            x: event.clientX,
                            y: event.clientY,
                            tokenIndice: uiState.mouseDownInfo.tokenIndice,
                            tokenId: tokenSobre.token.id,
                            token: tokenSobre.token
                        }
                    });
                }
            }

            if (uiState.mouseDownInfo && uiState.ui.isClickingToken && uiState.mouseDownInfo.isRightClick && !uiState.mouseDownInfo.isBlocked) {
                const tokenSobre = uiState.mouseDownInfo.token;

                uiDispatch({
                    type: 'SELECT_TOKEN',
                    payload: tokenSobre.indice
                });

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
                    finalizarArrasto();
                }
                isDraggingRef.current = false;
            }

            if (resizeInProgressRef.current || uiState.tokenRedimensionando || uiState.camadaRedimensionando) {
                finalizarRedimensionamento();
            }
        }

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

    }, [uiState, finalizarArrasto, finalizarRedimensionamento, uiDispatch, fov]);

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp
    };
}