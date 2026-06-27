import React from 'react';
import { Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LanguageSelector() {
  const { language, setLanguage } = useAuth();
  
  return (
    <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 px-3 py-1.5">
      <Globe className="w-4 h-4 text-slate-500 mr-2" />
      <select 
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
      >
        <option value="en" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">English</option>
        <option value="es" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Español</option>
        <option value="fr" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Français</option>
        <option value="de" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Deutsch</option>
        <option value="zh" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">中文</option>
        <option value="hi" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">हिन्दी</option>
      </select>
    </div>
  );
}
