import React, { useEffect, useState } from 'react';
import { CloudRain, Sunset, Loader2, Info } from 'lucide-react';
import { Category } from '../../types';

interface ContextualEnrichmentProps {
  category: Category;
  title: string;
  lat?: number;
  lng?: number;
}

export function ContextualEnrichment({ category, title, lat = 37.7749, lng = -122.4194 }: ContextualEnrichmentProps) {
  const [data, setData] = useState<{ type: 'weather' | 'sunset' | null; value: string | null; loading: boolean }>({
    type: null,
    value: null,
    loading: true
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const isWaterRelated = category === 'Water leakage' || title.toLowerCase().includes('flood');
        const isLightingRelated = category === 'Broken streetlight' || title.toLowerCase().includes('light');

        if (isWaterRelated) {
          // Fetch past 24h rain
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&past_days=1&daily=precipitation_sum&timezone=auto`);
          const json = await res.json();
          const rainMm = json.daily?.precipitation_sum?.[0] || 0;
          const rainInches = (rainMm * 0.0393701).toFixed(2);
          
          setData({
            type: 'weather',
            value: `${rainInches} inches of rain recorded in this area in the last 24 hours.`,
            loading: false
          });
        } else if (isLightingRelated) {
          // Fetch sunset time
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=sunset&timezone=auto`);
          const json = await res.json();
          const sunsetRaw = json.daily?.sunset?.[0];
          const sunsetTime = sunsetRaw ? new Date(sunsetRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown';
          
          setData({
            type: 'sunset',
            value: `Sunset in this area is scheduled for ${sunsetTime} today.`,
            loading: false
          });
        } else {
          setData({ type: null, value: null, loading: false });
        }
      } catch (error) {
        console.error('Failed to fetch enrichment data:', error);
        setData({ type: null, value: null, loading: false });
      }
    }

    fetchData();
  }, [category, title, lat, lng]);

  if (data.loading) {
    return (
      <div className="bg-[#f8f9fc] dark:bg-slate-900 p-5 rounded-[20px] border border-[#e2e8f0] dark:border-slate-800 shadow-sm flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-slate-400 dark:text-slate-500 animate-spin" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Querying open data sources...</span>
      </div>
    );
  }

  if (!data.type || !data.value) {
    return null; // No relevant open data for this case type
  }

  return (
    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-[20px] border border-indigo-100 dark:border-indigo-900/30 shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
        {data.type === 'weather' ? <CloudRain className="w-4 h-4" /> : <Sunset className="w-4 h-4" />}
        Contextual Open-Data Enrichment
      </div>
      <p className="text-indigo-900 dark:text-indigo-200 font-bold text-sm leading-relaxed flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" />
        {data.value}
      </p>
    </div>
  );
}
