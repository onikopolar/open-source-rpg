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
        let img = imageCache.current.get(token.id);

        if (!img) {
            img = new Image();
            img.onload = () => {
                scheduleRender();
            };
            img.onerror = () => {
                console.log('Erro ao carregar imagem:', token.nome);
            };
            img.src = token.imagemUrl;
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

        if (!img.complete) {
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

        // ===== LÓGICA DE INVERSÃO =====
        const x = token.posicaoTela.x;
        const y = token.posicaoTela.y;
        const largura = token.tamanhoTela.larguraTela;
        const altura = token.tamanhoTela.alturaTela;

        if (token.invertido) {
            // Salva o estado atual do contexto
            context.save();
            
            // Move o contexto para o centro do token
            context.translate(x + largura / 2, y + altura / 2);
            
            // Aplica inversão horizontal (escala -1 no eixo X)
            context.scale(-1, 1);
            
            // Move de volta para a posição original
            context.translate(-(x + largura / 2), -(y + altura / 2));
            
            // Desenha a imagem invertida
            context.drawImage(img, x, y, largura, altura);
            
            // Restaura o contexto original
            context.restore();
        } else {
            // Desenha normalmente
            context.drawImage(img, x, y, largura, altura);
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

            // Para tokens em grupo, não desenha seleção individual
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