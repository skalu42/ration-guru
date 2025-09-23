import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

interface SearchHistoryItem {
  id: string;
  query: string;
  created_at: string;
}

export const useSearchHistory = () => {
  const { user } = useAuth();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadSearchHistory();
    } else {
      // For non-authenticated users, use localStorage
      const localHistory = localStorage.getItem('search_history');
      if (localHistory) {
        setSearchHistory(JSON.parse(localHistory));
      }
    }
  }, [user]);

  const loadSearchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('query')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const queries = data?.map(item => item.query) || [];
      setSearchHistory(queries);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const addToHistory = async (query: string) => {
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    
    if (user) {
      // Save to database for authenticated users
      try {
        await supabase
          .from('search_history')
          .insert([{ user_id: user.id, query: trimmedQuery }]);
        
        // Update local state
        setSearchHistory(prev => {
          const filtered = prev.filter(item => item !== trimmedQuery);
          return [trimmedQuery, ...filtered].slice(0, 10);
        });
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    } else {
      // Save to localStorage for non-authenticated users
      const newHistory = [trimmedQuery, ...searchHistory.filter(item => item !== trimmedQuery)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('search_history', JSON.stringify(newHistory));
    }
  };

  const clearHistory = async () => {
    if (user) {
      try {
        await supabase
          .from('search_history')
          .delete()
          .eq('user_id', user.id);
        
        setSearchHistory([]);
      } catch (error) {
        console.error('Error clearing search history:', error);
      }
    } else {
      setSearchHistory([]);
      localStorage.removeItem('search_history');
    }
  };

  return {
    searchHistory,
    addToHistory,
    clearHistory
  };
};