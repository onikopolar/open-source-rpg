// src/hooks/useTabletopTokens.js
import { useState, useEffect, useCallback } from 'react';

export function useTabletopTokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const criarToken = useCallback(async (tokenData) => {
    console.log('[useTabletopTokens] criarToken INICIADO');
    console.log('[useTabletopTokens] tokenData recebido:', tokenData);
    console.log('[useTabletopTokens] imageUrl:', tokenData.imageUrl);
    console.log('[useTabletopTokens] imageBase64:', tokenData.imageBase64 ? 'presente' : 'null');
    
    try {
      const bodyString = JSON.stringify(tokenData);
      console.log('[useTabletopTokens] body a ser enviado:', bodyString);
      
      const response = await fetch('/api/Tabletop/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyString
      });
      
      console.log('[useTabletopTokens] response status:', response.status);
      
      const data = await response.json();
      console.log('[useTabletopTokens] response data:', data);
      
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