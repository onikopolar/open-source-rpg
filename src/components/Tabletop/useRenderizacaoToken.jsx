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
        console.log('[useRenderizacaoToken] drawSingleToken - token:', token.id, 'nome:', token.nome);
        console.log('[useRenderizacaoToken] imageUrl:', token.imageUrl);
        console.log('[useRenderizacaoToken] imageBase64:', token.imageBase64 ? 'presente' : 'ausente');
        
        const imagemUrl = token.imageUrl || token.imageBase64;
        
        console.log('[useRenderizacaoToken] imagemUrl final:', imagemUrl ? imagemUrl.substring(0, 100) : 'null');
        
        if (!imagemUrl) {
            console.log('[useRenderizacaoToken] Sem imagem, desenhando fallback');
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
            console.log('[useRenderizacaoToken] Carregando imagem do cache:', token.id);
            img = new Image();
            img.onload = () => {
                console.log('[useRenderizacaoToken] Imagem carregada com sucesso:', token.id);
                scheduleRender();
            };
            img.onerror = (error) => {
                console.log('[useRenderizacaoToken] Erro ao carregar imagem:', token.nome, imagemUrl, error);
                imageCache.current.delete(token.id);
                scheduleRender();
            };
            img.src = imagemUrl;
            imageCache.current.set(token.id, img);

            console.log('[useRenderizacaoToken] Desenhando fallback enquanto carrega');
            desenharFallbackToken(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        if (!img.complete || img.naturalWidth === 0) {
            console.log('[useRenderizacaoToken] Imagem ainda não carregada ou inválida:', token.id);
            desenharFallbackToken(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        console.log('[useRenderizacaoToken] Desenhando imagem real:', token.id);
        
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
        console.log('[useRenderizacaoToken] drawTokenWithCache - token:', token.id, 'indice:', indice);
        
        if (!context) {
            context = getCanvasContext();
            if (!context) return;
        }

        drawSingleToken(token, context);

        if (uiState.tokenSendoArrastado?.indice === indice) {
            console.log('[useRenderizacaoToken] Desenhando borda de arrasto para token:', token.id);
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
                console.log('[useRenderizacaoToken] Desenhando seleção para token:', token.id);
                const tokenParaSelecao = {
                    posicaoTela: token.posicaoTela,
                    tamanhoTela: token.tamanhoTela,
                    bloqueado: token.bloqueado
                };
                desenharSelecao(context, [tokenParaSelecao], uiState.zoom, 'individual', true);
            }
        }
    }, [uiState, getCanvasContext, drawSingleToken, desenharBordaDeArrasto, desenharSelecao]);

    return { drawTokenWithCache };
}