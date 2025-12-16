"use client";

import React, { useState, useMemo } from 'react';
import Header from '@/components/pashu-ai/Header';
import { Language, translations } from '@/lib/translations';
import DecisionSupport from '@/components/pashu-ai/DecisionSupport';

export default function DecisionSupportPage() {
  const [language, setLanguage] = useState<Language>('en');
  // Mode is not used on this page, but the header needs it.
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
        <DecisionSupport language={language} />
      </main>
    </div>
  );
}
