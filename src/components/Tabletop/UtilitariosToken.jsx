// FUNÇÕES UTILITÁRIAS DE TOKEN
import { clamp } from "./ConstantesMesa";

export const calcularNovaEscalaToken = (
    mouseWorldX, mouseWorldY,
    tokenX, tokenY,
    larguraBase, alturaBase,
    modo,
    tamanhoInicial,
    escalaMaxima = Infinity
) => {
    let novaLargura = tamanhoInicial.largura;
    let novaAltura = tamanhoInicial.altura;

    if (modo === 'se') {
        novaLargura = Math.max(10, mouseWorldX - tokenX);
        novaAltura = Math.max(10, mouseWorldY - tokenY);
    } else if (modo === 'sw') {
        novaLargura = Math.max(10, tokenX + larguraBase - mouseWorldX);
        novaAltura = Math.max(10, mouseWorldY - tokenY);
    } else if (modo === 'ne') {
        novaLargura = Math.max(10, mouseWorldX - tokenX);
        novaAltura = Math.max(10, tokenY + alturaBase - mouseWorldY);
    } else if (modo === 'nw') {
        novaLargura = Math.max(10, tokenX + larguraBase - mouseWorldX);
        novaAltura = Math.max(10, tokenY + alturaBase - mouseWorldY);
    }

    const escalaX = novaLargura / larguraBase;
    const escalaY = novaAltura / alturaBase;
    const menorEscala = Math.min(escalaX, escalaY);

    return clamp(menorEscala, 0.1, escalaMaxima);
};

// Função para calcular o bounding box de um grupo de tokens
export const calcularBoundingBoxGrupo = (tokens) => {
    if (!tokens || tokens.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    tokens.forEach(token => {
        minX = Math.min(minX, token.x);
        minY = Math.min(minY, token.y);
        maxX = Math.max(maxX, token.x + (token.larguraOriginal * token.escala));
        maxY = Math.max(maxY, token.y + (token.alturaOriginal * token.escala));
    });

    return {
        x: minX,
        y: minY,
        largura: maxX - minX,
        altura: maxY - minY,
        larguraBase: maxX - minX,
        alturaBase: maxY - minY
    };
};

export const trazerTokenParaFrente = (tokens, indiceToken) => {
    if (indiceToken < 0 || indiceToken >= tokens.length) {
        return tokens;
    }

    const novosTokens = [...tokens];
    const [tokenSelecionado] = novosTokens.splice(indiceToken, 1);
    novosTokens.push(tokenSelecionado);

    return novosTokens;
};