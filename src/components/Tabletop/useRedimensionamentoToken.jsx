// components/Tabletop/useRedimensionamentoToken.jsx
import { useCallback, useRef } from "react";
import { calcularNovaEscalaToken } from "./UtilitariosToken";
import { clamp } from "./ConstantesMesa";

export function useRedimensionamentoToken({ salvarToken, emitirTokenMoved, emitirDragEnd } = {}) {
    const resizeStartStateRef = useRef(null);
    const redimensionandoRef = useRef(false);
    const ultimoEmitRef = useRef(0);
    const THROTTLE_MS = 16;

    const processarRedimensionamento = useCallback((
        mouseX,
        mouseY,
        tokenRedimensionando,
        modoRedimensionamento,
        tamanhoInicial,
        boundingBoxGrupo,
        tokensAtuais,
        zoom,
        position,
        isGroupResize = false,
        indicesGrupo = []
    ) => {
        if (isGroupResize && indicesGrupo.length > 0) {
            if (!resizeStartStateRef.current) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                indicesGrupo.forEach(indice => {
                    const token = tokensAtuais[indice];
                    if (token) {
                        minX = Math.min(minX, token.x);
                        minY = Math.min(minY, token.y);
                        maxX = Math.max(maxX, token.x + (token.larguraOriginal * token.escala));
                        maxY = Math.max(maxY, token.y + (token.alturaOriginal * token.escala));
                    }
                });

                if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
                    return tokensAtuais;
                }

                const centroX = minX + (maxX - minX) / 2;
                const centroY = minY + (maxY - minY) / 2;

                const estadoInicialTokens = {};
                indicesGrupo.forEach(indice => {
                    const token = tokensAtuais[indice];
                    if (token) {
                        estadoInicialTokens[indice] = {
                            x: token.x,
                            y: token.y,
                            escala: token.escala,
                            larguraOriginal: token.larguraOriginal,
                            alturaOriginal: token.alturaOriginal
                        };
                    }
                });

                resizeStartStateRef.current = {
                    mouseInicial: { x: mouseX, y: mouseY },
                    boundingBox: {
                        x: minX,
                        y: minY,
                        width: maxX - minX,
                        height: maxY - minY
                    },
                    centro: { x: centroX, y: centroY },
                    tokens: estadoInicialTokens
                };

                redimensionandoRef.current = true;
                return tokensAtuais;
            }

            const estadoInicial = resizeStartStateRef.current;

            if (!estadoInicial || !estadoInicial.boundingBox) {
                resizeStartStateRef.current = null;
                redimensionandoRef.current = false;
                return tokensAtuais;
            }

            const mundo = {
                mundoX: (mouseX - position.x) / zoom,
                mundoY: (mouseY - position.y) / zoom
            };

            if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
                return tokensAtuais;
            }
            
            const escalaCalculada = calcularNovaEscalaToken(
                mundo.mundoX, mundo.mundoY,
                estadoInicial.boundingBox.x, 
                estadoInicial.boundingBox.y,
                estadoInicial.boundingBox.width,
                estadoInicial.boundingBox.height,
                modoRedimensionamento?.toLowerCase(),
                { 
                    largura: estadoInicial.boundingBox.width, 
                    altura: estadoInicial.boundingBox.height 
                },
                4
            );

            // Normaliza: compensa o amortecimento do bounding box grande
            const REF = 100;
            const fator = Math.max(estadoInicial.boundingBox.width, estadoInicial.boundingBox.height) / REF;
            let escalaFinal = 1 + (escalaCalculada - 1) * fator;

            // Limite por token: cada token tem sua escala individual (0.1 ~ 4.0)
            // O grupo para quando o PRIMEIRO token atinge o limite
            let limiteMin = 0.1;
            let limiteMax = 4.0;
            indicesGrupo.forEach(indice => {
                const t = estadoInicial.tokens[indice];
                if (t && t.escala > 0) {
                    limiteMin = Math.max(limiteMin, 0.1 / t.escala);
                    limiteMax = Math.min(limiteMax, 4.0 / t.escala);
                }
            });
            escalaFinal = clamp(escalaFinal, limiteMin, limiteMax);

            if (isNaN(escalaFinal) || escalaFinal <= 0) {
                return tokensAtuais;
            }

            const novosTokens = [...tokensAtuais];

            indicesGrupo.forEach(indice => {
                const tokenInicial = estadoInicial.tokens[indice];
                if (tokenInicial && novosTokens[indice]) {
                    const relX = tokenInicial.x - estadoInicial.centro.x;
                    const relY = tokenInicial.y - estadoInicial.centro.y;

                    const novoX = estadoInicial.centro.x + (relX * escalaFinal);
                    const novoY = estadoInicial.centro.y + (relY * escalaFinal);
                    const novaEscala = clamp(tokenInicial.escala * escalaFinal, 0.1, 4.0);

                    novosTokens[indice] = {
                        ...novosTokens[indice],
                        x: novoX,
                        y: novoY,
                        escala: novaEscala
                    };
                }
            });

            return novosTokens;
        }

        if (!tokenRedimensionando) {
            return tokensAtuais;
        }
        
        const item = tokenRedimensionando.token || tokenRedimensionando.camada;
        const indice = tokenRedimensionando.indice;
        
        if (!item) {
            return tokensAtuais;
        }

        if (!resizeStartStateRef.current) {
            const itemAtual = tokensAtuais[indice];
            if (!itemAtual) {
                return tokensAtuais;
            }

            resizeStartStateRef.current = {
                mouseInicial: { x: mouseX, y: mouseY },
                itemInicial: {
                    x: itemAtual.x,
                    y: itemAtual.y,
                    escala: itemAtual.escala,
                    larguraOriginal: itemAtual.larguraOriginal,
                    alturaOriginal: itemAtual.alturaOriginal
                }
            };

            redimensionandoRef.current = true;
            return tokensAtuais;
        }

        const estadoInicial = resizeStartStateRef.current;
        
        if (!estadoInicial || !estadoInicial.itemInicial) {
            resizeStartStateRef.current = null;
            redimensionandoRef.current = false;
            return tokensAtuais;
        }

        const mundo = {
            mundoX: (mouseX - position.x) / zoom,
            mundoY: (mouseY - position.y) / zoom
        };

        if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
            return tokensAtuais;
        }

        const novosTokens = [...tokensAtuais];
        const itemAtual = novosTokens[indice];

        if (!itemAtual) {
            resizeStartStateRef.current = null;
            redimensionandoRef.current = false;
            return tokensAtuais;
        }

                const novaEscala = calcularNovaEscalaToken(
            mundo.mundoX, mundo.mundoY,
            estadoInicial.itemInicial.x,
            estadoInicial.itemInicial.y,
            estadoInicial.itemInicial.larguraOriginal || 50,
            estadoInicial.itemInicial.alturaOriginal || 50,
            modoRedimensionamento?.toLowerCase(),
            {
                largura: estadoInicial.itemInicial.larguraOriginal,
                altura: estadoInicial.itemInicial.alturaOriginal,
                escala: estadoInicial.itemInicial.escala
            }
        );
        console.log('[useRedimensionamentoToken] Redimensionando item:', itemAtual.id, 'novaEscala:', novaEscala, 'modo:', modoRedimensionamento);

        if (isNaN(novaEscala) || novaEscala <= 0) {
            return tokensAtuais;
        }

        // Ajustar posicao com base no canto ancorado (usando posicao INICIAL)
        const larguraBase = estadoInicial.itemInicial.larguraOriginal || 50;
        const alturaBase = estadoInicial.itemInicial.alturaOriginal || 50;
        const escalaInicial = estadoInicial.itemInicial.escala;
        const larguraAntiga = larguraBase * escalaInicial;
        const alturaAntiga = alturaBase * escalaInicial;
        const larguraNova = larguraBase * novaEscala;
        const alturaNova = alturaBase * novaEscala;
        const modo = modoRedimensionamento?.toLowerCase();
        const inicialX = estadoInicial.itemInicial.x;
        const inicialY = estadoInicial.itemInicial.y;

        let novoX = inicialX;
        let novoY = inicialY;

        if (modo === 'nw') {
            novoX = inicialX + larguraAntiga - larguraNova;
            novoY = inicialY + alturaAntiga - alturaNova;
        } else if (modo === 'ne') {
            novoY = inicialY + alturaAntiga - alturaNova;
        } else if (modo === 'sw') {
            novoX = inicialX + larguraAntiga - larguraNova;
        }

        novosTokens[indice] = {
            ...novosTokens[indice],
            x: novoX,
            y: novoY,
            escala: novaEscala
        };

        // Emitir movimento via socket durante o redimensionamento (throttled)
        if (emitirTokenMoved && emitirDragEnd) {
            const agora = Date.now();
            const timeSinceLastEmit = agora - ultimoEmitRef.current;
            if (timeSinceLastEmit >= THROTTLE_MS) {
                ultimoEmitRef.current = agora;
                emitirTokenMoved(itemAtual.id, {
                    escala: novaEscala,
                    x: novosTokens[indice].x,
                    y: novosTokens[indice].y
                });
            }
        }

        return novosTokens;
    }, [emitirTokenMoved, emitirDragEnd]);

    const finalizarRedimensionamento = useCallback(() => {
        if (redimensionandoRef.current) {
            // Não precisamos mais salvar aqui, pois o save já é feito pelo movimento
            // e pelo mouseup no useMouseTabletop
            redimensionandoRef.current = false;
            resizeStartStateRef.current = null;
        } else {
            redimensionandoRef.current = false;
            resizeStartStateRef.current = null;
        }
    }, []);

    return { 
        processarRedimensionamento, 
        resizeStartStateRef,
        redimensionandoRef,
        finalizarRedimensionamento
    };
}