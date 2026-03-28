// src/components/Tabletop/HooksNovos/useDragDropToken.jsx
import { useEffect } from 'react';

export function useDragDropToken({
    isMaster,
    containerRef,
    setModalTokenAberto,
    criarToken,
    telaParaMundo,
    emitirTokenCreated,
    socket,
}) {
    useEffect(() => {
        if (!isMaster) return;

        const DragDropSystem = require('../../../components/TokenModal/TokenModal').DragDropSystem;

        DragDropSystem.register('TabletopGrid', containerRef.current, async (dados, event) => {
            if (dados.tipo !== 'token') {
                return;
            }

            setModalTokenAberto(false);

            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const mundo = telaParaMundo(mouseX, mouseY);

            const imageUrlParaSalvar = dados.imageUrl || dados.imagemUrl || null;
            const imageBase64ParaSalvar = dados.imageBase64 || dados.imagemBase64 || null;

            const novoToken = {
                tokenId: `${dados.id}-${Date.now()}`,
                nome: dados.nome || 'Token',
                x: mundo.x - (dados.larguraOriginal || 50) / 2,
                y: mundo.y - (dados.alturaOriginal || 50) / 2,
                escala: 1.0,
                larguraOriginal: dados.larguraOriginal || 50,
                alturaOriginal: dados.alturaOriginal || 50,
                invertido: false,
                oculto: false,
                bloqueado: false,
                imageUrl: imageUrlParaSalvar,
                imageBase64: imageBase64ParaSalvar,
                mimeType: dados.mimeType || null,
            };

            const tokenCriado = await criarToken(novoToken);

            if (tokenCriado && socket && socket.connected) {
                emitirTokenCreated(tokenCriado);
            }
        });

        return () => {
            DragDropSystem.unregister('TabletopGrid');
        };
    }, [isMaster, containerRef, setModalTokenAberto, criarToken, telaParaMundo, emitirTokenCreated, socket]);
}