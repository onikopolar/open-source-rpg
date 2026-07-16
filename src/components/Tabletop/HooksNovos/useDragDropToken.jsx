// src/components/Tabletop/HooksNovos/useDragDropToken.jsx
import { useEffect, useRef, useState } from 'react';
import DragDropSystem from '../../../utils/DragDropSystem';

export function useDragDropToken({
    isMaster,
    containerRef,
    setModalTokenAberto,
    criarToken,
    telaParaMundo,
    emitirTokenCreated,
    socket,
    onTokenCreated,
    onTokenImageReady,
}) {
    const setupDoneRef = useRef(false);
    const callbacksRef = useRef({ criarToken, telaParaMundo, emitirTokenCreated, onTokenCreated, onTokenImageReady, setModalTokenAberto });

    // Rastreia quando containerRef.current fica disponível.
    // O objeto containerRef é estável (não muda entre renders), então o useEffect
    // com [isMaster, containerRef] NUNCA re-executa depois que o container monta.
    // Usamos um state para forçar o re-run quando o elemento real aparece no DOM.
    const [containerEl, setContainerEl] = useState(null);

    useEffect(() => {
        const el = containerRef.current;
        if (el !== containerEl) {
            setContainerEl(el);
        }
    });

    callbacksRef.current = { criarToken, telaParaMundo, emitirTokenCreated, onTokenCreated, onTokenImageReady, setModalTokenAberto };

    useEffect(() => {
        if (!isMaster) return;
        if (!containerEl) return;
        if (setupDoneRef.current) return;

        const container = containerEl;

        DragDropSystem.connectListeners(container);
        DragDropSystem.registerZone('TabletopGrid', container, {
            onJsonDrop: async (dados, event) => {
                const cb = callbacksRef.current;

                if (dados.tipo !== 'token') return;

                cb.setModalTokenAberto(false);

                const rect = container.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                const mundo = cb.telaParaMundo(mouseX, mouseY);

                const imageUrl = dados.imageUrl || dados.imagemUrl || null;
                const imageBase64 = dados.imageBase64 || dados.imagemBase64 || null;

                const parentIdFinal = dados.parentId || dados.id || null;

                const novoToken = {
                    tokenId: `${dados.id}-${Date.now()}`,
                    nome: dados.nome || 'Token',
                    x: mundo.x - (dados.larguraOriginal || 50) / 2,
                    y: mundo.y - (dados.alturaOriginal || 50) / 2,
                    escala: 1.0,
                    larguraOriginal: dados.larguraOriginal || 50,
                    alturaOriginal: dados.alturaOriginal || 50,
                    invertido: false, oculto: false, bloqueado: false,
                    imageUrl, imageBase64,
                    mimeType: dados.mimeType || null,
                    parentId: parentIdFinal,
                };

                const tokenCriado = await cb.criarToken(novoToken);

                if (tokenCriado) {
                    if (cb.onTokenCreated) cb.onTokenCreated(tokenCriado);
                    const sourceParaP2P = imageBase64 || imageUrl;
                    if (cb.onTokenImageReady && sourceParaP2P) {
                        cb.onTokenImageReady(tokenCriado.id || tokenCriado.tokenId, sourceParaP2P);
                    }
                    if (socket?.connected) cb.emitirTokenCreated(tokenCriado);
                }
            }
        });

        setupDoneRef.current = true;

        return () => {
            DragDropSystem.disconnectListeners(container);
            DragDropSystem.unregisterZone('TabletopGrid');
            setupDoneRef.current = false;
        };
    }, [isMaster, containerEl]);
}