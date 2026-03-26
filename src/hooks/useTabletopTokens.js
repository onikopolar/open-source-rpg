// src/hooks/useTabletopTokens.js
import { useState, useEffect, useCallback } from 'react';

export function useTabletopTokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar todos os tokens do banco
  const carregarTokens = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/Tabletop/tokens');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar tokens');
      }
      
      setTokens(data);
      return data;
    } catch (err) {
      console.error('[useTabletopTokens] Erro ao carregar:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar um novo token
  const criarToken = useCallback(async (tokenData) => {
    try {
      const response = await fetch('/api/Tabletop/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar token');
      }
      
      setTokens(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('[useTabletopTokens] Erro ao criar:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Atualizar um token
  const atualizarToken = useCallback(async (id, updates) => {
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
      
      setTokens(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (err) {
      console.error('[useTabletopTokens] Erro ao atualizar:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Deletar um token
  const deletarToken = useCallback(async (id) => {
    try {
      const response = await fetch(`/api/Tabletop/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar token');
      }
      
      setTokens(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      console.error('[useTabletopTokens] Erro ao deletar:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Carregar tokens na montagem
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