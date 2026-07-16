// components/Tabletop/useRedimensionamentoToken.jsx
import { useCallback, useRef } from "react";
import { calcularNovaEscalaToken } from "./UtilitariosToken";
import { clamp } from "./ConstantesMesa";

export function useRedimensionamentoToken({ salvarToken, emitirTokenMoved, emitirDragEnd } = {}) {
    const resizeStartStateRef = useRef(null);
    const redimensionandoRef = useRef(false);
    const ultimoEmitRef = useRef(0);
    const THROTTLE_MS = 16; // 60 FPS — suficiente para movimento suave, evita sobrecarga

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
        indicesGrupo = [],
        rotacao = 0
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

                const mouseInicialMundo = {
                    x: (mouseX - position.x) / zoom,
                    y: (mouseY - position.y) / zoom
                };

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
                    mouseInicialMundo,
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
            
            // Para GRUPO: usa distancia diagonal do mouse ao canto ancora para escala UNIFORME
            const boxW = estadoInicial.boundingBox.width;
            const boxH = estadoInicial.boundingBox.height;
            const bx = estadoInicial.boundingBox.x;
            const by = estadoInicial.boundingBox.y;
            const modo = modoRedimensionamento?.toLowerCase();

            let anchorX, anchorY;
            if (modo === 'se')      { anchorX = bx;       anchorY = by; }
            else if (modo === 'sw') { anchorX = bx + boxW; anchorY = by; }
            else if (modo === 'ne') { anchorX = bx;        anchorY = by + boxH; }
            else                    { anchorX = bx + boxW; anchorY = by + boxH; } // nw

            // Posicao inicial do mouse em coordenadas de mundo (salva no mousedown)
            const mouseInicialX = estadoInicial.mouseInicialMundo.x;
            const mouseInicialY = estadoInicial.mouseInicialMundo.y;

            // Projecao do movimento do mouse na DIAGONAL da caixa (com sinal!)
            const distDiagonal = Math.sqrt(boxW * boxW + boxH * boxH);
            // Direcao de crescimento: sempre pra FORA da ancora
            let signX = 1, signY = 1;
            if (modo === 'sw' || modo === 'nw') signX = -1; // ancora na direita → cresce pra esquerda
            if (modo === 'ne' || modo === 'nw') signY = -1; // ancora em baixo → cresce pra cima
            const dirX = signX * boxW / Math.max(distDiagonal, 1);
            const dirY = signY * boxH / Math.max(distDiagonal, 1);
            // Movimento do mouse projetado na direcao da diagonal
            const dx = mundo.mundoX - mouseInicialX;
            const dy = mundo.mundoY - mouseInicialY;
            const deltaProjetado = dx * dirX + dy * dirY;
            let escalaFinal = 1 + deltaProjetado / distDiagonal;
            escalaFinal = Math.max(0.1, escalaFinal);

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

        // Desrotaciona mouse para o espaço local do token
        let mouseRefX = mundo.mundoX;
        let mouseRefY = mundo.mundoY;
        if (rotacao !== 0) {
            const larguraInicial = (estadoInicial.itemInicial.larguraOriginal || 50) * estadoInicial.itemInicial.escala;
            const alturaInicial = (estadoInicial.itemInicial.alturaOriginal || 50) * estadoInicial.itemInicial.escala;
            const cx = estadoInicial.itemInicial.x + larguraInicial / 2;
            const cy = estadoInicial.itemInicial.y + alturaInicial / 2;
            const angulo = -(rotacao * Math.PI) / 180;
            const cos = Math.cos(angulo);
            const sin = Math.sin(angulo);
            const dx = mundo.mundoX - cx;
            const dy = mundo.mundoY - cy;
            mouseRefX = cx + dx * cos - dy * sin;
            mouseRefY = cy + dx * sin + dy * cos;
        }

                const novaEscala = calcularNovaEscalaToken(
            mouseRefX, mouseRefY,
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