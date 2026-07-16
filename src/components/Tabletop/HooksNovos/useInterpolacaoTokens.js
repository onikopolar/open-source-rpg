// src/components/Tabletop/HooksNovos/useInterpolacaoTokens.js
//
// Sistema de interpolação inspirado no OBR.interaction:
// - Atualizações remotas de posição são bufferizadas como "targets"
// - A cada frame (RAF), as posições de exibição fazem lerp em direção ao target
// - Quando a diferença é menor que um threshold, "snapa" para o target
// - Isso suaviza o movimento remoto mesmo com baixa frequência de rede
//
// Fluxo:
//   1. Remote update chega → animateTo(id, x, y)
//   2. No render loop → tick() faz lerp de todas as animações ativas
//   3. getDisplayPosition(id) → retorna posição interpolada (ou null se não animando)

import { useRef, useCallback } from 'react';

// Threshold em pixels de mundo: quando a distancia entre display e target
// for menor que isso, "snapa" direto (evita micro-animacoes infinitas)
const SNAP_THRESHOLD = 0.5;

// Duracao da animacao em ms. Valores baixos = mais responsivo, valores altos = mais suave.
// 80ms eh um bom meio-termo: suave mas nao parece "lagado"
const ANIMATION_DURATION = 80;

/**
 * Hook para interpolar suavemente posições de tokens remotos.
 *
 * Mantém um Map interno (ref) de animações ativas.
 * Não causa re-renders — a interpolação acontece puramente na camada de renderização.
 */
export function useInterpolacaoTokens() {
  // Map<tokenId, { fromX, fromY, toX, toY, startTime, duration }>
  const animationsRef = useRef(new Map());

  // Snapshot das posições display atuais, atualizado a cada tick()
  // Map<tokenId, { x, y }>
  const displaySnapshotRef = useRef(new Map());

  /**
   * Inicia (ou atualiza) uma animacao de interpolacao para um token.
   * Chamado quando chega uma atualizacao de posicao remota.
   *
   * @param {string} tokenId
   * @param {number} x - posicao X de mundo (target)
   * @param {number} y - posicao Y de mundo (target)
   * @param {boolean} [snap] - se true, aplica posicao direto sem animacao
   */
  const animateTo = useCallback((tokenId, x, y, snap = false) => {
    const anims = animationsRef.current;

    if (snap) {
      // Snap: cancela qualquer animacao e remove do snapshot.
      // O token passa a renderizar pela posicao real do tokensLocal,
      // sem interpolacao. Usado durante drag remoto ativo.
      anims.delete(tokenId);
      displaySnapshotRef.current.delete(tokenId);
      return;
    }

    const existing = anims.get(tokenId);

    if (existing) {
      // Animacao ja ativa: apenas atualiza o target, sem resetar startTime.
      existing.toX = x;
      existing.toY = y;
    } else {
      // Nova animacao: parte da posicao display atual
      const now = performance.now();
      const fromX = displaySnapshotRef.current.get(tokenId)?.x ?? x;
      const fromY = displaySnapshotRef.current.get(tokenId)?.y ?? y;

      anims.set(tokenId, {
        fromX,
        fromY,
        toX: x,
        toY: y,
        startTime: now,
        duration: ANIMATION_DURATION,
      });
    }
  }, []);

  /**
   * Remove a animação de um token (ex: quando o drag remoto termina).
   */
  const cancelAnimation = useCallback((tokenId) => {
    animationsRef.current.delete(tokenId);
    displaySnapshotRef.current.delete(tokenId);
  }, []);

  /**
   * Executa um tick de animação. Deve ser chamado a cada frame (no render loop).
   *
   * @param {number} now - performance.now() ou Date.now()
   * @returns {Map<string, {x: number, y: number}>} snapshot das posições display atuais
   */
  const tick = useCallback((now) => {
    const anims = animationsRef.current;
    const snapshot = displaySnapshotRef.current;

    if (anims.size === 0) {
      // Limpa o snapshot se não há animações
      if (snapshot.size > 0) {
        snapshot.clear();
      }
      return snapshot;
    }

    const toDelete = [];

    for (const [tokenId, anim] of anims) {
      const elapsed = now - anim.startTime;
      let progress = elapsed / anim.duration;

      if (progress >= 1) {
        // Animação concluída — snap ao target
        snapshot.set(tokenId, { x: anim.toX, y: anim.toY });
        toDelete.push(tokenId);
      } else {
        // Easing: ease-out quad para chegada suave
        const t = 1 - (1 - progress) * (1 - progress);
        const displayX = anim.fromX + (anim.toX - anim.fromX) * t;
        const displayY = anim.fromY + (anim.toY - anim.fromY) * t;

        // Verifica se já está perto o suficiente para snap antecipado
        const dx = anim.toX - displayX;
        const dy = anim.toY - displayY;
        if (Math.sqrt(dx * dx + dy * dy) < SNAP_THRESHOLD) {
          snapshot.set(tokenId, { x: anim.toX, y: anim.toY });
          toDelete.push(tokenId);
        } else {
          snapshot.set(tokenId, { x: displayX, y: displayY });
        }
      }
    }

    for (const id of toDelete) {
      anims.delete(id);
    }

    return snapshot;
  }, []);

  /**
   * Retorna a posição display interpolada para um token.
   * Se o token não estiver sendo animado, retorna null
   * (o caller deve usar a posição real do token).
   *
   * @param {string} tokenId
   * @returns {{x: number, y: number} | null}
   */
  const getDisplayPosition = useCallback((tokenId) => {
    return displaySnapshotRef.current.get(tokenId) ?? null;
  }, []);

  return {
    animateTo,
    cancelAnimation,
    tick,
    getDisplayPosition,
  };
}
