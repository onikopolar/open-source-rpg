// src/components/Tabletop/useRenderizacaoToken.jsx
import { useCallback } from "react";
import { anguloRotacaoCanvas } from "./useRotacaoToken";

export function useRenderizacaoToken(
    uiState,
    imageCache,
    getCanvasContext,
    scheduleRender,
    desenharFallbackToken,
    desenharBordaDeArrasto,
    desenharSelecao,
    getDisplayPosition  // (tokenId) => {x, y} | null — interpolação OBR-style
) {
    /**
     * Desenha um token individual.
     * Se getDisplayPosition retornar posição interpolada para este token,
     * usa-a em vez de token.posicaoTela (interpolação suave OBR-style).
     */
    const drawSingleToken = useCallback((token, context, displayOverride) => {
        const imagemUrl = token.imageBase64 || token.imageUrl;

        // Posição de tela: usa override interpolado se disponível
        const screenX = displayOverride
            ? displayOverride.x * uiState.zoom + uiState.position.x
            : token.posicaoTela.x;
        const screenY = displayOverride
            ? displayOverride.y * uiState.zoom + uiState.position.y
            : token.posicaoTela.y;

        if (!imagemUrl) {
            desenharFallbackToken(
                context,
                screenX,
                screenY,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        let img = imageCache.current.get(token.id);

        // Se a imagem já falhou antes, não tenta recarregar — usa fallback
        if (img && img._failed) {
            desenharFallbackToken(
                context,
                screenX,
                screenY,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        if (!img) {
            img = new Image();
            img.onload = () => {
                scheduleRender();
            };
            img.onerror = () => {
                // Marca como falha para não entrar em loop de re-render
                img._failed = true;
                // NÃO agenda re-render — o fallback já está sendo exibido
            };
            img.src = imagemUrl;
            imageCache.current.set(token.id, img);

            desenharFallbackToken(
                context,
                screenX,
                screenY,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        if (!img.complete || img.naturalWidth === 0) {
            desenharFallbackToken(
                context,
                screenX,
                screenY,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        if (token.oculto) {
            context.globalAlpha = 0.3;
        }

        const largura = token.tamanhoTela.larguraTela;
        const altura = token.tamanhoTela.alturaTela;

        try {
            const precisaTransformar = token.invertido || (token.rotacao && token.rotacao !== 0);

            if (precisaTransformar) {
                context.save();
                context.translate(screenX + largura / 2, screenY + altura / 2);

                if (token.invertido) context.scale(-1, 1);
                if (token.rotacao && token.rotacao !== 0) {
                    context.rotate(anguloRotacaoCanvas(token.rotacao, 'token'));
                }

                context.translate(-largura / 2, -altura / 2);
                context.drawImage(img, 0, 0, largura, altura);
                context.restore();
            } else {
                context.drawImage(img, screenX, screenY, largura, altura);
            }
        } catch (error) {
            desenharFallbackToken(
                context,
                screenX,
                screenY,
                uiState.zoom,
                token.nome
            );
        }

        context.globalAlpha = 1.0;
        return true;
    }, [uiState.zoom, uiState.position, scheduleRender, desenharFallbackToken]);

    const drawTokenWithCache = useCallback((token, indice, context, displayOverride) => {
        if (!context) {
            context = getCanvasContext();
            if (!context) return;
        }

        drawSingleToken(token, context, displayOverride);

        if (uiState.tokenSendoArrastado?.indice === indice) {
            const nomeUsuario = uiState.ui.usuarioInteragindo;
            if (nomeUsuario) {
                // Para o token sendo arrastado localmente, usa posicaoTela original
                desenharBordaDeArrasto(
                    context,
                    token.posicaoTela.x,
                    token.posicaoTela.y,
                    token.tamanhoTela.larguraTela,
                    token.tamanhoTela.alturaTela,
                    nomeUsuario
                );
            }
        }
    }, [uiState, getCanvasContext, drawSingleToken, desenharBordaDeArrasto]);

    // Função para desenhar apenas os tokens (com seus efeitos de seleção/arrasto), sem névoa
    const renderizarTokens = useCallback((contexto, todosItens, tokensInfo, isMaster) => {
        if (!contexto) return;

        // Cópia ordenada por zIndex apenas para renderização — não afeta o array original
        // (índices em todosItens original são usados por desenharArrastoProprio/desenharSelecoes)
        const ordenado = [...todosItens].sort((a, b) => {
            if (a.tipo !== 'token' && b.tipo !== 'token') return 0;
            if (a.tipo !== 'token') return 1;
            if (b.tipo !== 'token') return -1;
            return (a.zIndex || 0) - (b.zIndex || 0);
        });

        for (let i = 0; i < ordenado.length; i++) {
            const item = ordenado[i];
            if (item.tipo === 'token') {
                if (!isMaster && item.oculto) continue;
                // Interpolação OBR-style: verifica se há posição display interpolada
                const displayOverride = getDisplayPosition ? getDisplayPosition(item.id) : null;
                drawTokenWithCache(item, item.indice, contexto, displayOverride);
            }
        }
    }, [drawTokenWithCache, getDisplayPosition]);

    return {
        drawTokenWithCache,     
        renderizarTokens      
    };
}