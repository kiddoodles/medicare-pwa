import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Activity, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useDiseaseAI } from '@/hooks/useAI';
import { Bot, Loader2, X } from 'lucide-react';

/* -------------------- MEDICAL CONDITIONS (UNCHANGED) -------------------- */
export const medicalConditions = [
  { value: 'hypertension', label: 'Hypertension (High Blood Pressure)', medications: ['Amlodipine', 'Losartan', 'Lisinopril'] },
  { value: 'diabetes_type1', label: 'Diabetes Type 1', medications: ['Insulin (Rapid / Long Acting)'] },
  { value: 'diabetes_type2', label: 'Diabetes Type 2', medications: ['Metformin', 'Glimepiride', 'Insulin'] },
  { value: 'heart_disease', label: 'Heart Disease', medications: ['Aspirin', 'Atorvastatin', 'Metoprolol'] },
  { value: 'asthma', label: 'Asthma', medications: ['Salbutamol', 'Budesonide'] },
  { value: 'copd', label: 'COPD', medications: ['Tiotropium', 'Salbutamol'] },
  { value: 'depression', label: 'Depression', medications: ['Sertraline', 'Fluoxetine'] },
  { value: 'anxiety', label: 'Anxiety Disorder', medications: ['Escitalopram', 'Clonazepam'] },
  { value: 'arthritis', label: 'Arthritis', medications: ['Ibuprofen', 'Naproxen', 'Prednisone'] },
  { value: 'osteoporosis', label: 'Osteoporosis', medications: ['Calcium', 'Vitamin D', 'Alendronate'] },
  { value: 'gerd', label: 'GERD (Acid Reflux)', medications: ['Omeprazole', 'Pantoprazole'] },
  { value: 'thyroid_hypo', label: 'Hypothyroidism', medications: ['Levothyroxine'] },
  { value: 'thyroid_hyper', label: 'Hyperthyroidism', medications: ['Carbimazole', 'Methimazole'] },
  { value: 'high_cholesterol', label: 'High Cholesterol', medications: ['Atorvastatin', 'Rosuvastatin'] },
  { value: 'migraine', label: 'Migraine', medications: ['Sumatriptan', 'Propranolol'] },
  { value: 'epilepsy', label: 'Epilepsy', medications: ['Levetiracetam', 'Sodium Valproate'] },
  { value: 'parkinsons', label: "Parkinson's Disease", medications: ['Levodopa', 'Carbidopa'] },
  { value: 'alzheimers', label: "Alzheimer's Disease", medications: ['Donepezil', 'Memantine'] },
  { value: 'multiple_sclerosis', label: 'Multiple Sclerosis', medications: ['Interferon beta'] },
  { value: 'lupus', label: 'Lupus', medications: ['Hydroxychloroquine', 'Prednisone'] },
  { value: 'crohns', label: "Crohn's Disease", medications: ['Azathioprine', 'Infliximab'] },
  { value: 'ulcerative_colitis', label: 'Ulcerative Colitis', medications: ['Mesalamine', 'Prednisone'] },
  { value: 'ibs', label: 'Irritable Bowel Syndrome (IBS)', medications: ['Dicycloverine', 'Loperamide'] },
  { value: 'kidney_disease', label: 'Chronic Kidney Disease', medications: ['Erythropoietin', 'Furosemide'] },
  { value: 'liver_disease', label: 'Liver Disease', medications: ['Ursodeoxycholic Acid'] },
  { value: 'cancer', label: 'Cancer', medications: ['Chemotherapy / Targeted Therapy'] },
  { value: 'hiv', label: 'HIV/AIDS', medications: ['Antiretroviral Therapy (ART)'] },
  { value: 'hepatitis', label: 'Hepatitis', medications: ['Tenofovir', 'Interferon'] },
  { value: 'psoriasis', label: 'Psoriasis', medications: ['Methotrexate', 'Topical Steroids'] },
  { value: 'eczema', label: 'Eczema', medications: ['Topical Steroids', 'Antihistamines'] },
  { value: 'sleep_apnea', label: 'Sleep Apnea', medications: ['CPAP Therapy'] },
  { value: 'anemia', label: 'Anemia', medications: ['Iron Supplements', 'Vitamin B12'] },
  { value: 'glaucoma', label: 'Glaucoma', medications: ['Timolol Eye Drops'] },
  { value: 'bipolar', label: 'Bipolar Disorder', medications: ['Lithium', 'Valproate'] },
  { value: 'schizophrenia', label: 'Schizophrenia', medications: ['Risperidone', 'Olanzapine'] },
  { value: 'adhd', label: 'ADHD', medications: ['Methylphenidate', 'Atomoxetine'] },
  { value: 'fibromyalgia', label: 'Fibromyalgia', medications: ['Pregabalin', 'Duloxetine'] },
  { value: 'gout', label: 'Gout', medications: ['Allopurinol', 'Colchicine'] },
  { value: 'other', label: 'Other (Not Listed)', medications: [] },
];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestedMedications, setSuggestedMedications] = useState<string[]>([]);
  const [customDisease, setCustomDisease] = useState('');

  const { getInfo: getDiseaseInfo, data: diseaseData, loading: diseaseLoading, clear: clearDiseaseInfo } = useDiseaseAI();

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    mobile: '',
    medical_condition: '',
    consent: false,
  });

  const handleConditionChange = (value: string) => {
    setFormData(prev => ({ ...prev, medical_condition: value }));
    const condition = medicalConditions.find(c => c.value === value);
    setSuggestedMedications(condition?.medications || []);
    clearDiseaseInfo(); // Clear previous info when changing selection
  };

  const next = () => {
    if (step === 0) {
      if (!formData.full_name || !formData.age || !formData.gender) {
        toast({ title: 'Missing info', description: 'Fill all required fields', variant: 'destructive' });
        return;
      }
    }

    if (step === 1) {
      if (!formData.mobile || !formData.medical_condition) {
        toast({ title: 'Missing info', description: 'Fill all required fields', variant: 'destructive' });
        return;
      }
    }

    if (step === 2) {
      if (!formData.consent) {
        toast({ title: 'Consent required', description: 'Please agree to continue', variant: 'destructive' });
        return;
      }
      completeOnboarding();
      return;
    }

    setStep(s => s + 1);
  };

  const back = () => setStep(s => Math.max(0, s - 1));

  const completeOnboarding = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const birthYear = new Date().getFullYear() - Number(formData.age);

      await profileApi.updateProfile(user.id, {
        full_name: formData.full_name,
        mobile: formData.mobile,
        date_of_birth: `${birthYear}-01-01`,
        medical_history:
          formData.medical_condition === 'other'
            ? customDisease
            : formData.medical_condition,
        onboarding_completed: true,
      });

      await refreshProfile();

      toast({
        title: 'Welcome 🎉',
        description: 'Profile completed successfully',
      });
      navigate('/dashboard');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    /** STEP 1 */
    if (step === 0) {
      return (
        <div className="space-y-4">
          <Label>Full Name *</Label>
          <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />

          <Label>Age *</Label>
          <Input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />

          <Label>Gender *</Label>
          <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    /** STEP 2 */
    if (step === 1) {
      return (
        <div className="space-y-4">
          <Label>Mobile Number *</Label>
          <Input value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />

          <Label>Medical Condition *</Label>
          <Select value={formData.medical_condition} onValueChange={handleConditionChange}>
            <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
            <SelectContent>
              {medicalConditions.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {formData.medical_condition && formData.medical_condition !== 'other' && (
            <div className="mt-2">
              {!diseaseData && !diseaseLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-primary hover:text-primary/80"
                  onClick={() => {
                    const label = medicalConditions.find(c => c.value === formData.medical_condition)?.label;
                    if (label) getDiseaseInfo(label);
                  }}
                >
                  <Bot className="mr-1 h-3 w-3" />
                  What is this condition?
                </Button>
              )}

              {diseaseLoading && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              )}

              {diseaseData && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={clearDiseaseInfo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-3 w-3 text-primary" />
                    <span className="font-semibold text-sm">AI Info</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{diseaseData}</p>
                </div>
              )}
            </div>
          )}


          {formData.medical_condition === 'other' && (
            <>
              <Label>Enter your condition *</Label>
              <Input value={customDisease} onChange={e => setCustomDisease(e.target.value)} />
            </>
          )}

          {suggestedMedications.length > 0 && (
            <div className="p-3 bg-accent rounded">
              <p className="text-sm mb-2">Suggested medications</p>
              <div className="flex gap-2 flex-wrap">
                {suggestedMedications.map(m => <Badge key={m}>{m}</Badge>)}
              </div>
            </div>
          )}
        </div>
      );
    }

    /** STEP 3 – CONSENT */
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground bg-muted p-4 rounded">
          By continuing, you consent to secure storage of your health data and
          receive medication reminders. AI features are informational only and
          do not replace medical advice.
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            checked={formData.consent}
            onCheckedChange={v =>
              setFormData(prev => ({ ...prev, consent: v === true }))
            }
          />
          <Label>I agree to Terms & Privacy Policy *</Label>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <Activity className="mx-auto h-10 w-10 text-primary" />
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>Step {step + 1} of 3</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStep()}

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={back} className="flex-1">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            <Button onClick={next} disabled={loading} className="flex-1">
              {step === 2 ? 'Complete' : 'Next'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}