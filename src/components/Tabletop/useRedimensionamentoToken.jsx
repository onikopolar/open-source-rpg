// src/components/Tabletop/useRedimensionamentoToken.jsx
import { useCallback, useRef } from "react";
import { calcularNovaEscalaToken } from "./UtilitariosToken";

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
        // Normaliza o modo para minúsculas (o calcularNovaEscalaToken espera minúsculas)
        const modoLower = modoRedimensionamento?.toLowerCase();

        if (isGroupResize && indicesGrupo.length > 0) {
            // PRIMEIRO FRAME - Salvar estado inicial
            if (!resizeStartStateRef.current) {
                // Calcular bounding box do grupo
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

                // Salvar estado inicial de cada token
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

            // FRAMES SEGUINTES - Aplicar redimensionamento
            const estadoInicial = resizeStartStateRef.current;

            if (!estadoInicial || !estadoInicial.boundingBox) {
                resizeStartStateRef.current = null;
                return tokensAtuais;
            }

            // Converter coordenadas do mouse para o mundo
            const mundo = {
                mundoX: (mouseX - position.x) / zoom,
                mundoY: (mouseY - position.y) / zoom
            };

            if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
                return tokensAtuais;
            }
            
            // Calcular a nova escala usando a função utilitária (com modo em minúsculas)
            const escalaCalculada = calcularNovaEscalaToken(
                mundo.mundoX, mundo.mundoY,
                estadoInicial.boundingBox.x, 
                estadoInicial.boundingBox.y,
                estadoInicial.boundingBox.width,
                estadoInicial.boundingBox.height,
                modoLower,
                { 
                    largura: estadoInicial.boundingBox.width, 
                    altura: estadoInicial.boundingBox.height 
                },
                4 // escalaMaxima = 4
            );

            if (isNaN(escalaCalculada) || escalaCalculada <= 0) {
                return tokensAtuais;
            }

            const novosTokens = [...tokensAtuais];

            indicesGrupo.forEach(indice => {
                const tokenInicial = estadoInicial.tokens[indice];
                if (tokenInicial && novosTokens[indice]) {
                    // Posição relativa ao centro do grupo
                    const relX = tokenInicial.x - estadoInicial.centro.x;
                    const relY = tokenInicial.y - estadoInicial.centro.y;

                    // Nova posição mantendo a proporção relativa
                    const novoX = estadoInicial.centro.x + (relX * escalaCalculada);
                    const novoY = estadoInicial.centro.y + (relY * escalaCalculada);

                    // Nova escala (escala original * fator de escala)
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

        if (!tokenRedimensionando || !tokenRedimensionando.token) {
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
        const tokenAtual = tokensAtuais[tokenRedimensionando.indice];

        if (!tokenAtual) {
            return tokensAtuais;
        }

        const novaEscala = calcularNovaEscalaToken(
            mundo.mundoX, mundo.mundoY,
            tokenAtual.x, tokenAtual.y,
            tokenAtual.larguraOriginal || 50,
            tokenAtual.alturaOriginal || 50,
            modoLower,
            tamanhoInicial
        );

        if (isNaN(novaEscala)) {
            return tokensAtuais;
        }

        novosTokens[tokenRedimensionando.indice] = {
            ...novosTokens[tokenRedimensionando.indice],
            escala: novaEscala
        };

        return novosTokens;
    }, []);

    return { processarRedimensionamento, resizeStartStateRef };
}