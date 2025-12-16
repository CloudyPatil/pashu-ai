"use client";

import React, { useState, useRef, useMemo, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import {
  diagnoseAnimalHealth,
  DiagnoseAnimalHealthOutput,
} from '@/ai/flows/diagnose-animal-health';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, RotateCcw, Upload, Video, X, RefreshCw, HeartPulse, Sparkles, ShieldCheck, Siren, Activity, ListPlus, LifeBuoy, Loader2, Search, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { findVetServices, FindVetServicesOutput } from '@/ai/flows/find-vet-services';


type DiseaseDetectionProps = {
  language: Language;
};

type Symptom = 'lethargy' | 'appetiteLoss' | 'coughing' | 'sores' | 'limping' | 'swelling' | 'discharge' | 'diarrhea';

export default function DiseaseDetection({ language }: DiseaseDetectionProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [symptomDescription, setSymptomDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnoseAnimalHealthOutput | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<Symptom>>(new Set());
  const [location, setLocation] = useState('');
  const [isFindingVets, setIsFindingVets] = useState(false);
  const [vetServices, setVetServices] = useState<FindVetServicesOutput | null>(null);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const t = useMemo(() => translations[language], [language]);

  const symptomOptions: { id: Symptom; label: keyof (typeof t) }[] = [
      { id: 'lethargy', label: 'symptomLethargy' },
      { id: 'appetiteLoss', label: 'symptomAppetiteLoss' },
      { id: 'coughing', label: 'symptomCoughing' },
      { id: 'sores', label: 'symptomSores' },
      { id: 'limping', label: 'symptomLimping' },
      { id: 'swelling', label: 'symptomSwelling' },
      { id: 'discharge', label: 'symptomDischarge' },
      { id: 'diarrhea', label: 'symptomDiarrhea' },
  ];

  const resetState = () => {
    setImageSrc(null);
    setSymptomDescription('');
    setIsLoading(false);
    setError(null);
    setDiagnosisResult(null);
    setIsUploading(false);
    setIsCameraOpen(false);
    setSelectedSymptoms(new Set());
    setLocation('');
    setVetServices(null);
    setIsFindingVets(false);
    setIsHelplineOpen(false);
    if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

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
    setIsUploading(true);
    setError(null);
    setDiagnosisResult(null);

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

  const handleAnalysis = async () => {
    if (!imageSrc) return;

    setIsLoading(true);
    setError(null);
    setDiagnosisResult(null);
    
    const checkedSymptoms = symptomOptions
        .filter(symptom => selectedSymptoms.has(symptom.id))
        .map(symptom => t[symptom.label])
        .join(', ');

    const fullDescription = [symptomDescription, checkedSymptoms].filter(Boolean).join('. ');

    try {
      const result = await diagnoseAnimalHealth({
        photoDataUri: imageSrc,
        description: fullDescription,
        language,
      });
      setDiagnosisResult(result);
    } catch (err: any) {
      if (err.message && err.message.includes('503')) {
        setError(t.serviceUnavailableError);
      } else {
        setError(t.errorDescription);
      }
      toast({ variant: 'destructive', title: t.errorTitle, description: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSymptomToggle = (symptom: Symptom, checked: boolean) => {
    setSelectedSymptoms(prev => {
        const newSet = new Set(prev);
        if(checked) {
            newSet.add(symptom);
        } else {
            newSet.delete(symptom);
        }
        return newSet;
    })
  }
  
  const handleFindVets = async () => {
    if (!location) return;

    setIsFindingVets(true);
    setVetServices(null);
    setError(null);

    try {
        const result = await findVetServices({ location, language });
        setVetServices(result);
    } catch (err: any) {
        if (err.message && err.message.includes('503')) {
            setError(t.serviceUnavailableError);
        } else {
            setError(t.errorDescription);
        }
        toast({ variant: 'destructive', title: t.errorTitle, description: (err as Error).message });
    } finally {
        setIsFindingVets(false);
    }
  };

  const handleRotateCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }
  
  const UrgencyBadge = ({ urgency }: { urgency: 'Low' | 'Medium' | 'High' }) => {
    const urgencyMap = {
      Low: {
        label: t.Low,
        icon: <Activity className="h-4 w-4" />,
        variant: 'default',
        className: 'bg-green-500/20 text-green-700 border-green-500/50',
      },
      Medium: {
        label: t.Medium,
        icon: <Siren className="h-4 w-4" />,
        variant: 'default',
        className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50',
      },
      High: {
        label: t.High,
        icon: <Siren className="h-4 w-4" />,
        variant: 'destructive',
        className: 'bg-red-500/20 text-red-700 border-red-500/50',
      },
    };
    const { label, icon, variant, className: badgeClassName } = urgencyMap[urgency];
  
    return (
      <Badge variant={variant as any} className={cn('gap-1.5', badgeClassName)}>
        {icon}
        {label}
      </Badge>
    );
  };

  const renderInitialState = () => (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
          <HeartPulse className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline">{t.detectDisease}</CardTitle>
        <CardDescription>{t.detectDiseaseDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!imageSrc ? (
            <div className="space-y-4">
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
                    {PlaceHolderImages.slice(0,3).map((img) => (
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
            </div>
        ) : (
            <div className="space-y-4">
                 <div className="relative overflow-hidden rounded-lg">
                    <Image
                        src={imageSrc}
                        alt={t.uploadedAnimalAlt}
                        width={600}
                        height={400}
                        className="w-full object-cover"
                    />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-10" onClick={resetState}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <Textarea
                    placeholder={t.symptomDescriptionPlaceholder}
                    value={symptomDescription}
                    onChange={(e) => setSymptomDescription(e.target.value)}
                    rows={3}
                />
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <ListPlus className="mr-2 h-4 w-4" />
                            {t.addSymptoms}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t.commonSymptoms}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            {symptomOptions.map(symptom => (
                                <div key={symptom.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={symptom.id}
                                        checked={selectedSymptoms.has(symptom.id)}
                                        onCheckedChange={(checked) => handleSymptomToggle(symptom.id, !!checked)}
                                    />
                                    <label htmlFor={symptom.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {t[symptom.label]}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
                {selectedSymptoms.size > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{t.selectedSymptoms}:</p>
                        <div className="flex flex-wrap gap-2">
                            {symptomOptions.filter(s => selectedSymptoms.has(s.id)).map(s => (
                                <Badge key={s.id} variant="secondary">{t[s.label]}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                <Button onClick={handleAnalysis} className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                        <><Sparkles className="mr-2 h-5 w-5 animate-spin" /> {t.analyzingHealth}</>
                    ) : (
                        <>{t.getDiagnosis}</>
                    )}
                </Button>
            </div>
        )}
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
        <CardTitle>{t.analyzingHealth}</CardTitle>
        <CardDescription>{t.analyzingHealthDescription}</CardDescription>
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
        <CardTitle>{t.diagnosisResult}</CardTitle>
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
        {error && !isFindingVets && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {diagnosisResult && (
            <>
            {diagnosisResult.isHealthy ? (
                <Alert variant="default" className="border-green-500/50">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">{t.noDiseaseDetected}</AlertTitle>
                    <AlertDescription>
                        <p className="font-semibold mt-2">{t.preventiveCare}:</p>
                        {diagnosisResult.preventiveCare}
                    </AlertDescription>
                </Alert>
            ) : (
                <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {diagnosisResult.diagnosis?.map((d, i) => (
                        <AccordionItem value={`item-${i}`} key={i}>
                            <AccordionTrigger>
                                <div className="w-full flex justify-between items-center pr-4">
                                    <p className="font-bold text-lg">{d.diseaseName}</p>
                                    <UrgencyBadge urgency={d.urgency} />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                <p>{d.description}</p>
                                <div>
                                    <h4 className="font-semibold text-amber-700">{t.firstAid}</h4>
                                    <p>{d.firstAid}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-red-700">{t.veterinaryAttention}</h4>
                                    <p>{d.veterinaryAttention}</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
            </>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-4 items-stretch">
        {diagnosisResult && !diagnosisResult.isHealthy && (
            <Dialog open={isHelplineOpen} onOpenChange={setIsHelplineOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        {t.emergencyHelpline}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.findVet}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{t.enterLocation}</p>
                        <div className="flex gap-2">
                            <Input 
                                placeholder={t.locationPlaceholder}
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                            <Button onClick={handleFindVets} disabled={isFindingVets || !location}>
                                {isFindingVets ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>

                        {isFindingVets && <div className="text-sm text-muted-foreground">{t.findingHelp}...</div>}

                        {vetServices && (
                            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {vetServices.services.map((service, index) => (
                                    <div key={index} className="p-3 border rounded-md">
                                        <div className="font-bold flex items-center gap-2">
                                            <span>{service.name}</span>
                                            <Badge variant="outline">{t[service.type as keyof typeof t] || service.type}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{service.address}</p>
                                        <a href={`tel:${service.phone}`} className="text-sm text-primary hover:underline">{service.phone}</a>
                                    </div>
                                ))}
                                {vetServices.services.length === 0 && <p>{t.noVetsFound}</p>}
                            </div>
                        )}
                         {error && isFindingVets && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t.errorTitle}</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        )}
        <Button className="w-full" onClick={resetState} variant="outline">
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
            : diagnosisResult || (error && !isFindingVets)
                ? renderResultsState()
                : isLoading
                    ? renderLoadingState()
                    : renderInitialState()
        }
    </div>
  );
}
