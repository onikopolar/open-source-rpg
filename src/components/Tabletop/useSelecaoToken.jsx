// components/Tabletop/useSelecaoToken.jsx
import { useCallback } from "react";
import { TOLERANCIA_CLIQUE } from "./ConstantesMesa";
import { anguloRotacaoCanvas } from "./useRotacaoToken";

// Tamanhos fixos em pixels na tela - não escalam com zoom
export const CONFIG_BOLINHAS = {
    TAMANHO_BOLINHA_TELA: 32,
    DISTANCIA_EXTERNA_TELA: 4,
    PADDING_DETECCAO_TELA: 12
};

// Calcula posições das 4 bolinhas nos cantos do token
export function calcularPosicoesBolinhas(tokenTelaX, tokenTelaY, larguraTela, alturaTela, zoom, rotacao = 0) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // Escala com raiz do zoom: bolas pequenas em zoom out, grandes em zoom in
    // clamp entre 0.5 e 2.0 pra não ficar nem invisível nem gigante
    const escalaZoom = Math.min(2.0, Math.max(0.5, Math.sqrt(zoom)));
    const TAMANHO_BOLINHA_TELA = (isMobile ? 24 : 18) * escalaZoom;
    // Mobile: bolinhas mais afastadas do token (dedo grosso precisa de
    // espaço pra não acertar o corpo do token e iniciar arrasto em vez
    // de redimensionamento). Desktop: precisão do mouse, 4px basta.
    const DISTANCIA_EXTERNA_TELA = isMobile
        ? Math.max(12, TAMANHO_BOLINHA_TELA * 0.6)
        : CONFIG_BOLINHAS.DISTANCIA_EXTERNA_TELA;
    
    const raioBolinha = TAMANHO_BOLINHA_TELA / 2;
    const distanciaExternaTela = DISTANCIA_EXTERNA_TELA;
    // Detecção: mobile com padding extra (dedo treme), desktop preciso
    // Visual SEMPRE = raioBolinha, mas detecção pode ser um pouco maior no mobile
    const raioDetecao = isMobile ? raioBolinha + 8 : raioBolinha + 4;

    const posicoes = [
        { nome: 'SE', x: tokenTelaX + larguraTela + distanciaExternaTela, y: tokenTelaY + alturaTela + distanciaExternaTela },
        { nome: 'SW', x: tokenTelaX - distanciaExternaTela, y: tokenTelaY + alturaTela + distanciaExternaTela },
        { nome: 'NE', x: tokenTelaX + larguraTela + distanciaExternaTela, y: tokenTelaY - distanciaExternaTela },
        { nome: 'NW', x: tokenTelaX - distanciaExternaTela, y: tokenTelaY - distanciaExternaTela }
    ];

    // Gira as posições das bolinhas junto com a rotação do token
    if (rotacao !== 0 && rotacao !== undefined) {
        const cx = tokenTelaX + larguraTela / 2;
        const cy = tokenTelaY + alturaTela / 2;
        const angulo = anguloRotacaoCanvas(rotacao, 'selecao');
        const cos = Math.cos(angulo);
        const sin = Math.sin(angulo);
        for (const p of posicoes) {
            const dx = p.x - cx;
            const dy = p.y - cy;
            p.x = cx + dx * cos - dy * sin;
            p.y = cy + dx * sin + dy * cos;
        }
    }

    return {
        posicoes,
        raioBolinha,
        raioDetecao,
        distanciaExternaTela,
        tamanhoBolinhaTela: TAMANHO_BOLINHA_TELA
    };
}

// Calcula retângulo que contém todos os itens selecionados
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
    // Retorna token sob o cursor
    const verificarSeMouseSobreToken = useCallback((mouseX, mouseY, modo = 'esquerdo') => {
        // Ordena por zIndex decrescente (topo primeiro) para detecção correta
        const ordenado = [...tokensComInfo].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

        for (const token of ordenado) {
            if (modo === 'esquerdo' && token.bloqueado) continue;

            const dentro = calcularSeMouseEstaDentro(
                mouseX, mouseY,
                token.posicaoTela.x, token.posicaoTela.y,
                token.tamanhoTela.larguraTela, token.tamanhoTela.alturaTela
            );

            if (dentro) {
                return {
                    token: tokensState[token.indice],
                    indice: token.indice,
                    ...token.tamanhoTela,
                    telaX: token.posicaoTela.x,
                    telaY: token.posicaoTela.y,
                    bloqueado: token.bloqueado
                };
            }
        }
        return null;
    }, [tokensComInfo, tokensState, calcularSeMouseEstaDentro]);

    // Verifica se token está dentro da área de seleção por arrasto
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
        tokenEstaNaAreaSelecao,
        calcularBoundingBoxGrupo
    };
}