// src/components/Tabletop/useMovimentoToken.jsx
import { useCallback } from "react";
import { WORLD_WIDTH, WORLD_HEIGHT } from "./ConstantesMesa";

export function useMovimentoToken() {
    console.log('🏭 [useMovimentoToken] Hook inicializado');
    console.log('📏 WORLD_WIDTH:', WORLD_WIDTH, 'WORLD_HEIGHT:', WORLD_HEIGHT);

    // Função auxiliar para limitar posição do token ao mundo
    const limitarPosicaoAoMundo = useCallback((x, y, token) => {
        console.log('🚦 [limitarPosicaoAoMundo] ========================================');
        console.log('🚦 [limitarPosicaoAoMundo] ENTRANDO NA FUNÇÃO');
        console.log('   Input:', { x, y, token: token?.nome, tokenId: token?.id });
        
        if (!token) {
            console.log('   ❌ Token inválido, retornando sem limites');
            return { x, y };
        }

        const larguraOriginal = token.larguraOriginal || 50;
        const alturaOriginal = token.alturaOriginal || 50;
        const escala = token.escala || 1;
        
        console.log('   📐 Dimensões do token:', {
            larguraOriginal,
            alturaOriginal,
            escala,
            larguraFinal: larguraOriginal * escala,
            alturaFinal: alturaOriginal * escala
        });

        const larguraToken = larguraOriginal * escala;
        const alturaToken = alturaOriginal * escala;

        const xMin = 0;
        const xMax = WORLD_WIDTH - larguraToken;
        const yMin = 0;
        const yMax = WORLD_HEIGHT - alturaToken;

        console.log('   📏 Limites do mundo:');
        console.log('      X:', { min: xMin, max: xMax, intervalo: xMax - xMin });
        console.log('      Y:', { min: yMin, max: yMax, intervalo: yMax - yMin });

        // LOGS ESPECÍFICOS PARA DIREITA/INFERIOR
        if (x > xMax) {
            console.log('🔥🔥🔥 [DIREITA] Tentando passar do limite!');
            console.log('   x atual:', x.toFixed(2));
            console.log('   xMax:', xMax.toFixed(2));
            console.log('   diferença:', (x - xMax).toFixed(2));
            console.log('   larguraToken:', larguraToken);
            console.log('   WORLD_WIDTH:', WORLD_WIDTH);
            console.log('   xMax calculado = WORLD_WIDTH - larguraToken =', WORLD_WIDTH, '-', larguraToken, '=', xMax);
        }

        if (y > yMax) {
            console.log('🔥🔥🔥 [INFERIOR] Tentando passar do limite!');
            console.log('   y atual:', y.toFixed(2));
            console.log('   yMax:', yMax.toFixed(2));
            console.log('   diferença:', (y - yMax).toFixed(2));
            console.log('   alturaToken:', alturaToken);
            console.log('   WORLD_HEIGHT:', WORLD_HEIGHT);
            console.log('   yMax calculado = WORLD_HEIGHT - alturaToken =', WORLD_HEIGHT, '-', alturaToken, '=', yMax);
        }

        console.log('   🔄 Aplicando Math.min/Math.max:');
        console.log('      x original:', x.toFixed(2));
        console.log('      x depois de Math.max(x, xMin):', Math.max(x, xMin).toFixed(2));
        console.log('      x depois de Math.min(..., xMax):', Math.min(Math.max(x, xMin), xMax).toFixed(2));
        
        console.log('      y original:', y.toFixed(2));
        console.log('      y depois de Math.max(y, yMin):', Math.max(y, yMin).toFixed(2));
        console.log('      y depois de Math.min(..., yMax):', Math.min(Math.max(y, yMin), yMax).toFixed(2));
        
        const xLimitado = Math.min(Math.max(x, xMin), xMax);
        const yLimitado = Math.min(Math.max(y, yMin), yMax);

        console.log('   ✅ Resultado final:');
        console.log('      original:', { x: x.toFixed(2), y: y.toFixed(2) });
        console.log('      limitado:', { x: xLimitado.toFixed(2), y: yLimitado.toFixed(2) });

        // LOG DETALHADO
        console.log('🔒 [limitarPosicaoAoMundo] RESUMO:', {
            token: token.nome,
            original: { x: x.toFixed(2), y: y.toFixed(2) },
            limitado: { x: xLimitado.toFixed(2), y: yLimitado.toFixed(2) },
            tamanhoToken: { largura: larguraToken.toFixed(2), altura: alturaToken.toFixed(2) },
            limites: { 
                x: `${xMin.toFixed(2)} a ${xMax.toFixed(2)}`, 
                y: `${yMin.toFixed(2)} a ${yMax.toFixed(2)}` 
            },
            WORLD_WIDTH,
            WORLD_HEIGHT,
            passouDireita: x > xMax,
            passouEsquerda: x < xMin,
            passouCima: y < yMin,
            passouBaixo: y > yMax
        });

        // Se os valores foram limitados, avisa
        if (x !== xLimitado || y !== yLimitado) {
            console.log('⚠️ Token foi LIMITADO!');
            console.log('   Diferença X:', (x - xLimitado).toFixed(2));
            console.log('   Diferença Y:', (y - yLimitado).toFixed(2));
            
            if (x > xMax) {
                console.log('   ⬅️ LIMITADO NA DIREITA! De', x.toFixed(2), 'para', xLimitado.toFixed(2));
            }
            if (x < xMin) {
                console.log('   ➡️ LIMITADO NA ESQUERDA! De', x.toFixed(2), 'para', xLimitado.toFixed(2));
            }
            if (y > yMax) {
                console.log('   ⬆️ LIMITADO NO INFERIOR! De', y.toFixed(2), 'para', yLimitado.toFixed(2));
            }
            if (y < yMin) {
                console.log('   ⬇️ LIMITADO NO SUPERIOR! De', y.toFixed(2), 'para', yLimitado.toFixed(2));
            }
        }

        console.log('🚦 [limitarPosicaoAoMundo] SAINDO DA FUNÇÃO, retornando:', { x: xLimitado, y: yLimitado });
        console.log('🚦 [limitarPosicaoAoMundo] ========================================\n');
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
        console.log('🔄 [processarArrastoToken] ===== INÍCIO =====');
        console.log('📥 Parâmetros recebidos:');
        console.log('   mouse:', { mouseX, mouseY });
        console.log('   tokenSendoArrastado:', tokenSendoArrastado);
        console.log('   offsetArrasto:', offsetArrasto);
        console.log('   tokensAtuais.length:', tokensAtuais?.length);
        console.log('   zoom:', zoom);
        console.log('   position:', position);
        console.log('   isGroupDrag:', isGroupDrag);
        console.log('   indicesGrupo:', indicesGrupo);

        if (!tokenSendoArrastado || !tokenSendoArrastado.token) {
            console.log('❌ [processarArrastoToken] Token inválido');
            return tokensAtuais;
        }

        if (typeof offsetArrasto.x !== 'number' || typeof offsetArrasto.y !== 'number' ||
            isNaN(offsetArrasto.x) || isNaN(offsetArrasto.y)) {
            console.log('❌ [processarArrastoToken] Offset inválido');
            return tokensAtuais;
        }

        console.log('🧮 Calculando posição no mundo:');
        console.log('   mouse - position:', { 
            mouseX: mouseX.toFixed(2), 
            positionX: position.x.toFixed(2), 
            diffX: (mouseX - position.x).toFixed(2) 
        });
        console.log('   dividido por zoom:', zoom);

        const mundo = {
            mundoX: (mouseX - position.x) / zoom,
            mundoY: (mouseY - position.y) / zoom
        };

        console.log('   mundo calculado:', { 
            mundoX: mundo.mundoX.toFixed(2), 
            mundoY: mundo.mundoY.toFixed(2) 
        });

        if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
            console.log('❌ [processarArrastoToken] Mundo inválido');
            return tokensAtuais;
        }

        console.log('🧮 Aplicando offset:');
        console.log('   offset / zoom:', { 
            offsetX: offsetArrasto.x, 
            offsetY: offsetArrasto.y,
            zoom: zoom,
            resultadoX: (offsetArrasto.x / zoom).toFixed(2),
            resultadoY: (offsetArrasto.y / zoom).toFixed(2)
        });

        const posX = mundo.mundoX - (offsetArrasto.x / zoom);
        const posY = mundo.mundoY - (offsetArrasto.y / zoom);

        console.log('   posição final (sem limites):', { 
            posX: posX.toFixed(2), 
            posY: posY.toFixed(2) 
        });

        if (isNaN(posX) || isNaN(posY)) {
            console.log('❌ [processarArrastoToken] Posição inválida');
            return tokensAtuais;
        }

        const novosTokens = [...tokensAtuais];
        const tokenReferencia = tokensAtuais[tokenSendoArrastado.indice];

        if (!tokenReferencia) {
            console.log('❌ [processarArrastoToken] Token referência não encontrado. Índice:', tokenSendoArrastado.indice);
            return tokensAtuais;
        }

        console.log('📌 Token referência:', {
            nome: tokenReferencia.nome,
            id: tokenReferencia.id,
            posAtual: { x: tokenReferencia.x.toFixed(2), y: tokenReferencia.y.toFixed(2) }
        });

        if (isGroupDrag && indicesGrupo.length > 0) {
            console.log('👥 [processarArrastoToken] Modo GRUPO ativado');
            const deltaX = posX - tokenReferencia.x;
            const deltaY = posY - tokenReferencia.y;

            console.log('   delta calculado:', { deltaX: deltaX.toFixed(2), deltaY: deltaY.toFixed(2) });

            if (isNaN(deltaX) || isNaN(deltaY)) {
                console.log('❌ [processarArrastoToken] Delta inválido');
                return tokensAtuais;
            }

            if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                console.log('   Movimento significativo detectado, processando grupo...');
                console.log('   Índices do grupo:', indicesGrupo);
                
                indicesGrupo.forEach((indice, idx) => {
                    console.log(`   Processando token ${idx + 1}/${indicesGrupo.length} (índice ${indice})`);
                    if (novosTokens[indice]) {
                        const token = novosTokens[indice];
                        const novaX = token.x + deltaX;
                        const novaY = token.y + deltaY;
                        
                        console.log(`      Token: ${token.nome}`);
                        console.log(`      Posição atual: (${token.x.toFixed(2)}, ${token.y.toFixed(2)})`);
                        console.log(`      Nova posição (antes limite): (${novaX.toFixed(2)}, ${novaY.toFixed(2)})`);
                        
                        // Limita cada token do grupo individualmente
                        const posicaoLimitada = limitarPosicaoAoMundo(novaX, novaY, token);
                        
                        console.log(`      Posição após limite: (${posicaoLimitada.x.toFixed(2)}, ${posicaoLimitada.y.toFixed(2)})`);
                        
                        novosTokens[indice] = {
                            ...token,
                            x: posicaoLimitada.x,
                            y: posicaoLimitada.y
                        };
                    } else {
                        console.log(`      ⚠️ Token no índice ${indice} não encontrado`);
                    }
                });
            } else {
                console.log('   Movimento muito pequeno, ignorando');
            }
        } else {
            console.log('👤 [processarArrastoToken] Modo INDIVIDUAL');
            const token = novosTokens[tokenSendoArrastado.indice];
            console.log('   Token sendo arrastado:', {
                nome: token.nome,
                id: token.id,
                posAtual: { x: token.x.toFixed(2), y: token.y.toFixed(2) },
                novaPosSemLimite: { x: posX.toFixed(2), y: posY.toFixed(2) }
            });
            
            // Limita a posição do token individual ao mundo
            const posicaoLimitada = limitarPosicaoAoMundo(posX, posY, token);
            
            console.log('   Atualizando token no array...');
            novosTokens[tokenSendoArrastado.indice] = {
                ...token,
                x: posicaoLimitada.x,
                y: posicaoLimitada.y
            };
            console.log('   Token atualizado:', {
                nome: token.nome,
                novaPos: { x: posicaoLimitada.x.toFixed(2), y: posicaoLimitada.y.toFixed(2) }
            });
        }

        console.log('✅ [processarArrastoToken] ===== FIM =====, retornando novosTokens');
        return novosTokens;
    }, [limitarPosicaoAoMundo]);

    return { processarArrastoToken };
}