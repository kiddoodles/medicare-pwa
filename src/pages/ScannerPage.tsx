import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { medicationInfoApi } from '@/db/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Search, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MedicationInfo } from '@/types';

export default function ScannerPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicationInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
        toast({
          title: 'Photo Captured',
          description: 'You can now search for the medication or add it manually.',
        });
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await medicationInfoApi.searchMedications(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast({
          title: 'No results',
          description: 'No medications found matching your search.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search medications.',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMedication = (medication: MedicationInfo) => {
    navigate('/medications/add', { state: { medicationInfo: medication, capturedImage } });
  };

  const handleAddManually = () => {
    navigate('/medications/add', { state: { capturedImage } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Medication Scanner</h1>
        <p className="text-muted-foreground">Capture or search for medications</p>
      </div>

      {/* Camera Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Scanner
          </CardTitle>
          <CardDescription>
            Take a photo of your medication packaging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!cameraActive && !capturedImage && (
            <div className="flex flex-col items-center justify-center py-12 bg-muted rounded-lg">
              <div className="p-8 bg-primary/10 rounded-full mb-4">
                <Camera className="h-16 w-16 text-primary" />
              </div>
              <p className="text-muted-foreground text-center mb-4">
                Use your camera to capture medication packaging
              </p>
              <Button onClick={startCamera} size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Start Camera
              </Button>
            </div>
          )}

          {cameraActive && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={capturePhoto} className="flex-1" size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Capture Photo
                </Button>
                <Button onClick={stopCamera} variant="outline" size="lg">
                  <X className="mr-2 h-5 w-5" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden">
                <img src={capturedImage} alt="Captured medication" className="w-full h-auto" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddManually} className="flex-1" size="lg">
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Add Medication
                </Button>
                <Button
                  onClick={() => {
                    setCapturedImage(null);
                    startCamera();
                  }}
                  variant="outline"
                  size="lg"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Retake
                </Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Medications
          </CardTitle>
          <CardDescription>Find medications in our database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Medication Name</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., Aspirin, Metformin..."
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="mr-2 h-4 w-4" />
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((medication) => (
                  <Card
                    key={medication.id}
                    className="cursor-pointer hover:shadow-hover transition-shadow"
                    onClick={() => handleSelectMedication(medication)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{medication.medication_name}</CardTitle>
                      {medication.uses && (
                        <CardDescription className="line-clamp-2">
                          {medication.uses}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
