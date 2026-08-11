import { NodeEnv } from '../constants/common.js';

/**
 * Calls the integrated AI proxy and collects all streamed content into a string.
 * @param {{ systemPrompt: string, userMessage: string }} params
 * @returns {Promise<string>}
 */
export async function generateText({ systemPrompt, userMessage }) {
    const response = await fetch(`${process.env.INTEGRATED_AI_API_URL}/generate`, {
        method: 'POST',
        headers: {
            'Accept': 'text/event-stream',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTEGRATED_AI_API_KEY}`,
            ...(process.env.PROXY_ENTRANCE_ID && { 'X-Proxy-Entrance-Id': process.env.PROXY_ENTRANCE_ID }),
        },
        body: JSON.stringify({
            website_id: process.env.WEBSITE_ID,
            history: [{ role: 'user', content: userMessage }],
            system_prompt: systemPrompt,
            stream: true,
            environment: process.env.NODE_ENV === NodeEnv.Production ? 'prod' : 'dev',
        }),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`AI request failed (${response.status}): ${text}`);
    }

    let fullContent = '';
    const textStream = response.body.pipeThrough(new TextDecoderStream());
    let buffer = '';

    for await (const chunk of textStream) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') break;
            try {
                const event = JSON.parse(jsonStr);
                if (event.type === 'content') fullContent += event.data.content;
                if (event.type === 'done' || event.type === 'completed') return fullContent;
                if (event.type === 'error') throw new Error(event.data.content);
            } catch (parseErr) {
                if (parseErr.message.startsWith('AI')) throw parseErr;
            }
        }
    }

    return fullContent;
}
