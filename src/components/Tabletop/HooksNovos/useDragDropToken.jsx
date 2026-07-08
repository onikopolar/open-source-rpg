// src/components/Tabletop/HooksNovos/useDragDropToken.jsx
import { useEffect, useRef } from 'react';
import { DragDropSystem } from '../../../components/TokenModal/TokenModal';

export function useDragDropToken({
    isMaster,
    containerRef,
    setModalTokenAberto,
    criarToken,
    telaParaMundo,
    emitirTokenCreated,
    socket,
    onTokenCreated,
}) {
    const isRegisteredRef = useRef(false);

    useEffect(() => {
        if (!isMaster) return;
        if (isRegisteredRef.current) return;
        if (!containerRef.current) return;

        const register = () => {
            DragDropSystem.register('TabletopGrid', containerRef.current, async (dados, event) => {
                console.log('[useDragDropToken] Drop recebido - dados:', dados);
                
                if (dados.tipo !== 'token') {
                    console.log('[useDragDropToken] Ignorando drop - tipo não é token:', dados.tipo);
                    return;
                }

                console.log('[useDragDropToken] Token recebido para criar na mesa:', dados.id, dados.nome);
                console.log('[useDragDropToken] parentId do token (template):', dados.parentId);

                setModalTokenAberto(false);

                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                const mundo = telaParaMundo(mouseX, mouseY);
                console.log('[useDragDropToken] Posição do mouse:', { mouseX, mouseY }, '-> mundo:', mundo);

                const imageUrlParaSalvar = dados.imageUrl || dados.imagemUrl || null;
                let imageBase64ParaSalvar = dados.imageBase64 || dados.imagemBase64 || null;

                // Se não tem base64 mas tem URL, busca a imagem e converte para base64
                if (!imageBase64ParaSalvar && imageUrlParaSalvar) {
                    try {
                        console.log('[useDragDropToken] Buscando imagem para converter em base64:', imageUrlParaSalvar);
                        const response = await fetch(imageUrlParaSalvar);
                        if (response.ok) {
                            const blob = await response.blob();
                            imageBase64ParaSalvar = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onload = () => resolve(reader.result);
                                reader.onerror = () => resolve(null);
                                reader.readAsDataURL(blob);
                            });
                            console.log('[useDragDropToken] Base64 convertido, length:', imageBase64ParaSalvar?.length);
                        }
                    } catch (e) {
                        console.warn('[useDragDropToken] Erro ao buscar imagem para base64:', e.message);
                    }
                }

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
                    parentId: dados.parentId || null,
                };

                console.log('[useDragDropToken] Enviando para criarToken:', {
                    tokenId: novoToken.tokenId,
                    nome: novoToken.nome,
                    parentId: novoToken.parentId
                });

                const tokenCriado = await criarToken(novoToken);

                if (tokenCriado) {
                    // Atualiza IMEDIATAMENTE o estado local
                    if (onTokenCreated) {
                        onTokenCreated(tokenCriado);
                    }

                    if (socket?.connected) {
                        console.log('[useDragDropToken] Token criado com sucesso, emitindo evento socket:', tokenCriado.id);
                        emitirTokenCreated(tokenCriado);
                    }
                } else {
                    console.error('[useDragDropToken] Falha ao criar token ou socket desconectado');
                }
            });

            isRegisteredRef.current = true;
        };

        register();

        return () => {
            if (isRegisteredRef.current) {
                DragDropSystem.unregister('TabletopGrid');
                isRegisteredRef.current = false;
            }
        };
        // Dependências mínimas: apenas as que, se mudarem, realmente exigem re-registro
        // Nota: as funções 'criarToken', 'telaParaMundo', 'emitirTokenCreated' e 'socket'
        // devem ser estáveis (useCallback) no componente pai para evitar reexecução desnecessária.
    }, [isMaster, containerRef, setModalTokenAberto, criarToken, telaParaMundo, emitirTokenCreated, socket]);
}