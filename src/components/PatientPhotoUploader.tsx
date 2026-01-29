import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2 } from 'lucide-react';

interface PatientPhotoUploaderProps {
    currentPhotoUrl?: string | null;
    onUploadComplete?: (url: string) => void;
}

export function PatientPhotoUploader({ currentPhotoUrl, onUploadComplete }: PatientPhotoUploaderProps = {}) {
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);

    useEffect(() => {
        if (currentPhotoUrl) {
            setPreview(currentPhotoUrl);
        }
    }, [currentPhotoUrl]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            // 1. Check for file presence
            if (!event.target.files || event.target.files.length === 0) {
                // User cancelled file selection
                setUploading(false);
                return;
            }

            const file = event.target.files[0];

            // 2. Safely get the authenticated user
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error('You must be logged in to upload a photo.');
            }

            // 3. Extract file extension and build path
            // We use name split as fallback to type split for better extension handling
            const fileExt = file.name.split('.').pop() || 'jpg';
            const filePath = `${user.id}/profile.${fileExt}`;

            // DEBUG LOGS (Do not remove)
            console.log('User ID:', user.id);
            console.log('File Extension:', fileExt);
            console.log('Upload Path:', filePath);

            // 4. Upload to Supabase Storage
            const { error: storageError } = await supabase.storage
                .from('patient-photos')
                .upload(filePath, file, { upsert: true });

            if (storageError) throw storageError;

            // 5. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('patient-photos')
                .getPublicUrl(filePath);

            // 6. Update Profile (Save clean URL to DB)
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ photo_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Cache Busting: Append timestamp ONLY for frontend display
            const timestamp = Date.now();
            const publicUrlWithCacheBust = `${publicUrl}?v=${timestamp}`;

            setPreview(publicUrlWithCacheBust);

            if (onUploadComplete) {
                onUploadComplete(publicUrlWithCacheBust);
            }

            toast({ title: 'Success', description: 'Patient photo uploaded successfully.' });

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast({
                title: 'Upload Failed',
                description: error.message || 'Error uploading photo.',
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
            // Reset the input value so the same file can be selected again if needed
            event.target.value = '';
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-slate-50">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-md flex items-center justify-center">
                {preview ? (
                    <img src={preview} alt="Patient" className="h-full w-full object-cover" />
                ) : (
                    <Camera className="h-8 w-8 text-slate-400" />
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center gap-2">
                <Button variant="outline" size="sm" className="relative cursor-pointer" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Change Photo'}
                    <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </Button>
                <p className="text-xs text-muted-foreground">Formats: JPG, PNG</p>
            </div>
        </div>
    );
}