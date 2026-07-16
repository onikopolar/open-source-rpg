// src/components/Tabletop/HooksNovos/useImageDropPaste.jsx
import { useEffect, useCallback, useRef, useState } from 'react';
import DragDropSystem from '../../../utils/DragDropSystem';

/**
 * Hook que permite:
 * 1. Arrastar imagens do sistema de arquivos direto para o tabletop -> vira token
 * 2. Colar imagens (Ctrl+V) copiadas de qualquer lugar -> vira token
 *
 * O nome do token vem do nome do arquivo (drag) ou "Token colado" (paste).
 * O fluxo por tras usa o mesmo criarToken + emitirTokenCreated + P2P do modal.
 *
 * OTIMIZADO: executa base64, dimensoes (blob URL) e upload EM PARALELO.
 * Usa UI otimista: o token aparece na tela instantaneamente.
 * Redimensiona imagens grandes para caber no tabletop sem perder qualidade.
 */

// Dimensao maxima para o lado maior da imagem.
// Imagens acima disso sao redimensionadas proporcionalmente.
const MAX_DIMENSION = 800;

function extrairNomeDoArquivo(fileName) {
    const ultimoPonto = fileName.lastIndexOf('.');
    const nomeSemExtensao = ultimoPonto > 0 ? fileName.substring(0, ultimoPonto) : fileName;
    return nomeSemExtensao
        .replace(/[_\-]+/g, ' ')
        .replace(/^\d+[\s._\-]+/, '')
        .trim() || 'Token';
}

function blobParaBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo como base64'));
        reader.readAsDataURL(blob);
    });
}

function obterDimensoesImagem(srcUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ largura: img.naturalWidth, altura: img.naturalHeight });
        img.onerror = () => reject(new Error('Erro ao carregar imagem para obter dimensoes'));
        img.src = srcUrl;
    });
}

/**
 * Redimensiona uma imagem via canvas, mantendo proporcao.
 * Retorna novo base64, novas dimensoes e o mime type de saida.
 * Se nao precisa redimensionar, retorna os dados originais.
 *
 * Formatos suportados na saida:
 * - JPEG original -> JPEG (qualidade 0.9)
 * - PNG/GIF/WebP/outros -> PNG (lossless, suporta transparencia)
 */
function redimensionarSeNecessario(base64, largura, altura, mimeType) {
    if (largura <= MAX_DIMENSION && altura <= MAX_DIMENSION) {
        return { base64, largura, altura, mimeType };
    }

    const scale = MAX_DIMENSION / Math.max(largura, altura);
    const novaLargura = Math.round(largura * scale);
    const novaAltura = Math.round(altura * scale);

    // JPEG mantem formato original com compressao; outros viram PNG
    const formatoSaida = mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const qualidade = formatoSaida === 'image/jpeg' ? 0.9 : undefined;

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = novaLargura;
            canvas.height = novaAltura;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, novaLargura, novaAltura);
            resolve({
                base64: canvas.toDataURL(formatoSaida, qualidade),
                largura: novaLargura,
                altura: novaAltura,
                mimeType: formatoSaida,
            });
        };
        img.src = base64;
    });
}

function base64paraBlob(base64) {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bytes = atob(parts[1]);
    const buffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        buffer[i] = bytes.charCodeAt(i);
    }
    return new Blob([buffer], { type: mime });
}

async function uploadImagem(blobOrFile) {
    const formData = new FormData();
    formData.append('file', blobOrFile);
    formData.append('imagem', blobOrFile);

    const response = await fetch('/api/upload/token', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao fazer upload da imagem');
    }

    const data = await response.json();
    return data.url;
}

export function useImageDropPaste({
    isMaster,
    containerRef,
    criarToken,
    telaParaMundo,
    emitirTokenCreated,
    socket,
    onTokenCreated,       // chamado IMEDIATAMENTE (UI otimista) com token temporario
    onTokenConfirmed,     // chamado quando o servidor confirma: (tempId, tokenReal) => void
    onTokenImageReady,    // (tokenId, imageSource) => void — P2P
}) {
    /**
     * Processa um arquivo de imagem (File/Blob) e cria um token no tabletop.
     * 
     * OTIMIZADO: executa base64, dimensoes (blob URL) e upload EM PARALELO.
     * Usa UI otimista: o token aparece na tela instantaneamente,
     * depois eh atualizado com o ID real do banco.
     */
    const processarImagem = useCallback(async (file, nome, posicaoTela) => {
        try {
            // Fase 1: PARALELA - dimensoes (blob URL), base64 original, upload original
            const blobUrl = URL.createObjectURL(file);

            const [dimensoes, base64Original, imageUrlOriginal] = await Promise.all([
                obterDimensoesImagem(blobUrl).finally(() => URL.revokeObjectURL(blobUrl)),
                blobParaBase64(file),
                uploadImagem(file).catch(() => null),
            ]);

            let { largura, altura } = dimensoes;
            let base64 = base64Original;
            let imageUrl = imageUrlOriginal;
            let mimeType = file.type || 'image/png';

            // Fase 1.5: redimensiona se imagem for maior que MAX_DIMENSION
            if (largura > MAX_DIMENSION || altura > MAX_DIMENSION) {
                const redimensionada = await redimensionarSeNecessario(base64, largura, altura, mimeType);
                base64 = redimensionada.base64;
                largura = redimensionada.largura;
                altura = redimensionada.altura;
                mimeType = redimensionada.mimeType;

                // Faz upload da versao redimensionada
                const blobRedimensionado = base64paraBlob(base64);
                imageUrl = await uploadImagem(blobRedimensionado).catch(() => imageUrlOriginal);
            }

            // Fase 2: posicao + UI otimista (instantaneo)
            const rect = containerRef.current?.getBoundingClientRect();
            const clientX = posicaoTela?.clientX ?? (rect ? rect.left + rect.width / 2 : 400);
            const clientY = posicaoTela?.clientY ?? (rect ? rect.top + rect.height / 2 : 300);
            const mouseX = clientX - (rect?.left ?? 0);
            const mouseY = clientY - (rect?.top ?? 0);
            const mundo = telaParaMundo(mouseX, mouseY);

            const tempId = `temp-paste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const realTokenId = `direct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            const tokenOtimista = {
                id: tempId,
                tokenId: tempId,
                nome: nome || null,
                x: mundo.x - largura / 2,
                y: mundo.y - altura / 2,
                escala: 1.0,
                larguraOriginal: largura,
                alturaOriginal: altura,
                invertido: false,
                oculto: false,
                bloqueado: false,
                imageUrl: imageUrl,
                imageBase64: base64,
                mimeType: mimeType,
                parentId: '__direct__',
                zIndex: 999999,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                _otimista: true,
            };

            if (onTokenCreated) {
                onTokenCreated(tokenOtimista);
            }

            // Fase 3: confirmacao no servidor (background)
            const tokenParaServidor = {
                tokenId: realTokenId,
                nome: nome || null,
                x: tokenOtimista.x,
                y: tokenOtimista.y,
                escala: 1.0,
                larguraOriginal: largura,
                alturaOriginal: altura,
                invertido: false,
                oculto: false,
                bloqueado: false,
                imageUrl: imageUrl,
                imageBase64: base64,
                mimeType: mimeType,
                parentId: '__direct__',
            };

            const tokenCriado = await criarToken(tokenParaServidor);

            if (tokenCriado) {
                if (onTokenConfirmed) {
                    onTokenConfirmed(tempId, tokenCriado);
                }

                if (onTokenImageReady) {
                    onTokenImageReady(tokenCriado.id || tokenCriado.tokenId, base64 || imageUrl);
                }

                if (socket?.connected) {
                    emitirTokenCreated(tokenCriado);
                }
            } else {
                if (onTokenConfirmed) {
                    onTokenConfirmed(tempId, null);
                }
            }
        } catch (err) {
            console.error('[useImageDropPaste] Erro ao processar imagem:', err.message);
        }
    }, [containerRef, criarToken, telaParaMundo, emitirTokenCreated, socket, onTokenCreated, onTokenConfirmed, onTokenImageReady]);

    // Usa refs para evitar re-registro infinito.
    // processarImagem muda a cada render (useCallback com muitas deps),
    // causando cleanup → setup em loop. Com refs, o efeito só roda uma vez.
    const processarImagemRef = useRef(processarImagem);
    processarImagemRef.current = processarImagem;
    const containerRefStable = useRef(containerRef);
    containerRefStable.current = containerRef;

    // Rastreia quando containerRef.current fica disponível (mesmo padrão do useDragDropToken)
    const [containerEl, setContainerEl] = useState(null);
    useEffect(() => {
        const el = containerRef.current;
        if (el !== containerEl) setContainerEl(el);
    });

    // Drag & Drop de arquivos do SO - via DragDropSystem unificado
    useEffect(() => {
        if (!isMaster) return;
        if (!containerEl) return;

        const container = containerEl;
        DragDropSystem.connectListeners(container);
        DragDropSystem.registerZone('TabletopFileDrop', container, {
            onFileDrop: (file, event) => {
                const posicaoTela = { clientX: event.clientX, clientY: event.clientY };
                const nome = extrairNomeDoArquivo(file.name);
                processarImagemRef.current(file, nome, posicaoTela);
            }
        });

        return () => {
            DragDropSystem.unregisterZone('TabletopFileDrop');
        };
    }, [isMaster, containerEl]);

    // Ctrl+V (Paste) de imagens do clipboard
    useEffect(() => {
        if (!isMaster) return;
        if (typeof document === 'undefined') return;

        const handlePaste = async (e) => {
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && (
                activeEl.tagName === 'INPUT' ||
                activeEl.tagName === 'TEXTAREA' ||
                activeEl.isContentEditable
            );

            if (isInputFocused) {
                // Usuario esta colando em campo de texto, nao interfere
                return;
            }

            const container = containerRefStable.current?.current;
            if (!container) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (!item.type.startsWith('image/')) continue;

                e.preventDefault();

                const blob = item.getAsFile();
                if (!blob) continue;

                const nome = '';

                const rect = container.getBoundingClientRect();
                const posicaoTela = {
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                };

                await processarImagemRef.current(blob, nome, posicaoTela);
                break; // Processa apenas a primeira imagem
            }
        };

        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [isMaster]);  // 🔧 FIX: só depende de isMaster
}
