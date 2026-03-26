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
        console.log('🔄 [useMovimentoToken] processarArrastoToken - INÍCIO');
        
        // Verifica se o item sendo arrastado existe
        if (!itemSendoArrastado) {
            console.log('   ❌ itemSendoArrastado é nulo');
            return itemsAtuais;
        }
        
        // Extrai o item (pode ser token ou camada)
        // A estrutura pode ser { token: {...}, ... } ou { camada: {...}, ... }
        const item = itemSendoArrastado.token || itemSendoArrastado.camada;
        const indice = itemSendoArrastado.indice;
        const tipo = item?.tipo || 'token';
        
        if (!item) {
            console.log('   ❌ item não encontrado em itemSendoArrastado');
            return itemsAtuais;
        }

        console.log('   item:', {
            tipo: tipo,
            indice: indice,
            nome: item.nome || (tipo === 'nevoa' ? 'Névoa' : 'Token'),
            id: item.id
        });
        console.log('   offsetArrasto:', { x: offsetArrasto.x.toFixed(2), y: offsetArrasto.y.toFixed(2) });
        console.log('   zoom:', zoom.toFixed(4));
        console.log('   position camera:', { x: position.x.toFixed(2), y: position.y.toFixed(2) });

        if (typeof offsetArrasto.x !== 'number' || typeof offsetArrasto.y !== 'number' ||
            isNaN(offsetArrasto.x) || isNaN(offsetArrasto.y)) {
            console.log('   ❌ offsetArrasto inválido');
            return itemsAtuais;
        }

        // Converte posição do mouse para coordenadas do mundo
        const mundo = {
            mundoX: (mouseX - position.x) / zoom,
            mundoY: (mouseY - position.y) / zoom
        };

        console.log('   mouse (mundo):', { x: mundo.mundoX.toFixed(2), y: mundo.mundoY.toFixed(2) });

        if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
            console.log('   ❌ mundo inválido');
            return itemsAtuais;
        }

        // Converte offset de pixels para unidades do mundo
        const offsetMundoX = offsetArrasto.x / zoom;
        const offsetMundoY = offsetArrasto.y / zoom;
        
        console.log('   offset (mundo):', { x: offsetMundoX.toFixed(2), y: offsetMundoY.toFixed(2) });

        // Calcula nova posição
        const posX = mundo.mundoX - offsetMundoX;
        const posY = mundo.mundoY - offsetMundoY;

        console.log('   nova posição (mundo - sem limite):', { x: posX.toFixed(2), y: posY.toFixed(2) });

        if (isNaN(posX) || isNaN(posY)) {
            console.log('   ❌ posição inválida');
            return itemsAtuais;
        }

        // Cria cópia do array
        const novosItems = [...itemsAtuais];
        const itemReferencia = novosItems[indice];

        if (!itemReferencia) {
            console.log('   ❌ itemReferencia não encontrado no índice', indice);
            console.log('   itemsAtuais:', itemsAtuais.map(i => ({ id: i.id, tipo: i.tipo })));
            return itemsAtuais;
        }

        console.log('   itemReferencia posição atual:', { x: itemReferencia.x.toFixed(2), y: itemReferencia.y.toFixed(2) });

        // Movimento em grupo
        if (isGroupDrag && indicesGrupo.length > 0) {
            const deltaX = posX - itemReferencia.x;
            const deltaY = posY - itemReferencia.y;

            console.log('   GRUPO - delta:', { x: deltaX.toFixed(2), y: deltaY.toFixed(2) });

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
                        
                        console.log(`   item grupo ${i} (indice ${idx}) nova pos:`, { 
                            x: posicaoLimitada.x.toFixed(2), 
                            y: posicaoLimitada.y.toFixed(2) 
                        });
                    }
                });
            }
        } else {
            // Movimento individual
            const posicaoLimitada = limitarPosicaoAoMundo(posX, posY, itemReferencia);
            
            console.log('   item individual - posição limitada:', { 
                x: posicaoLimitada.x.toFixed(2), 
                y: posicaoLimitada.y.toFixed(2) 
            });
            
            novosItems[indice] = {
                ...itemReferencia,
                x: posicaoLimitada.x,
                y: posicaoLimitada.y
            };
        }

        console.log('🔄 [useMovimentoToken] processarArrastoToken - FIM');
        
        return novosItems;
    }, [limitarPosicaoAoMundo]);

    return { processarArrastoToken };
}