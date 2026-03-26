// components/Tabletop/useRedimensionamentoToken.jsx
import { useCallback, useRef } from "react";
import { calcularNovaEscalaToken } from "./UtilitariosToken";
import { calcularPosicoesBolinhas } from "./useSelecaoToken";

export function useRedimensionamentoToken() {
    const resizeStartStateRef = useRef(null);

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
        // ===== REDIMENSIONAMENTO DE GRUPO =====
        if (isGroupResize && indicesGrupo.length > 0) {
            // PRIMEIRO FRAME - Salvar estado inicial
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

                return tokensAtuais;
            }

            // FRAMES SEGUINTES
            const estadoInicial = resizeStartStateRef.current;

            if (!estadoInicial || !estadoInicial.boundingBox) {
                resizeStartStateRef.current = null;
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

            if (isNaN(escalaCalculada) || escalaCalculada <= 0) {
                return tokensAtuais;
            }

            const novosTokens = [...tokensAtuais];

            indicesGrupo.forEach(indice => {
                const tokenInicial = estadoInicial.tokens[indice];
                if (tokenInicial && novosTokens[indice]) {
                    const relX = tokenInicial.x - estadoInicial.centro.x;
                    const relY = tokenInicial.y - estadoInicial.centro.y;

                    const novoX = estadoInicial.centro.x + (relX * escalaCalculada);
                    const novoY = estadoInicial.centro.y + (relY * escalaCalculada);
                    const novaEscala = tokenInicial.escala * escalaCalculada;

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

        // ===== REDIMENSIONAMENTO INDIVIDUAL =====
        // Verifica se o item existe
        if (!tokenRedimensionando) {
            return tokensAtuais;
        }
        
        // Extrai o item (pode ser token ou camada)
        const item = tokenRedimensionando.token || tokenRedimensionando.camada;
        const indice = tokenRedimensionando.indice;
        
        if (!item) {
            return tokensAtuais;
        }

        // PRIMEIRO FRAME - Salvar estado inicial para redimensionamento individual
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

            return tokensAtuais;
        }

        // FRAMES SEGUINTES - Aplicar redimensionamento individual
        const estadoInicial = resizeStartStateRef.current;
        
        if (!estadoInicial || !estadoInicial.itemInicial) {
            resizeStartStateRef.current = null;
            return tokensAtuais;
        }

        // Converte coordenadas do mouse para o mundo
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
            return tokensAtuais;
        }

        // Calcula a nova escala usando o tamanho inicial do estado
        const novaEscala = calcularNovaEscalaToken(
            mundo.mundoX, mundo.mundoY,
            itemAtual.x, itemAtual.y,
            itemAtual.larguraOriginal || 50,
            itemAtual.alturaOriginal || 50,
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

        // Aplica a nova escala
        novosTokens[indice] = {
            ...novosTokens[indice],
            escala: novaEscala
        };

        return novosTokens;
    }, []);

    const finalizarRedimensionamento = useCallback(() => {
        resizeStartStateRef.current = null;
    }, []);

    return { 
        processarRedimensionamento, 
        resizeStartStateRef,
        finalizarRedimensionamento
    };
}