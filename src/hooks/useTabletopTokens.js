// src/hooks/useTabletopTokens.js
import { useState, useEffect, useCallback } from 'react';

export function useTabletopTokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregarTokens = useCallback(async () => {
    console.log('[useTabletopTokens] carregarTokens - INÍCIO');
    try {
      setLoading(true);
      const response = await fetch('/api/Tabletop/tokens');
      console.log('[useTabletopTokens] carregarTokens - response status:', response.status);
      
      const data = await response.json();
      console.log('[useTabletopTokens] carregarTokens - dados recebidos:', data.map(t => ({ 
        id: t.id, 
        nome: t.nome, 
        bloqueado: t.bloqueado, 
        zIndex: t.zIndex 
      })));
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar tokens');
      }
      
      // Ordenar por zIndex (menor primeiro)
      const tokensOrdenados = [...data].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      console.log('[useTabletopTokens] carregarTokens - tokens ordenados:', tokensOrdenados.map(t => ({ 
        id: t.id, 
        nome: t.nome, 
        bloqueado: t.bloqueado, 
        zIndex: t.zIndex 
      })));
      
      setTokens(tokensOrdenados);
      return tokensOrdenados;
    } catch (err) {
      console.error('[useTabletopTokens] carregarTokens - ERRO:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
      console.log('[useTabletopTokens] carregarTokens - FINALIZADO, loading:', false);
    }
  }, []);

  const criarToken = useCallback(async (tokenData) => {
    console.log('[useTabletopTokens] criarToken - INÍCIO');
    console.log('[useTabletopTokens] criarToken - tokenData recebido:', tokenData);
    
    try {
      const bodyString = JSON.stringify(tokenData);
      console.log('[useTabletopTokens] criarToken - body a ser enviado:', bodyString);
      
      const response = await fetch('/api/Tabletop/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyString
      });
      
      console.log('[useTabletopTokens] criarToken - response status:', response.status);
      
      const data = await response.json();
      console.log('[useTabletopTokens] criarToken - response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar token');
      }
      
      setTokens(prev => {
        const novos = [...prev, data];
        const ordenados = novos.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        console.log('[useTabletopTokens] criarToken - novos tokens após criar:', ordenados.map(t => ({ id: t.id, bloqueado: t.bloqueado })));
        return ordenados;
      });
      return data;
    } catch (err) {
      console.error('[useTabletopTokens] criarToken - ERRO:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const atualizarToken = useCallback(async (id, updates) => {
    console.log('[useTabletopTokens] atualizarToken - INÍCIO');
    console.log('[useTabletopTokens] atualizarToken - id:', id);
    console.log('[useTabletopTokens] atualizarToken - updates:', updates);
    
    try {
      const response = await fetch(`/api/Tabletop/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      console.log('[useTabletopTokens] atualizarToken - response status:', response.status);
      
      const data = await response.json();
      console.log('[useTabletopTokens] atualizarToken - response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar token');
      }
      
      setTokens(prev => {
        const novos = prev.map(t => t.id === id ? data : t);
        const ordenados = novos.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        console.log('[useTabletopTokens] atualizarToken - estado atualizado. Token atual:', ordenados.find(t => t.id === id));
        return ordenados;
      });
      return data;
    } catch (err) {
      console.error('[useTabletopTokens] atualizarToken - ERRO:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const deletarToken = useCallback(async (id) => {
    console.log('[useTabletopTokens] deletarToken - INÍCIO, id:', id);
    
    try {
      const response = await fetch(`/api/Tabletop/${id}`, {
        method: 'DELETE'
      });
      
      console.log('[useTabletopTokens] deletarToken - response status:', response.status);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar token');
      }
      
      setTokens(prev => {
        const novos = prev.filter(t => t.id !== id);
        console.log('[useTabletopTokens] deletarToken - tokens restantes:', novos.length);
        return novos;
      });
      return true;
    } catch (err) {
      console.error('[useTabletopTokens] deletarToken - ERRO:', err);
      setError(err.message);
      return false;
    }
  }, []);

  useEffect(() => {
    console.log('[useTabletopTokens] useEffect - carregando tokens na montagem');
    carregarTokens();
  }, [carregarTokens]);

  return {
    tokens,
    loading,
    error,
    carregarTokens,
    criarToken,
    atualizarToken,
    deletarToken
  };
}