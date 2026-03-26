// components/Tabletop/useSelecaoToken.jsx
import { useCallback } from "react";
import { TOLERANCIA_CLIQUE } from "./ConstantesMesa";

// ===== CONSTANTES EXPORTADAS PARA REUSO NO DESENHO =====
// Agora em PIXELS NA TELA (fixo, não escala com zoom)
export const CONFIG_BOLINHAS = {
    TAMANHO_BOLINHA_TELA: 20,        // tamanho fixo em pixels na tela
    DISTANCIA_EXTERNA_TELA: 4,      // distância fixa em pixels da borda do token
    PADDING_DETECCAO_TELA: 4         // padding extra para detecção em pixels
};

// ===== FUNÇÃO PARA CALCULAR POSIÇÕES DAS BOLINHAS (AGORA COM TAMANHO FIXO NA TELA) =====
export function calcularPosicoesBolinhas(tokenTelaX, tokenTelaY, larguraTela, alturaTela, zoom) {
    const { TAMANHO_BOLINHA_TELA, DISTANCIA_EXTERNA_TELA, PADDING_DETECCAO_TELA } = CONFIG_BOLINHAS;
    
    // Tamanhos fixos em pixels na tela (não escalam com zoom)
    const raioBolinha = TAMANHO_BOLINHA_TELA / 2;
    const distanciaExternaTela = DISTANCIA_EXTERNA_TELA;
    const raioDetecao = raioBolinha + PADDING_DETECCAO_TELA;

    const posicoes = [
        { nome: 'SE', x: tokenTelaX + larguraTela + distanciaExternaTela, y: tokenTelaY + alturaTela + distanciaExternaTela },
        { nome: 'SW', x: tokenTelaX - distanciaExternaTela, y: tokenTelaY + alturaTela + distanciaExternaTela },
        { nome: 'NE', x: tokenTelaX + larguraTela + distanciaExternaTela, y: tokenTelaY - distanciaExternaTela },
        { nome: 'NW', x: tokenTelaX - distanciaExternaTela, y: tokenTelaY - distanciaExternaTela }
    ];

    return {
        posicoes,
        raioBolinha,
        raioDetecao,
        distanciaExternaTela,
        tamanhoBolinhaTela: TAMANHO_BOLINHA_TELA
    };
}

// ===== FUNÇÃO PARA CALCULAR BOUNDING BOX DO GRUPO =====
export function calcularBoundingBoxGrupo(itensSelecionados) {
    if (!itensSelecionados || itensSelecionados.length === 0) return null;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    itensSelecionados.forEach((item) => {
        minX = Math.min(minX, item.posicaoTela.x);
        minY = Math.min(minY, item.posicaoTela.y);
        maxX = Math.max(maxX, item.posicaoTela.x + item.tamanhoTela.larguraTela);
        maxY = Math.max(maxY, item.posicaoTela.y + item.tamanhoTela.alturaTela);
    });
    
    return {
        x: minX,
        y: minY,
        largura: maxX - minX,
        altura: maxY - minY
    };
}

export function useSelecaoToken(tokensState, tokensComInfo, uiState, calcularSeMouseEstaDentro) {
    const verificarSeMouseSobreToken = useCallback((mouseX, mouseY, modo = 'esquerdo') => {
        if (modo === 'esquerdo') {
            for (let i = tokensComInfo.length - 1; i >= 0; i--) {
                const token = tokensComInfo[i];
                if (token.bloqueado) continue;

                const dentro = calcularSeMouseEstaDentro(
                    mouseX, mouseY,
                    token.posicaoTela.x, token.posicaoTela.y,
                    token.tamanhoTela.larguraTela, token.tamanhoTela.alturaTela
                );

                if (dentro) {
                    return {
                        token: tokensState[i],
                        indice: i,
                        ...token.tamanhoTela,
                        telaX: token.posicaoTela.x,
                        telaY: token.posicaoTela.y,
                        bloqueado: token.bloqueado
                    };
                }
            }
            return null;
        }

        if (modo === 'direito') {
            for (let i = tokensComInfo.length - 1; i >= 0; i--) {
                const token = tokensComInfo[i];

                const dentro = calcularSeMouseEstaDentro(
                    mouseX, mouseY,
                    token.posicaoTela.x, token.posicaoTela.y,
                    token.tamanhoTela.larguraTela, token.tamanhoTela.alturaTela
                );

                if (dentro) {
                    return {
                        token: tokensState[i],
                        indice: i,
                        ...token.tamanhoTela,
                        telaX: token.posicaoTela.x,
                        telaY: token.posicaoTela.y,
                        bloqueado: token.bloqueado
                    };
                }
            }
            return null;
        }

        return null;
    }, [tokensComInfo, tokensState, calcularSeMouseEstaDentro]);

    const verificarSeMousePodeRedimensionar = useCallback((mouseX, mouseY, tokenTelaX, tokenTelaY, larguraTela, alturaTela, tokenBloqueado) => {
        const DEBUG = true; // Ativado para debug
        
        if (tokenBloqueado) {
            if (DEBUG) console.log(`🔍 [ResizeDetection] token bloqueado, retornando null`);
            return null;
        }

        if (DEBUG) {
            console.log(`🔍 [ResizeDetection] ===== INÍCIO =====`);
            console.log(`   mouse (tela): (${mouseX.toFixed(2)}, ${mouseY.toFixed(2)})`);
            console.log(`   token (tela): (${tokenTelaX.toFixed(2)}, ${tokenTelaY.toFixed(2)})`);
            console.log(`   larguraTela: ${larguraTela.toFixed(2)}, alturaTela: ${alturaTela.toFixed(2)}`);
            console.log(`   zoom: ${uiState.zoom.toFixed(4)}`);
        }

        const { posicoes, raioDetecao } = calcularPosicoesBolinhas(
            tokenTelaX, tokenTelaY, larguraTela, alturaTela, uiState.zoom
        );

        if (DEBUG) {
            console.log(`   raioDetecao: ${raioDetecao.toFixed(2)}`);
            console.log(`   posições calculadas:`);
            posicoes.forEach(p => {
                console.log(`      ${p.nome}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`);
            });
        }

        for (const bolinha of posicoes) {
            const dx = mouseX - bolinha.x;
            const dy = mouseY - bolinha.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);
            const dentro = distancia <= raioDetecao;
            
            if (DEBUG) {
                console.log(`   ${bolinha.nome}: dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)}, distância=${distancia.toFixed(2)} -> dentro? ${dentro}`);
            }
            
            if (dentro) {
                if (DEBUG) console.log(`✅ [ResizeDetection] BOLINHA ${bolinha.nome} DETECTADA!`);
                console.log(`🔍 [ResizeDetection] ===== FIM =====`);
                return bolinha.nome;
            }
        }

        if (DEBUG) console.log(`❌ [ResizeDetection] Nenhuma bolinha detectada`);
        console.log(`🔍 [ResizeDetection] ===== FIM =====`);
        return null;
    }, [uiState.zoom]);

    const tokenEstaNaAreaSelecao = useCallback((token, area) => {
        if (!area.ativo) return false;

        const x1 = Math.min(area.inicioX, area.fimX);
        const x2 = Math.max(area.inicioX, area.fimX);
        const y1 = Math.min(area.inicioY, area.fimY);
        const y2 = Math.max(area.inicioY, area.fimY);

        const tokenX1 = token.posicaoTela.x;
        const tokenY1 = token.posicaoTela.y;
        const tokenX2 = token.posicaoTela.x + token.tamanhoTela.larguraTela;
        const tokenY2 = token.posicaoTela.y + token.tamanhoTela.alturaTela;

        return !(tokenX2 < x1 || tokenX1 > x2 || tokenY2 < y1 || tokenY1 > y2);
    }, []);

    return { 
        verificarSeMouseSobreToken, 
        verificarSeMousePodeRedimensionar, 
        tokenEstaNaAreaSelecao,
        calcularBoundingBoxGrupo
    };
}