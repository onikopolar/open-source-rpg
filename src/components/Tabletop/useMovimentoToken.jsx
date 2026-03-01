// src/components/Tabletop/useMovimentoToken.jsx
import { useCallback } from "react";

export function useMovimentoToken() {
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
        console.log('processarArrastoToken - Iniciando:', { isGroupDrag, indicesGrupo });

        if (!tokenSendoArrastado || !tokenSendoArrastado.token) {
            console.log('processarArrastoToken - Token inválido');
            return tokensAtuais;
        }

        if (typeof offsetArrasto.x !== 'number' || typeof offsetArrasto.y !== 'number' ||
            isNaN(offsetArrasto.x) || isNaN(offsetArrasto.y)) {
            console.log('processarArrastoToken - Offset inválido');
            return tokensAtuais;
        }

        const mundo = {
            mundoX: (mouseX - position.x) / zoom,
            mundoY: (mouseY - position.y) / zoom
        };

        if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
            console.log('processarArrastoToken - Mundo inválido');
            return tokensAtuais;
        }

        const posX = mundo.mundoX - (offsetArrasto.x / zoom);
        const posY = mundo.mundoY - (offsetArrasto.y / zoom);

        if (isNaN(posX) || isNaN(posY)) {
            console.log('processarArrastoToken - Posição inválida');
            return tokensAtuais;
        }

        const novosTokens = [...tokensAtuais];
        const tokenReferencia = tokensAtuais[tokenSendoArrastado.indice];

        if (!tokenReferencia) {
            console.log('processarArrastoToken - Token referência não encontrado');
            return tokensAtuais;
        }

        if (isGroupDrag && indicesGrupo.length > 0) {
            const deltaX = posX - tokenReferencia.x;
            const deltaY = posY - tokenReferencia.y;

            console.log('processarArrastoToken - Arrastando GRUPO, delta:', { deltaX, deltaY });

            if (isNaN(deltaX) || isNaN(deltaY)) {
                return tokensAtuais;
            }

            if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                indicesGrupo.forEach(indice => {
                    if (novosTokens[indice]) {
                        novosTokens[indice] = {
                            ...novosTokens[indice],
                            x: novosTokens[indice].x + deltaX,
                            y: novosTokens[indice].y + deltaY
                        };
                    }
                });
            }
        } else {
            console.log('processarArrastoToken - Arrastando token individual:', tokenSendoArrastado.indice);
            novosTokens[tokenSendoArrastado.indice] = {
                ...novosTokens[tokenSendoArrastado.indice],
                x: posX,
                y: posY
            };
        }

        return novosTokens;
    }, []);

    return { processarArrastoToken };
}