"use client";

import React, { useState, useMemo } from 'react';
import Header from '@/components/pashu-ai/Header';
import BreedRecognition from '@/components/pashu-ai/BreedRecognition';
import { Language, translations } from '@/lib/translations';

export default function ScannerPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [mode, setMode] = useState<'online' | 'offline'>('online');

  const t = useMemo(() => translations[language], [language]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header
        language={language}
        onLanguageChange={setLanguage}
        mode={mode}
        onModeChange={setMode}
        appName={t.appName}
        tagline={t.tagline}
        onlineText={t.online}
        offlineText={t.offline}
      />
      <main className="flex-1">
        <BreedRecognition language={language} mode={mode} />
      </main>
    </div>
  );
}
