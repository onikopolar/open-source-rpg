// src/components/Tabletop/useRedimensionamentoToken.jsx
import { useCallback, useRef } from "react";
import { calcularNovaEscalaToken } from "./UtilitariosToken";

export function useRedimensionamentoToken() {
    const resizeStartStateRef = useRef(null);

    const processarRedimensionamento = useCallback((
        mouseX,
        mouseY,
        tokenRedimensionando,
        modoRedimensionamento,
        tamanhoInicial,
        boundingBoxGrupo,
        tokensAtuais,
        zoom,
        position,
        isGroupResize = false,
        indicesGrupo = []
    ) => {
        console.log('========== PROCESSAR REDIMENSIONAMENTO INICIADO ==========');
        console.log('Dados de entrada:', {
            mouseX,
            mouseY,
            tokenRedimensionando: tokenRedimensionando ? {
                indice: tokenRedimensionando.indice,
                isGroupResize: tokenRedimensionando.isGroupResize
            } : null,
            modoRedimensionamento,
            tamanhoInicial,
            boundingBoxGrupo,
            tokensAtuais: tokensAtuais?.length,
            zoom,
            position,
            isGroupResize,
            indicesGrupo
        });

        if (isGroupResize && indicesGrupo.length > 0) {
            console.log('CASO: REDIMENSIONAMENTO DE GRUPO');
            console.log('Índices do grupo:', indicesGrupo);

            // PRIMEIRO FRAME - Salvar estado inicial
            if (!resizeStartStateRef.current) {
                console.log('Primeiro frame - salvando estado inicial...');

                // Calcular bounding box do grupo
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                indicesGrupo.forEach(indice => {
                    const token = tokensAtuais[indice];
                    if (token) {
                        minX = Math.min(minX, token.x);
                        minY = Math.min(minY, token.y);
                        maxX = Math.max(maxX, token.x + (token.larguraOriginal * token.escala));
                        maxY = Math.max(maxY, token.y + (token.alturaOriginal * token.escala));
                    }
                });

                if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
                    console.log('ERRO: Não foi possível calcular o bounding box do grupo');
                    return tokensAtuais;
                }

                const centroX = minX + (maxX - minX) / 2;
                const centroY = minY + (maxY - minY) / 2;

                // Salvar estado inicial de cada token
                const estadoInicialTokens = {};
                indicesGrupo.forEach(indice => {
                    const token = tokensAtuais[indice];
                    if (token) {
                        estadoInicialTokens[indice] = {
                            x: token.x,
                            y: token.y,
                            escala: token.escala,
                            larguraOriginal: token.larguraOriginal,
                            alturaOriginal: token.alturaOriginal
                        };
                    }
                });

                resizeStartStateRef.current = {
                    mouseInicial: { x: mouseX, y: mouseY },
                    boundingBox: {
                        x: minX,
                        y: minY,
                        width: maxX - minX,
                        height: maxY - minY
                    },
                    centro: { x: centroX, y: centroY },
                    tokens: estadoInicialTokens
                };

                console.log('Estado inicial salvo:', resizeStartStateRef.current);
                return tokensAtuais;
            }

            // FRAMES SEGUINTES - Aplicar redimensionamento
            const estadoInicial = resizeStartStateRef.current;

            if (!estadoInicial || !estadoInicial.boundingBox) {
                console.log('ERRO: Estado inicial inválido');
                resizeStartStateRef.current = null;
                return tokensAtuais;
            }

            // Converter coordenadas do mouse para o mundo
            const mundo = {
                mundoX: (mouseX - position.x) / zoom,
                mundoY: (mouseY - position.y) / zoom
            };
            console.log('Coordenadas mundo:', mundo);

            if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
                console.log('ERRO: Coordenadas mundo inválidas');
                return tokensAtuais;
            }
            
            // Calcular a nova escala usando a função utilitária
            const escalaCalculada = calcularNovaEscalaToken(
                mundo.mundoX, mundo.mundoY,
                estadoInicial.boundingBox.x, 
                estadoInicial.boundingBox.y,
                estadoInicial.boundingBox.width,
                estadoInicial.boundingBox.height,
                modoRedimensionamento,
                { 
                    largura: estadoInicial.boundingBox.width, 
                    altura: estadoInicial.boundingBox.height 
                },
                4 // escalaMaxima = 4
            );

            console.log('Escala calculada via utilitário:', {
                escalaCalculada,
                direcao: escalaCalculada > 1 ? 'AUMENTANDO' : (escalaCalculada < 1 ? 'DIMINUINDO' : 'MANTENDO')
            });

            if (isNaN(escalaCalculada) || escalaCalculada <= 0) {
                console.log('ERRO: Escala calculada inválida');
                return tokensAtuais;
            }

            console.log('Aplicando transformação aos tokens do grupo...');

            const novosTokens = [...tokensAtuais];

            indicesGrupo.forEach(indice => {
                const tokenInicial = estadoInicial.tokens[indice];
                if (tokenInicial && novosTokens[indice]) {
                    // Posição relativa ao centro do grupo
                    const relX = tokenInicial.x - estadoInicial.centro.x;
                    const relY = tokenInicial.y - estadoInicial.centro.y;

                    // Nova posição mantendo a proporção relativa
                    const novoX = estadoInicial.centro.x + (relX * escalaCalculada);
                    const novoY = estadoInicial.centro.y + (relY * escalaCalculada);

                    // Nova escala (escala original * fator de escala)
                    const novaEscala = tokenInicial.escala * escalaCalculada;

                    console.log(`Token ${indice}:`, {
                        antes: {
                            x: tokenInicial.x.toFixed(2),
                            y: tokenInicial.y.toFixed(2),
                            escala: tokenInicial.escala.toFixed(4)
                        },
                        rel: {
                            x: relX.toFixed(2),
                            y: relY.toFixed(2)
                        },
                        depois: {
                            x: novoX.toFixed(2),
                            y: novoY.toFixed(2),
                            escala: novaEscala.toFixed(4)
                        }
                    });

                    novosTokens[indice] = {
                        ...novosTokens[indice],
                        x: novoX,
                        y: novoY,
                        escala: novaEscala
                    };
                }
            });

            console.log('Redimensionamento de grupo concluído com sucesso');
            console.log('========== FIM PROCESSAR REDIMENSIONAMENTO ==========\n');
            return novosTokens;
        }

        console.log('CASO: REDIMENSIONAMENTO INDIVIDUAL');

        if (!tokenRedimensionando || !tokenRedimensionando.token) {
            console.log('Token inválido para redimensionamento individual');
            return tokensAtuais;
        }

        console.log('Token sendo redimensionado:', {
            indice: tokenRedimensionando.indice,
            token: tokenRedimensionando.token
        });

        const mundo = {
            mundoX: (mouseX - position.x) / zoom,
            mundoY: (mouseY - position.y) / zoom
        };
        console.log('Coordenadas mundo:', mundo);

        if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
            console.log('ERRO: Coordenadas mundo inválidas');
            return tokensAtuais;
        }

        const novosTokens = [...tokensAtuais];
        const tokenAtual = tokensAtuais[tokenRedimensionando.indice];

        if (!tokenAtual) {
            console.log('Token atual não encontrado');
            return tokensAtuais;
        }

        console.log('Calculando nova escala para token individual...');
        const novaEscala = calcularNovaEscalaToken(
            mundo.mundoX, mundo.mundoY,
            tokenAtual.x, tokenAtual.y,
            tokenAtual.larguraOriginal || 50,
            tokenAtual.alturaOriginal || 50,
            modoRedimensionamento,
            tamanhoInicial
        );

        console.log('Nova escala calculada:', novaEscala);

        if (isNaN(novaEscala)) {
            console.log('novaEscala inválida');
            return tokensAtuais;
        }

        console.log(`Token ${tokenRedimensionando.indice}:`, {
            antes: { escala: tokenAtual.escala.toFixed(4) },
            depois: { escala: novaEscala.toFixed(4) },
            mudanca: (novaEscala - tokenAtual.escala).toFixed(4)
        });

        novosTokens[tokenRedimensionando.indice] = {
            ...novosTokens[tokenRedimensionando.indice],
            escala: novaEscala
        };

        console.log('Redimensionamento individual concluído');
        console.log('========== FIM PROCESSAR REDIMENSIONAMENTO ==========\n');
        return novosTokens;
    }, []);

    return { processarRedimensionamento, resizeStartStateRef };
}