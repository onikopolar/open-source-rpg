// src/utils/DragDropSystem.js
//
// Sistema UNIFICADO de drag & drop para todo o projeto.
// Substitui listeners nativos espalhados e o DragDropSystem antigo do TokenModal.
//
// Uso:
//   1. Registrar zonas:  DragDropSystem.registerZone(id, element, handlers)
//   2. Conectar ao DOM:   element.addEventListener('dragover', DragDropSystem.handleDragOver)
//                         element.addEventListener('drop', DragDropSystem.handleDrop)
//   3. Desregistrar:      DragDropSystem.unregisterZone(id)
//
// Handlers:
//   onJsonDrop(dados, event)  - drop de token da biblioteca (JSON)
//   onFileDrop(file, event)    - drop de arquivo do SO
//   onDragOver(event)          - opcional, customiza comportamento
//
// IMPORTANTE: todos os metodos usam 'DragDropSystem.' (nao 'this.')
// porque sao passados como listeners nativos (addEventListener) e o this se perde.

const DragDropSystem = {
    /** @type {Map<string, {element: HTMLElement, handlers: object}>} */
    zones: new Map(),

    /**
     * Registra uma zona de drop.
     */
    registerZone(id, element, handlers = {}) {
        if (!element) return;
        DragDropSystem.zones.set(id, { element, handlers });
    },

    unregisterZone(id) {
        DragDropSystem.zones.delete(id);
    },

    /**
     * Handler de dragover nativo. Deve ser conectado via addEventListener.
     */
    handleDragOver(event) {
        const hasFiles = event.dataTransfer?.files?.length > 0;
        const hasJson = event.dataTransfer?.types?.includes('application/json');

        if (hasFiles || hasJson) {
            event.preventDefault();
            event.dataTransfer.dropEffect = hasFiles ? 'copy' : 'move';
        }
    },

    /**
     * Handler de drop nativo. Deve ser conectado via addEventListener.
     * Roteia para o handler correto (JSON ou arquivo).
     */
    handleDrop(event) {
        event.preventDefault();

        // 1. Tenta JSON (token da biblioteca)
        try {
            const raw = event.dataTransfer.getData('application/json');
            if (raw) {
                const dados = JSON.parse(raw);

                const zone = DragDropSystem._findZone(event);
                if (zone?.handlers.onJsonDrop) {
                    zone.handlers.onJsonDrop(dados, event);
                    return;
                }

                // Fallback
                for (const [id, z] of DragDropSystem.zones) {
                    if (z.handlers.onJsonDrop) {
                        z.handlers.onJsonDrop(dados, event);
                        return;
                    }
                }
            }
        } catch (e) {
            console.error('[DragDropSystem] Erro ao processar JSON do drop:', e);
        }

        // 2. Tenta arquivo (imagem do SO)
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;

                const zone = DragDropSystem._findZone(event);
                if (zone?.handlers.onFileDrop) {
                    zone.handlers.onFileDrop(file, event);
                    return;
                }
                for (const [id, z] of DragDropSystem.zones) {
                    if (z.handlers.onFileDrop) {
                        z.handlers.onFileDrop(file, event);
                        return;
                    }
                }
            }
        }
    },

    /**
     * Encontra a zona cujo elemento contem o mouse no momento do drop.
     * Prioriza o elemento mais profundo (menor area).
     */
    _findZone(event) {
        let best = null;
        let bestArea = Infinity;

        for (const [id, zone] of DragDropSystem.zones) {
            const el = zone.element;
            if (!el || !document.body.contains(el)) {
                DragDropSystem.zones.delete(id);
                continue;
            }
            try {
                const rect = el.getBoundingClientRect();
                if (event.clientX >= rect.left && event.clientX <= rect.right &&
                    event.clientY >= rect.top && event.clientY <= rect.bottom) {
                    const area = rect.width * rect.height;
                    if (area < bestArea) {
                        bestArea = area;
                        best = { id, ...zone };
                    }
                }
            } catch (e) {}
        }

        return best;
    },

    /**
     * Conecta listeners nativos de dragover/drop em um elemento.
     * Idempotente: nao adiciona duplicado se ja foi conectado.
     */
    _connectedElements: new WeakSet(),

    connectListeners(el) {
        if (!el || DragDropSystem._connectedElements.has(el)) return;
        el.addEventListener('dragover', DragDropSystem.handleDragOver);
        el.addEventListener('drop', DragDropSystem.handleDrop);
        DragDropSystem._connectedElements.add(el);
    },

    disconnectListeners(el) {
        if (!el || !DragDropSystem._connectedElements.has(el)) return;
        el.removeEventListener('dragover', DragDropSystem.handleDragOver);
        el.removeEventListener('drop', DragDropSystem.handleDrop);
        DragDropSystem._connectedElements.delete(el);
    },

    /**
     * Isola um elemento: bloqueia mouse, touch e wheel de propagarem
     * para elementos pais (ex: sidebar dentro do GridContainer).
     */
    _isolatedElements: new WeakMap(),

    isolateElement(el) {
        if (!el || DragDropSystem._isolatedElements.has(el)) return;

        const stop = (e) => e.stopPropagation();
        // touchstart/touchmove como passive:true (nao usamos preventDefault, so stopPropagation)
        const passiveEvents = new Set(['wheel', 'touchstart', 'touchmove']);
        const events = ['wheel', 'mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend'];

        for (const name of events) {
            el.addEventListener(name, stop, passiveEvents.has(name) ? { passive: true } : undefined);
        }
        // Usa connectListeners (idempotente) em vez de addEventListener direto
        DragDropSystem.connectListeners(el);

        DragDropSystem._isolatedElements.set(el, { stop, events });
    },

    releaseElement(el) {
        const data = DragDropSystem._isolatedElements.get(el);
        if (!data) return;

        for (const name of data.events) {
            el.removeEventListener(name, data.stop);
        }
        // Só remove listeners se não for connected por outro caller
        // (ex: tabletop container usa connectListeners direto, não isolateElement)
        DragDropSystem.disconnectListeners(el);

        DragDropSystem._isolatedElements.delete(el);
    },
};

// Compatibilidade: exporta como objeto (nao modulo ES6) para manter
// compatibilidade com imports existentes em TokenModal.jsx, TokenDesign.jsx, etc.
export default DragDropSystem;
