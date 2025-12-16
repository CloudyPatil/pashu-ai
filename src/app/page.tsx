"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Scan, BrainCircuit, HeartPulse } from 'lucide-react';
import Header from '@/components/pashu-ai/Header';
import { Language, translations } from '@/lib/translations';
import { CowIcon } from '@/components/pashu-ai/icons';

export default function MainPage() {
  const [language, setLanguage] = React.useState<Language>('en');
  // Mode is not used on this page, but the header needs it.
  const [mode, setMode] = React.useState<'online' | 'offline'>('online');
  const t = React.useMemo(() => translations[language], [language]);

  const features = [
    {
      title: t.scanAnimal,
      description: "Instantly identify cattle and buffalo breeds using your camera or by uploading an image.",
      href: '/scanner',
      icon: <Scan className="h-10 w-10 text-primary" />,
    },
    {
      title: t.breedRecommendationEngine,
      description: "Get tailored recommendations for the best breeds based on your specific farming goals and conditions.",
      href: '/decision-support',
      icon: <BrainCircuit className="h-10 w-10 text-primary" />,
    },
    {
      title: t.diseaseDetection,
      description: "Upload an image of an animal to detect early signs of common diseases and get care suggestions.",
      href: '/disease-detection',
      icon: <HeartPulse className="h-10 w-10 text-primary" />,
    }
  ];

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
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: [0, 0.71, 0.2, 1.01],
          }}
          className="mb-8 flex flex-col items-center"
        >
          <CowIcon className="h-24 w-24 text-primary" />
          <h1 className="text-5xl font-bold font-headline mt-4 text-primary">{t.appName}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{t.tagline}</p>
        </motion.div>

        <div className="w-full max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                    <Link href={feature.href} key={index}>
                        <motion.div
                             initial={{ opacity: 0, y: 50 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.5 + index * 0.2, duration: 0.5 }}
                             className="bg-card rounded-xl shadow-md hover:shadow-xl transition-shadow p-8 flex flex-col items-center h-full cursor-pointer border"
                        >
                            <div className="bg-primary/10 p-4 rounded-full">
                                {feature.icon}
                            </div>
                            <h2 className="text-2xl font-bold font-headline mt-6">{feature.title}</h2>
                            <p className="text-muted-foreground mt-2">{feature.description}</p>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}
