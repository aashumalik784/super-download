import { useState, useEffect, useCallback } from 'react';
import type { VideoInfo } from '@workspace/api-client-react';

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: string;
  timestamp: number;
}

const HISTORY_KEY = 'vidgrab-history';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  const addHistory = useCallback((info: VideoInfo) => {
    setHistory(prev => {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        url: info.url,
        title: info.title,
        thumbnail: info.thumbnail,
        platform: info.platform,
        timestamp: Date.now()
      };
      
      const filtered = prev.filter(item => item.url !== info.url);
      const next = [newItem, ...filtered].slice(0, 10);
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save history', e);
      }
      
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return { history, addHistory, clearHistory };
}
