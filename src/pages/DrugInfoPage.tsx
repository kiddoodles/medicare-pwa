import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Search, ShieldCheck, Globe, Pill } from 'lucide-react';

export default function DrugInfoPage() {
    const [query, setQuery] = useState('');

    const handleFDASearch = () => {
        if (!query.trim()) return;
        // Constructing FDA Search URL
        const url = `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&SearchString=${encodeURIComponent(query)}`;
        window.open(url, '_blank');
    };

    const handleWHOSearch = () => {
        // WHO Toolkit doesn't support simple GET param search easily for deep linking in the same way, 
        // linking to the tool base as requested.
        const url = 'https://www.who.int/tools/atc-ddd-toolkit';
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6 animate-fade-in p-4 pb-20 max-w-4xl mx-auto">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Drug Medical Information</h1>
                <p className="text-muted-foreground">
                    Access official medical records from FDA and WHO databases.
                </p>
            </div>

            {/* Search Bar */}
            <Card className="border-2 border-primary/10 shadow-lg">
                <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter drug name (e.g., Calpol, Ibuprofen)"
                            className="text-lg h-12"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleFDASearch()}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* FDA Card */}
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                            FDA Drug Database
                        </CardTitle>
                        <CardDescription>
                            U.S. Food and Drug Administration
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Search for approved drugs, therapeutic equivalence evaluations, and labeling information directly from the FDA.
                        </p>
                        <Button
                            className="w-full gap-2"
                            size="lg"
                            onClick={handleFDASearch}
                            disabled={!query.trim()}
                        >
                            <Search className="h-4 w-4" />
                            Search FDA Database
                        </Button>
                    </CardContent>
                </Card>

                {/* WHO Card */}
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-6 w-6 text-emerald-600" />
                            WHO Drug Information
                        </CardTitle>
                        <CardDescription>
                            World Health Organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Access international drug statistics, ATC/DDD toolkit, and global medical standards.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            size="lg"
                            onClick={handleWHOSearch}
                            // WHO link is general, but contextually we want them to "search" or go there.
                            // User requirement: "If drug search is empty → disable buttons"
                            disabled={!query.trim()}
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open WHO Reference
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Disclaimer */}
            <div className="bg-muted/30 p-4 rounded-lg border border-primary/5 text-center mt-8">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    You are viewing official medical information from FDA/WHO.
                </p>
            </div>

            {!query.trim() && (
                <div className="text-center py-12 opacity-50">
                    <Pill className="h-16 w-16 mx-auto mb-4" />
                    <p>Enter a drug name to enable search options.</p>
                </div>
            )}
        </div>
    );
}
