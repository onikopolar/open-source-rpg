// src/components/Tabletop/useSelecaoToken.jsx
import { useCallback } from "react";
import { TOLERANCIA_CLIQUE } from "./ConstantesMesa";

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
        if (tokenBloqueado) return null;

        const TAMANHO_BOLINHA = Math.max(8, 16 * uiState.zoom);
        const DISTANCIA_EXTERNA = Math.max(4, 8 * Math.min(uiState.zoom, 1));
        const RAIO = TAMANHO_BOLINHA / 2;

        const DETECT_MULTIPLIER = 1.5;
        const DETECT_RAIO = RAIO * DETECT_MULTIPLIER;

        const posicoes = [
            { nome: 'se', x: tokenTelaX + larguraTela + DISTANCIA_EXTERNA, y: tokenTelaY + alturaTela + DISTANCIA_EXTERNA },
            { nome: 'sw', x: tokenTelaX - DISTANCIA_EXTERNA, y: tokenTelaY + alturaTela + DISTANCIA_EXTERNA },
            { nome: 'ne', x: tokenTelaX + larguraTela + DISTANCIA_EXTERNA, y: tokenTelaY - DISTANCIA_EXTERNA },
            { nome: 'nw', x: tokenTelaX - DISTANCIA_EXTERNA, y: tokenTelaY - DISTANCIA_EXTERNA }
        ];

        for (const bolinha of posicoes) {
            if (mouseX >= (bolinha.x - DETECT_RAIO) && mouseX <= (bolinha.x + DETECT_RAIO) &&
                mouseY >= (bolinha.y - DETECT_RAIO) && mouseY <= (bolinha.y + DETECT_RAIO)) {
                return bolinha.nome;
            }
        }
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

    return { verificarSeMouseSobreToken, verificarSeMousePodeRedimensionar, tokenEstaNaAreaSelecao };
}