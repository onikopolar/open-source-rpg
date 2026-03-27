// components/Tabletop/useMovimentoToken.jsx
import { useCallback } from "react";
import { WORLD_WIDTH, WORLD_HEIGHT } from "./ConstantesMesa";

export function useMovimentoToken() {
    const limitarPosicaoAoMundo = useCallback((x, y, item) => {
        if (!item) {
            return { x, y };
        }

        const larguraOriginal = item.larguraOriginal || 50;
        const alturaOriginal = item.alturaOriginal || 50;
        const escala = item.escala || 1;

        const larguraItem = larguraOriginal * escala;
        const alturaItem = alturaOriginal * escala;

        const xMin = 0;
        const xMax = WORLD_WIDTH - larguraItem;
        const yMin = 0;
        const yMax = WORLD_HEIGHT - alturaItem;

        const xLimitado = Math.min(Math.max(x, xMin), xMax);
        const yLimitado = Math.min(Math.max(y, yMin), yMax);

        return { x: xLimitado, y: yLimitado };
    }, []);

    const processarArrastoToken = useCallback((
        mouseX,
        mouseY,
        itemSendoArrastado,
        offsetArrasto,
        itemsAtuais,
        zoom,
        position,
        isGroupDrag = false,
        indicesGrupo = []
    ) => {
        // Verifica se o item sendo arrastado existe
        if (!itemSendoArrastado) {
            return itemsAtuais;
        }
        
        // Extrai o item (pode ser token ou camada)
        // A estrutura pode ser { token: {...}, ... } ou { camada: {...}, ... }
        const item = itemSendoArrastado.token || itemSendoArrastado.camada;
        const indice = itemSendoArrastado.indice;
        const tipo = item?.tipo || 'token';
        
        if (!item) {
            return itemsAtuais;
        }

        if (typeof offsetArrasto.x !== 'number' || typeof offsetArrasto.y !== 'number' ||
            isNaN(offsetArrasto.x) || isNaN(offsetArrasto.y)) {
            return itemsAtuais;
        }

        // Converte posição do mouse para coordenadas do mundo
        const mundo = {
            mundoX: (mouseX - position.x) / zoom,
            mundoY: (mouseY - position.y) / zoom
        };

        if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
            return itemsAtuais;
        }

        // Converte offset de pixels para unidades do mundo
        const offsetMundoX = offsetArrasto.x / zoom;
        const offsetMundoY = offsetArrasto.y / zoom;

        // Calcula nova posição
        const posX = mundo.mundoX - offsetMundoX;
        const posY = mundo.mundoY - offsetMundoY;

        if (isNaN(posX) || isNaN(posY)) {
            return itemsAtuais;
        }

        // Cria cópia do array
        const novosItems = [...itemsAtuais];
        const itemReferencia = novosItems[indice];

        if (!itemReferencia) {
            return itemsAtuais;
        }

        // Movimento em grupo
        if (isGroupDrag && indicesGrupo.length > 0) {
            const deltaX = posX - itemReferencia.x;
            const deltaY = posY - itemReferencia.y;

            if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                indicesGrupo.forEach((idx, i) => {
                    if (novosItems[idx]) {
                        const itemAtual = novosItems[idx];
                        const novaX = itemAtual.x + deltaX;
                        const novaY = itemAtual.y + deltaY;
                        
                        const posicaoLimitada = limitarPosicaoAoMundo(novaX, novaY, itemAtual);
                        
                        novosItems[idx] = {
                            ...itemAtual,
                            x: posicaoLimitada.x,
                            y: posicaoLimitada.y
                        };
                    }
                });
            }
        } else {
            // Movimento individual
            const posicaoLimitada = limitarPosicaoAoMundo(posX, posY, itemReferencia);
            
            novosItems[indice] = {
                ...itemReferencia,
                x: posicaoLimitada.x,
                y: posicaoLimitada.y
            };
        }
        
        return novosItems;
    }, [limitarPosicaoAoMundo]);

    return { processarArrastoToken };
}