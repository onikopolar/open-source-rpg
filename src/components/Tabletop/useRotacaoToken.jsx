import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import RotateRightIcon from '@mui/icons-material/RotateRight';

/**
 * Ângulo correto para ctx.rotate() conforme o contexto de renderização.
 * 
 * Ambos usam translate(centro) + rotate + translate(-offset), mas:
 * - 'token': drawImage() com translate(-w/2, -h/2) → inverte visualmente → fator -1
 * - 'selecao': strokeRect() com translate(-cx, -cy) → normal → fator +1
 */
export function anguloRotacaoCanvas(rotacaoGraus, contexto = 'selecao') {
    if (!rotacaoGraus || rotacaoGraus === 0) return 0;
    const fator = contexto === 'token' ? -1 : 1;
    return (fator * rotacaoGraus * Math.PI) / 180;
}

export function useRotacaoToken({ tokenSelecionado, zoom, tokensInfo, onGirar, containerRef, arrastando }) {
    const arrastandoRef = useRef(false);
    const ultimoRef = useRef(0);
    const centroRef = useRef({ x: 0, y: 0 });
    const idRef = useRef(null);
    const posRef = useRef(null);
    const btnRef = useRef(null);

    const pos = useMemo(() => {
        if (tokenSelecionado === null || tokenSelecionado === undefined) {
            posRef.current = null;
            return null;
        }
        const t = tokensInfo[tokenSelecionado];
        if (!t || t.bloqueado) {
            posRef.current = null;
            return null;
        }

        const tx = t.posicaoTela.x;
        const ty = t.posicaoTela.y;
        const tw = t.tamanhoTela.larguraTela;
        const th = t.tamanhoTela.alturaTela;

        idRef.current = t.id;
        // centro: coordenadas viewport (pra bater com clientX/clientY do mouse)
        const cx = tx + tw / 2;
        const cy = ty + th / 2;
        let vpX = cx;
        let vpY = cy;
        if (containerRef?.current) {
            const r = containerRef.current.getBoundingClientRect();
            vpX = cx + r.left;
            vpY = cy + r.top;
        }
        centroRef.current = { x: vpX, y: vpY };

        const size = Math.max(24, Math.min(44, Math.min(tw, th) * 0.3));
        const relX = tx + tw / 2 - size / 2;
        const relY = ty - size - 6;

        const novaPos = {
            x: relX,
            y: relY,
            size,
            rot: t.rotacao || 0,
            offY: (ty + th / 2) - (relY + size / 2),
        };
        posRef.current = novaPos;
        return novaPos;
    }, [tokenSelecionado, zoom, tokensInfo, containerRef]);

    const botaoAtivo = pos !== null && !arrastando;

    const getSnap = useCallback((clientX, clientY) => {
        const c = centroRef.current; // coordenadas absolutas da página
        const dx = clientX - c.x;
        const dy = clientY - c.y;
        let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
        let snap = Math.round(angle / 15) * 15;
        if (snap > 180) snap -= 360;
        else if (snap <= -180) snap += 360;
        return snap;
    }, []);

    const onDown = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        arrastandoRef.current = true;

        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const snap = getSnap(cx, cy);

        if (snap !== ultimoRef.current && idRef.current && onGirar) {
            ultimoRef.current = snap;
            onGirar(idRef.current, snap);
        }
    }, [onGirar, getSnap]);

    const onMove = useCallback((e) => {
        if (!arrastandoRef.current) return;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const snap = getSnap(cx, cy);

        if (snap !== ultimoRef.current && idRef.current && onGirar) {
            ultimoRef.current = snap;
            onGirar(idRef.current, snap);
        }
    }, [onGirar, getSnap]);

    const onUp = useCallback(() => {
        arrastandoRef.current = false;
    }, []);

    useEffect(() => {
        if (!botaoAtivo) return;
        const mv = (e) => onMove(e);
        const up = () => onUp();
        document.addEventListener('mousemove', mv);
        document.addEventListener('mouseup', up);
        document.addEventListener('touchmove', mv, { passive: false });
        document.addEventListener('touchend', up);
        return () => {
            document.removeEventListener('mousemove', mv);
            document.removeEventListener('mouseup', up);
            document.removeEventListener('touchmove', mv);
            document.removeEventListener('touchend', up);
        };
    }, [botaoAtivo, onMove, onUp]);

    // Listener nativo em capture phase: vence qualquer handler do container
    useEffect(() => {
        const el = btnRef.current;
        if (!el || !botaoAtivo) return;

        const down = (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            arrastandoRef.current = true;

            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const snap = getSnap(cx, cy);

            if (snap !== ultimoRef.current && idRef.current && onGirar) {
                ultimoRef.current = snap;
                onGirar(idRef.current, snap);
            }
        };

        el.addEventListener('mousedown', down, true);
        el.addEventListener('touchstart', down, { capture: true, passive: false });
        return () => {
            el.removeEventListener('mousedown', down, true);
            el.removeEventListener('touchstart', down, { capture: true });
        };
    }, [botaoAtivo, getSnap, onGirar]);

    const btn = botaoAtivo ? (
        <Box
            ref={btnRef}
            sx={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: pos.size,
                height: pos.size,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,152,0,0.95)',
                border: '2px solid rgba(255,152,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                zIndex: 1000,
                pointerEvents: 'auto',
                boxShadow: '0 0 6px rgba(0,0,0,0.3)',
                userSelect: 'none',
                touchAction: 'none',
                transform: `rotate(${pos.rot}deg)`,
                transformOrigin: `50% calc(50% + ${pos.offY}px)`,
                '&:active': {
                    cursor: 'grabbing',
                    backgroundColor: 'rgba(255,152,0,0.5)',
                },
            }}
        >
            <RotateRightIcon sx={{
                fontSize: pos.size * 0.6,
                color: '#fff',
                pointerEvents: 'none',
                transform: `rotate(${-pos.rot}deg)`,
            }} />
        </Box>
    ) : null;

    return { RotateButton: btn };
}