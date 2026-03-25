// components/Tabletop/ConstantesBolinhas.jsx
export const CONFIG_BOLINHAS = {
    // Tamanho da bolinha em PIXELS NA TELA (fixo)
    TAMANHO_BOLINHA_TELA: 20,
    
    // Distância da borda em PIXELS NO MUNDO (quando zoom = 1)
    DISTANCIA_EXTERNA_MUNDO: 8,
    
    // Padding extra para detecção (em pixels na tela)
    PADRAO_DETECCAO_TELA: 4
};

// Função auxiliar para calcular distância externa em tela
export function getDistanciaExternaTela(zoom) {
    // Distância em pixels no mundo convertida para tela
    return CONFIG_BOLINHAS.DISTANCIA_EXTERNA_MUNDO * zoom;
}

// Função auxiliar para calcular raio da bolinha em tela
export function getRaioBolinhaTela() {
    return CONFIG_BOLINHAS.TAMANHO_BOLINHA_TELA / 2;
}

// Função auxiliar para calcular raio de detecção em tela
export function getRaioDetecaoTela(zoom) {
    const raioBolinha = getRaioBolinhaTela();
    const paddingTela = CONFIG_BOLINHAS.PADRAO_DETECCAO_TELA;
    return raioBolinha + paddingTela;
}