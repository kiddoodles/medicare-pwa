import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientPhotoUploader } from '@/components/PatientPhotoUploader';
import { medicalHistoryApi } from '@/services/medicalHistoryApi';
import type { MedicalHistory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Save, FileHeart, AlertTriangle, Pill, RotateCcw, Stethoscope, Clock, History, AlertCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';

export default function MedicalHistoryPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State for the form
    const [history, setHistory] = useState<Partial<MedicalHistory>>({
        chronic_conditions: [],
        current_medications: [],
        past_medications: [],
        drug_allergies: [],
        food_allergies: [],
        family_history: [],
        notes: ''
    });

    // Inputs state
    const [newCondition, setNewCondition] = useState('');
    const [newDrugAllergy, setNewDrugAllergy] = useState('');
    const [newFoodAllergy, setNewFoodAllergy] = useState('');
    const [newFamilyHistory, setNewFamilyHistory] = useState('');

    // Medication Form State
    const [currentMed, setCurrentMed] = useState({ name: '', dosage: '', frequency: '', start_date: '' });
    const [pastMed, setPastMed] = useState({ name: '', duration: '', reason_stopped: '' });

    useEffect(() => {
        loadHistory();
    }, [user]);

    const loadHistory = async () => {
        if (!user) return;
        try {
            const data = await medicalHistoryApi.getHistory(user.id);
            if (data) {
                setHistory({
                    ...data,
                    // Ensure arrays are initialized
                    drug_allergies: data.drug_allergies || [],
                    food_allergies: data.food_allergies || [],
                });
            }
        } catch (error) {
            console.error('Failed to load history', error);
            toast({ title: 'Error', description: 'Could not load medical history', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            // STRICTLY sanitize payload to avoid schema errors
            // We explicitly exclude current_medications/past_medications to prevent "column not found" errors
            // even if they exist in state.
            const cleanHistory: any = {
                drug_allergies: history.drug_allergies || [],
                food_allergies: history.food_allergies || [],
                chronic_conditions: history.chronic_conditions || [],
                family_history: history.family_history || [],
                clinical_notes: history.notes || '', // Map notes -> clinical_notes for backend
            };

            await medicalHistoryApi.upsertHistory(cleanHistory);
            toast({ title: 'Record Updated', description: 'Clinical history saved successfully.' });
            loadHistory();
        } catch (error: any) {
            console.error('Save error:', error);
            toast({
                title: 'Save Failed',
                description: error.message || 'Could not save medical history. Check console for details.',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to discard unsaved changes?')) {
            loadHistory();
        }
    };

    const addArrayItem = (field: 'chronic_conditions' | 'family_history', value: string, setter: (s: string) => void) => {
        if (!value.trim()) return;
        if (history[field]?.includes(value.trim())) return;

        setHistory(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), value.trim()]
        }));
        setter('');
    };

    const removeArrayItem = (field: 'chronic_conditions' | 'family_history', index: number) => {
        setHistory(prev => ({
            ...prev,
            [field]: prev[field]?.filter((_, i) => i !== index)
        }));
    };

    const addAllergy = (type: 'drug' | 'food', value: string, setter: (s: string) => void) => {
        if (!value.trim()) return;

        if (type === 'drug') {
            const current = history.drug_allergies || [];
            if (current.includes(value.trim())) return;
            setHistory(prev => ({ ...prev, drug_allergies: [...current, value.trim()] }));
        } else {
            const current = history.food_allergies || [];
            if (current.includes(value.trim())) return;
            setHistory(prev => ({ ...prev, food_allergies: [...current, value.trim()] }));
        }
        setter('');
    };

    const removeAllergy = (type: 'drug' | 'food', index: number) => {
        if (type === 'drug') {
            setHistory(prev => ({
                ...prev,
                drug_allergies: prev.drug_allergies?.filter((_, i) => i !== index)
            }));
        } else {
            setHistory(prev => ({
                ...prev,
                food_allergies: prev.food_allergies?.filter((_, i) => i !== index)
            }));
        }
    };

    const addCurrentMedication = () => {
        if (!currentMed.name.trim()) return;
        setHistory(prev => ({
            ...prev,
            current_medications: [...(prev.current_medications || []), { ...currentMed }]
        }));
        setCurrentMed({ name: '', dosage: '', frequency: '', start_date: '' });
    };

    const addPastMedication = () => {
        if (!pastMed.name.trim()) return;
        setHistory(prev => ({
            ...prev,
            past_medications: [...(prev.past_medications || []), { ...pastMed }]
        }));
        setPastMed({ name: '', duration: '', reason_stopped: '' });
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24">
            {/* Header */}
            <div className="bg-white border-b px-6 py-8 shadow-sm">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-primary bg-primary/5 border-primary/20 px-3 py-1">
                                Clinical Record
                            </Badge>
                            {history.updated_at && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Last updated: {format(new Date(history.updated_at), 'PPP p')}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Medical History</h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Complete clinical background for safe care decisions.
                        </p>
                    </div>
                    <div className="shrink-0">
                        <PatientPhotoUploader />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">

                {/* Chronic Conditions */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Stethoscope className="h-4 w-4" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Chronic Conditions</h2>
                    </div>
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
                                {history.chronic_conditions?.map((item, i) => (
                                    <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">
                                        {item}
                                        <button
                                            className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
                                            onClick={() => removeArrayItem('chronic_conditions', i)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </Badge>
                                ))}
                                {history.chronic_conditions?.length === 0 && (
                                    <span className="text-muted-foreground italic text-sm py-1">No chronic conditions recorded.</span>
                                )}
                            </div>
                            <div className="flex gap-2 max-w-md">
                                <Input
                                    placeholder="Add condition (e.g. Type 2 Diabetes)"
                                    value={newCondition}
                                    onChange={e => setNewCondition(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addArrayItem('chronic_conditions', newCondition, setNewCondition)}
                                    className="border-slate-200 focus:border-blue-500"
                                />
                                <Button variant="secondary" onClick={() => addArrayItem('chronic_conditions', newCondition, setNewCondition)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Current Medications */}
                    <section className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Pill className="h-4 w-4" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900">Current Medications</h2>
                        </div>
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b bg-slate-50/50 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                    <div className="md:col-span-2 space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500">Medication Name</Label>
                                        <Input
                                            placeholder="e.g. Lisinopril"
                                            value={currentMed.name}
                                            onChange={e => setCurrentMed({ ...currentMed, name: e.target.value })}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500">Dosage</Label>
                                        <Input
                                            placeholder="e.g. 10mg"
                                            value={currentMed.dosage}
                                            onChange={e => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500">Frequency</Label>
                                        <Input
                                            placeholder="e.g. Daily"
                                            value={currentMed.frequency}
                                            onChange={e => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500">Start Date</Label>
                                        <Input
                                            type="date"
                                            value={currentMed.start_date}
                                            onChange={e => setCurrentMed({ ...currentMed, start_date: e.target.value })}
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                                <Button className="w-full md:w-auto" size="sm" onClick={addCurrentMedication} disabled={!currentMed.name.trim()}>
                                    <Plus className="h-3.5 w-3.5 mr-2" /> Add Record
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="w-[30%]">Medication</TableHead>
                                        <TableHead>Dose</TableHead>
                                        <TableHead>Frequency</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.current_medications?.map((med, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{med.name}</TableCell>
                                            <TableCell>{med.dosage}</TableCell>
                                            <TableCell>{med.frequency}</TableCell>
                                            <TableCell className="text-muted-foreground">{med.start_date || '-'}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => {
                                                    setHistory(prev => ({
                                                        ...prev,
                                                        current_medications: prev.current_medications?.filter((_, idx) => idx !== i)
                                                    }));
                                                }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!history.current_medications || history.current_medications.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                                No current medications recorded.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </section>

                    {/* Past Medications */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                <History className="h-4 w-4" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900">Past Medications</h2>
                        </div>
                        <Card className="border-slate-200 shadow-sm">
                            <CardContent className="p-6 space-y-6">
                                <div className="grid gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-500">Medication Name</Label>
                                        <Input
                                            placeholder="Name"
                                            value={pastMed.name}
                                            onChange={e => setPastMed({ ...pastMed, name: e.target.value })}
                                            className="bg-white h-9"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-500">Duration</Label>
                                            <Input
                                                placeholder="e.g. 2 years"
                                                value={pastMed.duration}
                                                onChange={e => setPastMed({ ...pastMed, duration: e.target.value })}
                                                className="bg-white h-9"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-500">Reason Stopped</Label>
                                            <Input
                                                placeholder="e.g. Side effects"
                                                value={pastMed.reason_stopped}
                                                onChange={e => setPastMed({ ...pastMed, reason_stopped: e.target.value })}
                                                className="bg-white h-9"
                                            />
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={addPastMedication} disabled={!pastMed.name.trim()}>
                                        <Plus className="h-3.5 w-3.5 mr-2" /> Add Past Med
                                    </Button>
                                </div>

                                <Accordion type="single" collapsible className="w-full">
                                    {history.past_medications?.map((med, i) => (
                                        <AccordionItem key={i} value={`item-${i}`}>
                                            <AccordionTrigger className="text-sm">
                                                <span className="font-medium text-slate-700">{med.name}</span>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-2 pt-2 text-sm">
                                                    <div className="flex justify-between border-b pb-2">
                                                        <span className="text-muted-foreground">Duration:</span>
                                                        <span>{med.duration}</span>
                                                    </div>
                                                    <div className="flex justify-between pb-2">
                                                        <span className="text-muted-foreground">Reason Stopped:</span>
                                                        <span className="text-amber-600 font-medium">{med.reason_stopped}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/5 h-8" onClick={() => {
                                                        setHistory(prev => ({
                                                            ...prev,
                                                            past_medications: prev.past_medications?.filter((_, idx) => idx !== i)
                                                        }));
                                                    }}>
                                                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove Entry
                                                    </Button>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                    {(!history.past_medications || history.past_medications.length === 0) && (
                                        <p className="text-sm text-center text-muted-foreground py-4">No past medications.</p>
                                    )}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* Allergies & Family History */}
                <div className="grid md:grid-cols-2 gap-8">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <AlertCircle className="h-4 w-4" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900">Allergies</h2>
                        </div>
                        <Card className="border-red-100 shadow-sm bg-red-50/30">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-red-900 font-semibold flex items-center gap-2">
                                        <Pill className="h-4 w-4" /> Drug Allergies
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="e.g. Penicillin"
                                            value={newDrugAllergy}
                                            onChange={e => setNewDrugAllergy(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addAllergy('drug', newDrugAllergy, setNewDrugAllergy)}
                                            className="bg-white border-red-200 focus:border-red-500"
                                        />
                                        <Button size="icon" variant="outline" className="border-red-200 hover:bg-red-100 text-red-600 shrink-0" onClick={() => addAllergy('drug', newDrugAllergy, setNewDrugAllergy)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {history.drug_allergies?.map((item, i) => (
                                            <Badge key={i} variant="outline" className="pl-2 pr-1 py-1 bg-white border-red-200 text-red-700 shadow-sm">
                                                {item}
                                                <button className="ml-2 p-0.5 hover:bg-red-100 rounded-full" onClick={() => removeAllergy('drug', i)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-red-900 font-semibold flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> Food & Other
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="e.g. Peanuts, Latex"
                                            value={newFoodAllergy}
                                            onChange={e => setNewFoodAllergy(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addAllergy('food', newFoodAllergy, setNewFoodAllergy)}
                                            className="bg-white border-red-200 focus:border-red-500"
                                        />
                                        <Button size="icon" variant="outline" className="border-red-200 hover:bg-red-100 text-red-600 shrink-0" onClick={() => addAllergy('food', newFoodAllergy, setNewFoodAllergy)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {history.food_allergies?.map((item, i) => (
                                            <Badge key={i} variant="outline" className="pl-2 pr-1 py-1 bg-white border-red-200 text-red-700 shadow-sm">
                                                {item}
                                                <button className="ml-2 p-0.5 hover:bg-red-100 rounded-full" onClick={() => removeAllergy('food', i)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <FileHeart className="h-4 w-4" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900">Family History</h2>
                        </div>
                        <Card className="border-slate-200 shadow-sm h-full">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add relation & condition"
                                        value={newFamilyHistory}
                                        onChange={e => setNewFamilyHistory(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addArrayItem('family_history', newFamilyHistory, setNewFamilyHistory)}
                                    />
                                    <Button variant="outline" onClick={() => addArrayItem('family_history', newFamilyHistory, setNewFamilyHistory)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4 min-h-[150px]">
                                    <ul className="space-y-3">
                                        {history.family_history?.map((item, i) => (
                                            <li key={i} className="flex items-start justify-between text-sm group">
                                                <div className="flex items-start gap-2">
                                                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                                                    <span className="text-slate-700">{item}</span>
                                                </div>
                                                <button
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                                    onClick={() => removeArrayItem('family_history', i)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                        {history.family_history?.length === 0 && (
                                            <li className="text-muted-foreground text-sm italic text-center pt-8">
                                                No family history details added.
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>

                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Clinical Notes</h2>
                    </div>
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-0">
                            <Textarea
                                placeholder="Enter any additional medical details, surgeries, or hospitalizations..."
                                className="min-h-[150px] border-0 focus-visible:ring-0 resize-y p-6 text-base"
                                value={history.notes || ''}
                                onChange={e => setHistory(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <p className="text-sm text-muted-foreground hidden md:block">
                        All changes are securely encrypted.
                    </p>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button variant="ghost" className="flex-1 md:flex-none text-muted-foreground" onClick={handleReset}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none h-11 px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                            {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Medical History
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
