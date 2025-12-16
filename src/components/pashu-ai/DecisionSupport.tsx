"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { recommendBreeds } from '@/ai/flows/recommend-breeds';
import type { RecommendBreedsInput, RecommendBreedsOutput } from '@/ai/schemas/recommend-breeds-schema';
import { Language, translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { BrainCircuit, Loader2, Search, Scale } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type DecisionSupportProps = {
  language: Language;
};

type RecommendedBreed = RecommendBreedsOutput['recommendedBreeds'][0];

const formSchema = z.object({
  goal: z.enum(['milk', 'draught', 'dual-purpose', 'low-maintenance']),
  budget: z.coerce.number().min(10000, "Budget must be at least 10,000"),
  landSize: z.coerce.number().min(0.1, "Land size must be positive"),
  regionalClimate: z.string().min(1, "Climate is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function DecisionSupport({ language }: DecisionSupportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendBreedsOutput | null>(null);
  const [selectedBreeds, setSelectedBreeds] = useState<RecommendedBreed[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const t = useMemo(() => translations[language], [language]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal: 'milk',
      budget: 50000,
      landSize: 1,
      regionalClimate: 'Hot and Dry',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    setSelectedBreeds([]);

    const input: RecommendBreedsInput = {
      ...values,
      language,
    };

    try {
      const result = await recommendBreeds(input);
      setRecommendations(result);
    } catch (err: any) {
        if (err.message && err.message.includes('503')) {
            setError(t.serviceUnavailableError);
        } else {
            setError(t.errorDescription);
        }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBreedSelection = (breed: RecommendedBreed, isSelected: boolean) => {
    if (isSelected) {
        if(selectedBreeds.length < 3) {
            setSelectedBreeds([...selectedBreeds, breed]);
        }
    } else {
        setSelectedBreeds(selectedBreeds.filter(b => b.breedName !== breed.breedName));
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <BrainCircuit className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="font-headline">{t.breedRecommendationEngine}</CardTitle>
              <CardDescription>{t.findThePerfectBreed}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.primaryGoal}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectGoalPlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="milk">{t.highMilkYield}</SelectItem>
                          <SelectItem value="draught">{t.draughtStrength}</SelectItem>
                          <SelectItem value="dual-purpose">{t.dualPurpose}</SelectItem>
                          <SelectItem value="low-maintenance">{t.lowMaintenance}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="regionalClimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.regionalClimate}</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectClimatePlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Hot and Dry">{t.climateHotDry}</SelectItem>
                          <SelectItem value="Hot and Humid">{t.climateHotHumid}</SelectItem>
                          <SelectItem value="Moderate">{t.climateModerate}</SelectItem>
                          <SelectItem value="Cold">{t.climateCold}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.budgetPerAnimalInRupees} (₹{field.value.toLocaleString()})</FormLabel>
                       <FormControl>
                        {isClient ? (
                         <Slider
                            min={10000}
                            max={200000}
                            step={5000}
                            defaultValue={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        ) : <div className="h-5" />}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="landSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.landSizeInAcres} ({field.value} {t.acres})</FormLabel>
                       <FormControl>
                        {isClient ? (
                         <Slider
                            min={0.1}
                            max={20}
                            step={0.1}
                            defaultValue={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        ) : <div className="h-5" />}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.findingBestBreeds}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {t.getRecommendations}
                  </>
                )}
              </Button>
            </form>
          </Form>

           {error && (
            <Alert variant="destructive" className="mt-8">
              <AlertTitle>{t.errorTitle}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {recommendations && (
             <div className="mt-12 space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-center font-headline">{t.topRecommendations}</h2>
                    {selectedBreeds.length >= 2 && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Scale className="mr-2 h-4 w-4" />
                                    {t.compare} ({selectedBreeds.length})
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>{t.compareBreeds}</DialogTitle>
                                </DialogHeader>
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t.feature}</TableHead>
                                            {selectedBreeds.map(b => <TableHead key={b.breedName} className="text-center">{b.breedName}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">{t.overallScore}</TableCell>
                                            {selectedBreeds.map(b => <TableCell key={b.breedName} className="text-center">{b.overallScore.toFixed(1)} / 10</TableCell>)}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">{t.estimatedROI}</TableCell>
                                            {selectedBreeds.map(b => <TableCell key={b.breedName} className={cn("text-center font-bold", b.roi > 50 ? 'text-green-500' : b.roi > 20 ? 'text-yellow-500' : 'text-red-500')}>{b.roi.toFixed(0)}%</TableCell>)}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">{t.careLevel}</TableCell>
                                            {selectedBreeds.map(b => <TableCell key={b.breedName} className="text-center">{b.careLevel}</TableCell>)}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">{t.pros}</TableCell>
                                            {selectedBreeds.map(b => <TableCell key={b.breedName} className="text-xs">{b.pros}</TableCell>)}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">{t.cons}</TableCell>
                                            {selectedBreeds.map(b => <TableCell key={b.breedName} className="text-xs">{b.cons}</TableCell>)}
                                        </TableRow>
                                    </TableBody>
                                </Table>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
                {recommendations.recommendedBreeds.length === 0 && (
                  <Alert>
                    <AlertTitle>{t.noBreedsFoundTitle}</AlertTitle>
                    <AlertDescription>{t.noBreedsFoundDescription}</AlertDescription>
                  </Alert>
                )}
                {recommendations.recommendedBreeds.map((rec, index) => (
                    <Card key={index} className="overflow-hidden">
                       <CardHeader className="bg-muted/50 p-4">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div className="flex-1 space-y-1">
                                    <CardTitle className="text-xl font-bold text-primary">{index + 1}. {rec.breedName}</CardTitle>
                                    <CardDescription>{t.overallScore}: {rec.overallScore.toFixed(1)} / 10</CardDescription>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                     <div className="text-center">
                                        <p className="font-semibold text-sm text-muted-foreground">{t.careLevel}</p>
                                        <Badge 
                                            variant={rec.careLevel === 'Low' ? 'default' : rec.careLevel === 'Medium' ? 'secondary' : 'destructive'}
                                            className={cn('text-xs', rec.careLevel === 'Low' && 'bg-accent text-accent-foreground')}
                                        >
                                            {t[rec.careLevel as keyof typeof t]}
                                        </Badge>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-sm text-muted-foreground">{t.estimatedROI}</p>
                                        <p className={cn('text-xl font-bold', rec.roi > 50 ? 'text-green-500' : rec.roi > 20 ? 'text-yellow-500' : 'text-red-500')}>
                                            {rec.roi.toFixed(0)}%
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2 pl-4 border-l">
                                        <Checkbox 
                                            id={`compare-${index}`}
                                            onCheckedChange={(checked) => handleBreedSelection(rec, !!checked)}
                                            disabled={selectedBreeds.length >= 3 && !selectedBreeds.some(b => b.breedName === rec.breedName)}
                                        />
                                        <label htmlFor={`compare-${index}`} className="text-sm font-medium text-muted-foreground">{t.compare}</label>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold">{t.pros}</h4>
                                    <p className="text-sm text-muted-foreground">{rec.pros}</p>
                                </div>
                                 <div>
                                    <h4 className="font-semibold">{t.cons}</h4>
                                    <p className="text-sm text-muted-foreground">{rec.cons}</p>
                                 </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold mb-2">{t.suitabilityScorecard}</h4>
                                {Object.entries(rec.scores).map(([key, value]) => (
                                    <div key={key} className="w-full">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-muted-foreground">{t[key as keyof typeof t] || key}</span>
                                            <span className="text-sm font-bold">{value} / 10</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </CardContent>
                    </Card>
                ))}
             </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
