#!/usr/bin/env node
/**
 * Test ChatGPT with EXACT same data as workflow collected
 */

const https = require('https');

// EXACT same data as workflow collected
const COMMITS_TODAY = 31;
const COMMITS_WEEK = 35;
const FILES_CHANGED = 610;
const TODO_COUNT = 118;
const DOCKER_FILES = 19;

const BUSINESS_SUMMARY = `UnMoGrowP Development Intelligence: ${COMMITS_TODAY} commits today, ${COMMITS_WEEK} this week. ${FILES_CHANGED} files changed today. Development agents report: CI/CD 95% success, ${TODO_COUNT} technical debt markers, ${DOCKER_FILES} infrastructure files, code velocity high. Week 4 Sprint: 80% customers (20/25), 82% MRR ($103.4K/$125K). Team productivity: ChatGPT integration completed, focus on enterprise features.`;

console.log('🧪 Testing with EXACT workflow data:');
console.log('===================================');
console.log('Business Summary:');
console.log(BUSINESS_SUMMARY);
console.log('');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY required');
    process.exit(1);
}

const payload = JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
        {
            role: "system",
            content: "You are a senior DevOps consultant and business analyst for UnMoGrowP attribution platform. Current: 20 customers, $103.4K MRR. Target: 25-28 customers, $125K-140K MRR by Week 4 Sprint end. Analyze development agents data (CI/CD, code quality, technical debt, team velocity) and provide actionable insights for: 1) Development optimization 2) Technical blockers for enterprise growth 3) Team productivity improvements 4) Strategic recommendations for competing with AppsFlyer/Adjust."
        },
        {
            role: "user",
            content: BUSINESS_SUMMARY
        }
    ],
    max_tokens: 1200,
    temperature: 0.1
});

const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload)
    }
};

console.log('🚀 Sending exact workflow data to ChatGPT...');
console.log(`📊 Data: ${COMMITS_TODAY} commits, ${FILES_CHANGED} files, ${TODO_COUNT} debt markers`);

const req = https.request(options, (res) => {
    let data = '';
    console.log(`📡 HTTP Status: ${res.statusCode}`);

    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (res.statusCode === 200 && response.choices) {
                console.log('✅ SUCCESS! ChatGPT responded correctly');
                console.log('');
                console.log('🧠 AI ANALYSIS (same as workflow should get):');
                console.log('=============================================');
                console.log(response.choices[0].message.content);
                console.log('=============================================');
                console.log('');
                console.log(`💰 Token Usage: ${response.usage?.total_tokens || 'unknown'}`);
                console.log('');
                console.log('🎯 DIAGNOSIS:');
                console.log('✅ ChatGPT API works correctly with this data');
                console.log('❌ Problem is in workflow parsing/saving logic');
                console.log('🔧 Need to debug workflow response handling');
            } else {
                console.log('❌ ChatGPT API Error:');
                console.log(JSON.stringify(response, null, 2));
                console.log('');
                console.log('🎯 DIAGNOSIS:');
                console.log('❌ ChatGPT API failing - this explains empty analysis files');
                console.log('🔧 Need to fix API call in workflow');
            }
        } catch (error) {
            console.log('❌ JSON Parse Error:', error.message);
            console.log('📄 Raw Response:', data.substring(0, 500));
            console.log('');
            console.log('🎯 DIAGNOSIS:');
            console.log('❌ Response format error - explains parsing failures in workflow');
        }
    });
});

req.on('error', (error) => console.log('❌ Request Error:', error.message));
req.write(payload);
req.end();