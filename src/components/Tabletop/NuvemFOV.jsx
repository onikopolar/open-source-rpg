// src/components/Tabletop/NuvemFOV.jsx
import { useState, useCallback, useRef } from "react";

export function useNuvemFOV() {
    // Estados principais
    const [modoDesenho, setModoDesenho] = useState(false);
    const [ferramenta, setFerramenta] = useState('pincel'); // 'pincel' ou 'borracha'
    const [camadasNevoa, setCamadasNevoa] = useState([]);
    
    // Estado do desenho atual
    const [desenhando, setDesenhando] = useState(false);
    const [inicioDesenho, setInicioDesenho] = useState({ x: 0, y: 0 });
    const [fimDesenho, setFimDesenho] = useState({ x: 0, y: 0 });
    
    // Refs para performance
    const rafRef = useRef(null);
    const onRenderCallbackRef = useRef(null);

    // Registra callback que o TabletopGrid vai fornecer para renderizar
    const registrarCallbackRender = useCallback((callback) => {
        onRenderCallbackRef.current = callback;
    }, []);

    // Inicia o desenho de uma área
    const iniciarDesenho = useCallback((x, y) => {
        if (!modoDesenho) return;
        
        setDesenhando(true);
        setInicioDesenho({ x, y });
        setFimDesenho({ x, y });
    }, [modoDesenho]);

    // Atualiza o desenho enquanto arrasta
    const atualizarDesenho = useCallback((x, y) => {
        if (!desenhando) return;
        
        setFimDesenho({ x, y });
        
        // Agenda renderização via requestAnimationFrame
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (onRenderCallbackRef.current) {
                onRenderCallbackRef.current();
            }
            rafRef.current = null;
        });
    }, [desenhando]);

    // Finaliza o desenho e salva a área
    const finalizarDesenho = useCallback(() => {
        if (!desenhando) return;

        // Calcula a área final (normaliza coordenadas)
        const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
        const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
        const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
        const y2 = Math.max(inicioDesenho.y, fimDesenho.y);

        // Só salva se a área tiver tamanho mínimo
        if (Math.abs(x2 - x1) > 5 && Math.abs(y2 - y1) > 5) {
            const novaArea = {
                id: Date.now() + Math.random(),
                x: x1,
                y: y1,
                largura: x2 - x1,
                altura: y2 - y1,
                tipo: ferramenta // 'pincel' ou 'borracha'
            };

            setCamadasNevoa(prev => [...prev, novaArea]);
        }

        setDesenhando(false);
        
        // Renderiza uma última vez
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, [desenhando, inicioDesenho, fimDesenho, ferramenta]);

    // Limpa todas as camadas
    const limparTudo = useCallback(() => {
        setCamadasNevoa([]);
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Desfaz a última camada
    const desfazer = useCallback(() => {
        setCamadasNevoa(prev => prev.slice(0, -1));
        if (onRenderCallbackRef.current) {
            onRenderCallbackRef.current();
        }
    }, []);

    // Renderiza a névoa no canvas (chamado pelo TabletopGrid)
    const renderizarNevoa = useCallback((context, zoom, position) => {
        // Desenha todas as camadas salvas
        camadasNevoa.forEach(area => {
            // Aplica transformação da câmera
            const telaX = area.x * zoom + position.x;
            const telaY = area.y * zoom + position.y;
            const telaLargura = area.largura * zoom;
            const telaAltura = area.altura * zoom;

            if (area.tipo === 'pincel') {
                // Pincel = adiciona névoa (preto)
                context.fillStyle = 'rgba(0, 0, 0, 0.8)';
                context.fillRect(telaX, telaY, telaLargura, telaAltura);
            } else {
                // Borracha = remove névoa (transparente)
                // Na prática, não desenha nada, mas poderia desenhar um contorno
                context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                context.lineWidth = 2 / zoom;
                context.strokeRect(telaX, telaY, telaLargura, telaAltura);
            }
        });

        // Desenha o preview da área sendo desenhada agora
        if (desenhando) {
            const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
            const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
            const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
            const y2 = Math.max(inicioDesenho.y, fimDesenho.y);

            const telaX = x1 * zoom + position.x;
            const telaY = y1 * zoom + position.y;
            const telaLargura = (x2 - x1) * zoom;
            const telaAltura = (y2 - y1) * zoom;

            // Preview em vermelho para pincel, verde para borracha
            context.strokeStyle = ferramenta === 'pincel' ? '#ff4444' : '#44ff44';
            context.lineWidth = 2 / zoom;
            context.setLineDash([5 / zoom, 5 / zoom]);
            context.strokeRect(telaX, telaY, telaLargura, telaAltura);
            context.setLineDash([]);
        }
    }, [camadasNevoa, desenhando, inicioDesenho, fimDesenho, ferramenta]);

    // Verifica se uma posição está coberta por névoa
    const estaCoberto = useCallback((mundoX, mundoY) => {
        // Converte mundo para coordenadas da névoa (assumindo que as áreas estão em pixels do mundo)
        for (const area of camadasNevoa) {
            if (area.tipo !== 'pincel') continue; // Só pincel bloqueia
            
            if (mundoX >= area.x && 
                mundoX <= area.x + area.largura &&
                mundoY >= area.y && 
                mundoY <= area.y + area.altura) {
                return true;
            }
        }
        return false;
    }, [camadasNevoa]);

    // Salva o estado atual (pode ser usado para persistência)
    const salvarEstado = useCallback(() => {
        return {
            camadas: camadasNevoa,
            versao: '1.0'
        };
    }, [camadasNevoa]);

    // Carrega um estado salvo
    const carregarEstado = useCallback((estado) => {
        if (estado?.camadas) {
            setCamadasNevoa(estado.camadas);
            if (onRenderCallbackRef.current) {
                onRenderCallbackRef.current();
            }
        }
    }, []);

    return {
        // Estados
        modoDesenho,
        setModoDesenho,
        ferramenta,
        setFerramenta,
        desenhando,
        inicioDesenho,
        fimDesenho,
        
        // Ações de desenho
        iniciarDesenho,
        atualizarDesenho,
        finalizarDesenho,
        
        // Gerenciamento de camadas
        camadasNevoa,
        limparTudo,
        desfazer,
        
        // Renderização e utilitários
        registrarCallbackRender,
        renderizarNevoa,
        estaCoberto,
        
        // Persistência
        salvarEstado,
        carregarEstado
    };
}