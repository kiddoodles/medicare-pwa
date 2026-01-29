
import https from 'https';

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error('No VITE_GEMINI_API_KEY found in environment');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error('API Error:', json.error);
            } else {
                console.log('Available Models:');
                json.models?.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
            }
        } catch (e) {
            console.error('Parse Error:', e.message);
            console.log('Raw Data:', data);
        }
    });
}).on('error', (e) => {
    console.error('Request Error:', e);
});
