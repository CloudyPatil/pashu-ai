"use client";

import React, { useState, useRef, useMemo, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import {
  suggestBreedFromImage,
  SuggestBreedFromImageOutput,
} from '@/ai/flows/suggest-breed-from-image';
import {
  identifyBreedOffline,
  IdentifyBreedOfflineOutput,
} from '@/ai/flows/identify-breed-offline';
import { improveModelAccuracy } from '@/ai/flows/improve-model-accuracy';
import { useToast } from '@/hooks/use-toast';
import { Language, translations } from '@/lib/translations';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, CheckCircle, RotateCcw, ThumbsDown, Upload, Video, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type BreedRecognitionProps = {
  language: Language;
  mode: 'online' | 'offline';
};

type BreedSuggestion = {
  breed: string;
  confidence: number;
  description: string;
  size: string;
  colors: string[];
  nutrition: string;
};

export default function BreedRecognition({
  language,
  mode,
}: BreedRecognitionProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<BreedSuggestion[]>([]);
  const [finalBreed, setFinalBreed] = useState<BreedSuggestion | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');


  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const t = useMemo(() => translations[language], [language]);

  const resetState = () => {
    setImageSrc(null);
    setIsLoading(false);
    setError(null);
    setSuggestions([]);
    setFinalBreed(null);
    setShowCorrection(false);
    setCorrectionText('');
    setIsUploading(false);
    setIsCameraOpen(false);
    setValidationError(null);
    if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };
  
  useEffect(() => {
    resetState();
  }, [mode]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: t.cameraAccessDeniedTitle,
          description: t.cameraAccessDeniedDescription,
        });
      }
    };

    if (isCameraOpen) {
      getCameraPermission();
    }
  
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [isCameraOpen, facingMode, toast, t]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resetState();
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setImageSrc(result);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError(t.errorDescription);
        setIsUploading(false);
      }
      reader.readAsDataURL(file);
    }
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if(context){
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUri = canvas.toDataURL('image/jpeg');
            setImageSrc(dataUri);
        }
        setIsCameraOpen(false);
    }
  };

  const handleDemoImageClick = async (imageUrl: string) => {
    resetState();
    setIsUploading(true);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError(t.errorDescription);
      toast({ variant: 'destructive', title: t.errorTitle, description: t.errorDescription });
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (imageSrc) {
      const analyzeImage = async () => {
        setIsLoading(true);
        setError(null);
        setValidationError(null);
        setSuggestions([]);

        try {
          if (mode === 'online') {
            const result: SuggestBreedFromImageOutput =
              await suggestBreedFromImage({ photoDataUri: imageSrc, language });

            if (!result.isAnimal) {
                setValidationError(result.reason || t.invalidImage);
            } else {
                setSuggestions(result.breedSuggestions.map(s => ({
                    breed: s.breed,
                    confidence: s.confidence,
                    description: s.description,
                    size: s.size,
                    colors: s.colors,
                    nutrition: s.nutrition
                })));
            }
          } else {
            const result: IdentifyBreedOfflineOutput =
              await identifyBreedOffline({ photoDataUri: imageSrc, language });
            
            if (!result.isAnimal) {
                setValidationError(result.reason || t.invalidImage);
            } else {
                setSuggestions([
                    {
                        breed: result.breedSuggestion,
                        confidence: result.confidenceScore,
                        description: result.description,
                        size: result.size,
                        colors: result.colors,
                        nutrition: result.nutrition
                    },
                ]);
            }
          }
        } catch (err) {
          setError(t.errorDescription);
          toast({ variant: 'destructive', title: t.errorTitle, description: (err as Error).message });
        } finally {
          setIsLoading(false);
        }
      };
      analyzeImage();
    }
  }, [imageSrc, mode, t, toast, language]);

  const handleConfirmBreed = (suggestion: BreedSuggestion) => {
    setFinalBreed(suggestion);
    setShowCorrection(false);
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionText.trim() || !imageSrc) return;

    await improveModelAccuracy({
      imageDataUri: imageSrc,
      correctedBreed: correctionText,
    });
    toast({
      title: t.correctionSubmittedTitle,
      description: t.correctionSubmittedDescription,
    });
    setFinalBreed({
        breed: correctionText,
        confidence: 1,
        description: t.noInfo,
        size: t.noInfo,
        colors: [],
        nutrition: t.noInfo,
      });
    setShowCorrection(false);
  };

  const handleRotateCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }

  const renderInitialState = () => (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline">{t.scanAnimal}</CardTitle>
        <CardDescription>{t.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          className="w-full"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-5 w-5" />
          {isUploading ? t.uploading : t.selectImage}
        </Button>
        <Button
          className="w-full"
          size="lg"
          variant="outline"
          onClick={() => setIsCameraOpen(true)}
          disabled={isUploading}
        >
          <Video className="mr-2 h-5 w-5" />
          {t.useCamera}
        </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          accept="image/*"
        />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">{t.tryDemo}</p>
          <div className="grid grid-cols-3 gap-4">
            {PlaceHolderImages.map((img) => (
              <button
                key={img.id}
                onClick={() => handleDemoImageClick(img.imageUrl)}
                className="overflow-hidden rounded-lg border-2 border-transparent hover:border-primary focus:border-primary focus:outline-none transition-all"
                disabled={isUploading}
              >
                <Image
                  src={img.imageUrl}
                  alt={img.description}
                  data-ai-hint={img.imageHint}
                  width={200}
                  height={150}
                  className="aspect-video object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCameraState = () => (
    <Card className="w-full">
        <CardHeader>
            <CardTitle>{t.useCamera}</CardTitle>
            <CardDescription>{t.positionAnimal}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Alert variant="destructive" className="m-4">
                            <AlertTitle>{t.cameraAccessRequiredTitle}</AlertTitle>
                            <AlertDescription>
                               {t.cameraAccessRequiredDescription}
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                 <Button variant="outline" size="icon" className="absolute top-2 right-2 z-10" onClick={handleRotateCamera} title={t.rotateCamera}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsCameraOpen(false)}>
                <X className="mr-2" />
                {t.cancel}
            </Button>
            <Button onClick={handleCapture} disabled={hasCameraPermission !== true}>
                <Camera className="mr-2" />
                {t.capture}
            </Button>
        </CardFooter>
    </Card>
  );

  const renderLoadingState = () => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t.analyzing}</CardTitle>
        <CardDescription>{t.analyzingDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageSrc && (
          <div className="relative overflow-hidden rounded-lg aspect-video">
            <Image
              src={imageSrc}
              alt={t.uploadedAnimalAlt}
              fill
              className="object-cover"
            />
            <div className="scan-line" />
          </div>
        )}
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );

  const renderResultsState = () => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t.aiSuggestions}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {imageSrc && (
          <div className="overflow-hidden rounded-lg">
            <Image
              src={imageSrc}
              alt={t.uploadedAnimalAlt}
              width={600}
              height={400}
              className="w-full object-cover"
            />
          </div>
        )}
        {error && (
            <Alert variant="destructive">
                <AlertTitle>{t.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {validationError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t.invalidImageTitle}</AlertTitle>
            <AlertDescription>
              {validationError} {t.tryAgain}
            </AlertDescription>
          </Alert>
        ) : (
            <Accordion type="single" collapsible className="w-full">
            {suggestions.map((s, i) => (
                <AccordionItem value={`item-${i}`} key={i}>
                    <AccordionTrigger>
                        <div className="w-full">
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-lg">{s.breed}</p>
                                <span className="text-sm text-muted-foreground pr-4">
                                {(s.confidence * 100).toFixed(0)}% {t.confidence}
                                </span>
                            </div>
                            <Progress value={s.confidence * 100} className="mt-2" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                        <p>{s.description}</p>
                        <div>
                            <h4 className="font-semibold">{t.size}</h4>
                            <p>{s.size}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">{t.colors}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {s.colors.map(color => <Badge key={color} variant="secondary">{color}</Badge>)}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold">{t.nutrition}</h4>
                            <p>{s.nutrition}</p>
                        </div>
                        <Button
                            className="w-full mt-2"
                            onClick={() => handleConfirmBreed(s)}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t.confirm}
                        </Button>
                    </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        {validationError ? (
            <Button className="w-full" onClick={resetState}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t.startOver}
            </Button>
        ) : (
            <>
            <Button variant="outline" onClick={() => setShowCorrection(!showCorrection)}>
                <ThumbsDown className="mr-2 h-4 w-4" />
                {t.correctionPrompt}
            </Button>
            {showCorrection && (
                <form onSubmit={handleCorrectionSubmit} className="w-full space-y-2">
                <Input
                    placeholder={t.enterCorrectBreed}
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    required
                />
                <Button type="submit" className="w-full">{t.submitCorrection}</Button>
                </form>
            )}
            </>
        )}
      </CardFooter>
    </Card>
  );
  
  const renderFinalState = () => (
    <Card className="w-full">
        <CardHeader className="text-center">
            <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit">
                <CheckCircle className="h-8 w-8 text-accent-foreground" />
            </div>
            <CardTitle className="font-headline">{t.finalBreed}</CardTitle>
            <CardDescription className="text-2xl font-bold text-primary">{finalBreed?.breed}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {imageSrc && (
            <div className="overflow-hidden rounded-lg">
                <Image
                src={imageSrc}
                alt={t.uploadedAnimalAlt}
                width={600}
                height={400}
                className="w-full object-cover"
                />
            </div>
            )}
            <div className="space-y-4 text-left">
                <p>{finalBreed?.description}</p>
                <div>
                    <h4 className="font-semibold">{t.size}</h4>
                    <p>{finalBreed?.size}</p>
                </div>
                {finalBreed && finalBreed.colors.length > 0 && (
                    <div>
                        <h4 className="font-semibold">{t.colors}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {finalBreed.colors.map(color => <Badge key={color} variant="secondary">{color}</Badge>)}
                        </div>
                    </div>
                )}
                <div>
                    <h4 className="font-semibold">{t.nutrition}</h4>
                    <p>{finalBreed?.nutrition}</p>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button className="w-full" onClick={resetState}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t.startOver}
            </Button>
        </CardFooter>
    </Card>
  );

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">
        { isCameraOpen
            ? renderCameraState()
            : finalBreed 
                ? renderFinalState() 
                : !imageSrc && !isUploading
                    ? renderInitialState()
                    : isLoading || isUploading
                        ? renderLoadingState()
                        : renderResultsState()
        }
    </div>
  );
}
