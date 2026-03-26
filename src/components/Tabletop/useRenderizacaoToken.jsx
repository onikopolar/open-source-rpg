// src/components/Tabletop/useRenderizacaoToken.jsx
import { useCallback } from "react";

export function useRenderizacaoToken(
    uiState, 
    imageCache, 
    getCanvasContext, 
    scheduleRender, 
    desenharFallbackToken, 
    desenharBordaDeArrasto, 
    desenharSelecao
) {
    const drawSingleToken = useCallback((token, context) => {
        // Verificar se tem imagem
        const imagemUrl = token.imagemUrl || token.imageUrl || token.imageBase64;
        
        if (!imagemUrl) {
            // Sem imagem, desenha fallback
            desenharFallbackToken(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        let img = imageCache.current.get(token.id);

        if (!img) {
            img = new Image();
            img.onload = () => {
                scheduleRender();
            };
            img.onerror = () => {
                console.log('[useRenderizacaoToken] Erro ao carregar imagem:', token.nome, imagemUrl);
                // Remove do cache para tentar recarregar depois
                imageCache.current.delete(token.id);
                scheduleRender();
            };
            img.src = imagemUrl;
            imageCache.current.set(token.id, img);

            desenharFallbackToken(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        // Verificar se a imagem foi carregada corretamente
        if (!img.complete || img.naturalWidth === 0) {
            desenharFallbackToken(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        if (token.oculto) {
            context.globalAlpha = 0.3;
        }

        const x = token.posicaoTela.x;
        const y = token.posicaoTela.y;
        const largura = token.tamanhoTela.larguraTela;
        const altura = token.tamanhoTela.alturaTela;

        try {
            if (token.invertido) {
                context.save();
                context.translate(x + largura / 2, y + altura / 2);
                context.scale(-1, 1);
                context.translate(-(x + largura / 2), -(y + altura / 2));
                context.drawImage(img, x, y, largura, altura);
                context.restore();
            } else {
                context.drawImage(img, x, y, largura, altura);
            }
        } catch (error) {
            console.error('[useRenderizacaoToken] Erro ao desenhar imagem:', error);
            desenharFallbackToken(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                uiState.zoom,
                token.nome
            );
        }

        context.globalAlpha = 1.0;
        
        return true;
    }, [uiState.zoom, scheduleRender, desenharFallbackToken]);

    const drawTokenWithCache = useCallback((token, indice, context) => {
        if (!context) {
            context = getCanvasContext();
            if (!context) return;
        }

        drawSingleToken(token, context);

        if (uiState.tokenSendoArrastado?.indice === indice) {
            desenharBordaDeArrasto(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                token.tamanhoTela.larguraTela,
                token.tamanhoTela.alturaTela,
                uiState.ui.usuarioInteragindo
            );
        }

        const tokenEstaSelecionado =
            uiState.tokenSelecionado === indice ||
            uiState.tokensSelecionados.includes(indice);

        if (tokenEstaSelecionado && !token.bloqueado && !uiState.tokenSendoArrastado) {
            const isPartOfGroup = uiState.tokensSelecionados.length > 1 &&
                uiState.tokensSelecionados.includes(indice);

            if (!isPartOfGroup) {
                const tokenParaSelecao = {
                    posicaoTela: token.posicaoTela,
                    tamanhoTela: token.tamanhoTela,
                    bloqueado: token.bloqueado
                };
                desenharSelecao(context, [tokenParaSelecao], uiState.zoom, 'individual', true);
            }
        }
    }, [uiState.zoom, uiState.tokenSendoArrastado, uiState.ui.usuarioInteragindo,
        uiState.tokenSelecionado, uiState.tokensSelecionados, getCanvasContext, drawSingleToken, desenharBordaDeArrasto, desenharSelecao]);

    return { drawTokenWithCache };
}