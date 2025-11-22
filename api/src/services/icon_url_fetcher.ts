let cachedSessionCookies: string | null = null;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const performAgeCheck = async (appId: string): Promise<string | null> => {
    const ageCheckUrl = `https://store.steampowered.com/agecheck/app/${appId}`;
    
    try {
        const ageCheckResponse = await fetch(ageCheckUrl, {
            headers: {
                'User-Agent': userAgent
            }
        });

        const setCookieHeader = ageCheckResponse.headers.get('set-cookie');
        if (!setCookieHeader) return null;

        const sessionIdMatch = setCookieHeader.match(/sessionid=([^;]+)/);
        const steamCountryMatch = setCookieHeader.match(/steamCountry=([^;]+)/);
        const timezoneOffsetMatch = setCookieHeader.match(/timezoneOffset=([^;]+)/);

        if (!sessionIdMatch) return null;

        const sessionId = sessionIdMatch[1];
        const steamCountry = steamCountryMatch?.[1] || '';
        const timezoneOffset = timezoneOffsetMatch?.[1] || '0,0';

        const agechecksetUrl = `https://store.steampowered.com/agecheckset/app/${appId}`;
        const formData = new URLSearchParams({
            sessionid: sessionId,
            ageDay: '1',
            ageMonth: 'January',
            ageYear: '1991'
        });

        const postResponse = await fetch(agechecksetUrl, {
            method: 'POST',
            headers: {
                'User-Agent': userAgent,
                'Cookie': `sessionid=${sessionId}; steamCountry=${steamCountry}; timezoneOffset=${timezoneOffset}`
            },
            body: formData
        });

        const finalSetCookie = postResponse.headers.get('set-cookie');
        const birthtime = finalSetCookie?.match(/birthtime=([^;]+)/)?.[1];
        const lastagecheckage = finalSetCookie?.match(/lastagecheckage=([^;]+)/)?.[1];
        const wantsMatureContent = finalSetCookie?.match(/wants_mature_content=([^;]+)/)?.[1];

        const finalCookies = [
            `birthtime=${birthtime || '662688001'}`,
            `lastagecheckage=${lastagecheckage || '1-January-1991'}`,
            `sessionid=${sessionId}`,
            `steamCountry=${steamCountry}`,
            `timezoneOffset=${timezoneOffset}`,
            `wants_mature_content=${wantsMatureContent || '1'}`
        ].join('; ');

        cachedSessionCookies = finalCookies;
        return finalCookies;
    } catch (error) {
        console.error('Error during age check:', error);
        return null;
    }
};

export const fetchIconUrl = async (appId: string): Promise<string | undefined> => {
    const pageUrl = `https://store.steampowered.com/app/${appId}/`;

    try {
        let cookies = cachedSessionCookies;
        
        const response = await fetch(pageUrl, {
            headers: {
                'User-Agent': userAgent,
                ...(cookies && { 'Cookie': cookies })
            }
        });

        if (response.url.includes('/agecheck/')) {
            cookies = await performAgeCheck(appId);
            if (!cookies) {
                return;
            }

            const retryResponse = await fetch(pageUrl, {
                headers: {
                    'User-Agent': userAgent,
                    'Cookie': cookies
                }
            });
            return extractIconUrl(await retryResponse.text());
        }

        const pageText = await response.text();
        return extractIconUrl(pageText);
    } catch (error) {
        console.error('Error fetching Steam page:', error);
    }

    return;
};

const extractIconUrl = (pageText: string): string | undefined => {
    const imgMatch = pageText.match(/<div class="apphub_AppIcon">\s*<img src="([^"]*)/);
    if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
    }
    return undefined;
};

class RateLimiter {
    private queue: Array<{ task: () => Promise<string | undefined>; resolver: (value: string | undefined) => void }> = [];
    private isProcessing = false;
    private delayMs: number;

    constructor(delayMs: number = 500) {
        this.delayMs = delayMs;
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (item) {
                try {
                    const result = await item.task();
                    item.resolver(result);
                } catch (error) {
                    item.resolver(undefined);
                }
                await new Promise(resolve => setTimeout(resolve, this.delayMs));
            }
        }

        this.isProcessing = false;
    }

    async run(task: () => Promise<string | undefined>): Promise<string | undefined> {
        return new Promise((resolve) => {
            this.queue.push({ task, resolver: resolve });
            this.processQueue();
        });
    }
}

const iconUrlLimiter = new RateLimiter(100);

export const rateLimitedFetchIconUrl = (appId: string): Promise<string | undefined> => {
    return iconUrlLimiter.run(() => fetchIconUrl(appId));
}