// src/hooks/useTabletopTokens.js
import { useState, useEffect, useCallback } from 'react';

export function useTabletopTokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carrega os tokens da mesa (instâncias com parentId != null)
  const carregarTokens = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/Tabletop/tokens/instancias');
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar tokens');
      }
      
      const tokensOrdenados = [...data].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      setTokens(tokensOrdenados);
      return tokensOrdenados;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const criarToken = useCallback(async (tokenData) => {
    try {
      const bodyString = JSON.stringify(tokenData);
      
      const response = await fetch('/api/Tabletop/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyString
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar token');
      }
      
      setTokens(prev => {
        const novos = [...prev, data];
        const ordenados = novos.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        return ordenados;
      });
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const atualizarToken = useCallback(async (id, updates) => {
    // Tokens otimistas (temp-*) ainda nao existem no banco — nao faz PUT
    if (typeof id === 'string' && id.startsWith('temp-')) {
      return null;
    }
    try {
      const response = await fetch(`/api/Tabletop/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar token');
      }
      
      setTokens(prev => {
        const novos = prev.map(t => t.id === id ? data : t);
        const ordenados = novos.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        return ordenados;
      });
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const deletarToken = useCallback(async (id) => {
    // Tokens otimistas (temp-*) ainda nao existem no banco — nao faz DELETE
    if (typeof id === 'string' && id.startsWith('temp-')) {
      return true;
    }
    try {
      const response = await fetch(`/api/Tabletop/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar token');
      }
      
      setTokens(prev => {
        const novos = prev.filter(t => t.id !== id);
        return novos;
      });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  useEffect(() => {
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