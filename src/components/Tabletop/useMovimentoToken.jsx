// src/components/Tabletop/useMovimentoToken.jsx
import { useCallback } from "react";
import { WORLD_WIDTH, WORLD_HEIGHT } from "./ConstantesMesa";

export function useMovimentoToken() {
    // Função auxiliar para limitar posição do token ao mundo
    const limitarPosicaoAoMundo = useCallback((x, y, token) => {
        if (!token) {
            return { x, y };
        }

        const larguraOriginal = token.larguraOriginal || 50;
        const alturaOriginal = token.alturaOriginal || 50;
        const escala = token.escala || 1;

        const larguraToken = larguraOriginal * escala;
        const alturaToken = alturaOriginal * escala;

        const xMin = 0;
        const xMax = WORLD_WIDTH - larguraToken;
        const yMin = 0;
        const yMax = WORLD_HEIGHT - alturaToken;

        const xLimitado = Math.min(Math.max(x, xMin), xMax);
        const yLimitado = Math.min(Math.max(y, yMin), yMax);

        return { x: xLimitado, y: yLimitado };
    }, []);

    const processarArrastoToken = useCallback((
        mouseX,
        mouseY,
        tokenSendoArrastado,
        offsetArrasto,
        tokensAtuais,
        zoom,
        position,
        isGroupDrag = false,
        indicesGrupo = []
    ) => {
        if (!tokenSendoArrastado || !tokenSendoArrastado.token) {
            return tokensAtuais;
        }

        if (typeof offsetArrasto.x !== 'number' || typeof offsetArrasto.y !== 'number' ||
            isNaN(offsetArrasto.x) || isNaN(offsetArrasto.y)) {
            return tokensAtuais;
        }

        const mundo = {
            mundoX: (mouseX - position.x) / zoom,
            mundoY: (mouseY - position.y) / zoom
        };

        if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
            return tokensAtuais;
        }

        const posX = mundo.mundoX - (offsetArrasto.x / zoom);
        const posY = mundo.mundoY - (offsetArrasto.y / zoom);

        if (isNaN(posX) || isNaN(posY)) {
            return tokensAtuais;
        }

        const novosTokens = [...tokensAtuais];
        const tokenReferencia = tokensAtuais[tokenSendoArrastado.indice];

        if (!tokenReferencia) {
            return tokensAtuais;
        }

        if (isGroupDrag && indicesGrupo.length > 0) {
            const deltaX = posX - tokenReferencia.x;
            const deltaY = posY - tokenReferencia.y;

            if (isNaN(deltaX) || isNaN(deltaY)) {
                return tokensAtuais;
            }

            if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                
                indicesGrupo.forEach((indice, idx) => {
                    if (novosTokens[indice]) {
                        const token = novosTokens[indice];
                        const novaX = token.x + deltaX;
                        const novaY = token.y + deltaY;
                        
                        // Limita cada token do grupo individualmente
                        const posicaoLimitada = limitarPosicaoAoMundo(novaX, novaY, token);
                        
                        novosTokens[indice] = {
                            ...token,
                            x: posicaoLimitada.x,
                            y: posicaoLimitada.y
                        };
                    }
                });
            }
        } else {
            const token = novosTokens[tokenSendoArrastado.indice];
            
            // Limita a posição do token individual ao mundo
            const posicaoLimitada = limitarPosicaoAoMundo(posX, posY, token);
            
            novosTokens[tokenSendoArrastado.indice] = {
                ...token,
                x: posicaoLimitada.x,
                y: posicaoLimitada.y
            };
        }

        return novosTokens;
    }, [limitarPosicaoAoMundo]);

    return { processarArrastoToken };
}