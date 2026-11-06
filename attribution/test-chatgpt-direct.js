// Direct ChatGPT API test - verify our integration settings
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    process.exit(1);
}

const testChatGPT = async () => {
    try {
        console.log('🤖 Testing ChatGPT API integration...');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior DevOps consultant analyzing UnMoGrowP attribution platform development. Provide business analysis in Russian.'
                    },
                    {
                        role: 'user',
                        content: 'Анализируйте текущий статус: Week 4 Sprint с целями 20→25-28 customers, $103.4K→$125K-140K MRR. Multi-Period Saturation Model готов. Дайте 3 рекомендации для ускорения customer acquisition.'
                    }
                ],
                max_tokens: 1200,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP ${response.status}: ${errorText}`);
            return;
        }

        const result = await response.json();
        console.log('✅ ChatGPT Response:');
        console.log('📊 Model:', result.model);
        console.log('🔢 Tokens used:', result.usage?.total_tokens);
        console.log('💬 Analysis:');
        console.log(result.choices[0].message.content);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testChatGPT();