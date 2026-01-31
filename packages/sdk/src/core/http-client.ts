import { NetworkError, AuthError, UPSError } from './errors';

interface HttpClientConfig {
    baseUrl: string;
    timeout?: number;
    retryAttempts?: number;
    getToken?: () => string | null;
}

interface RequestOptions extends RequestInit {
    skipAuth?: boolean;
}

export class HttpClient {
    private baseUrl: string;
    private timeout: number;
    private retryAttempts: number;
    private getToken?: () => string | null;

    constructor(config: HttpClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.timeout = config.timeout || 30000;
        this.retryAttempts = config.retryAttempts || 3;
        this.getToken = config.getToken;
    }

    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
        const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
        const headers = new Headers(options.headers);

        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        if (!options.skipAuth && this.getToken) {
            const token = this.getToken();
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
        }

        const config: RequestInit = {
            ...options,
            headers,
        };

        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                try {
                    const response = await fetch(url, {
                        ...config,
                        signal: controller.signal,
                    });

                    if (response.status === 429) {
                        const retryAfter = response.headers.get('Retry-After');
                        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
                        await this.delay(waitTime);
                        continue;
                    }

                    if (response.status === 401) {
                        throw new AuthError('Authentication failed');
                    }

                    if (!response.ok) {
                        let errorDetails;
                        const text = await response.text();
                        try {
                            errorDetails = JSON.parse(text);
                        } catch {
                            errorDetails = text;
                        }
                        const detailsStr = typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails);
                        throw new NetworkError(`Request failed with status ${response.status}: ${detailsStr}`, errorDetails, response.status);
                    }

                    // Handle 204 No Content
                    if (response.status === 204) {
                        return undefined as unknown as T;
                    }

                    return await response.json();
                } finally {
                    clearTimeout(timeoutId);
                }
            } catch (error: any) {
                lastError = error;

                if (error instanceof AuthError) {
                    throw error;
                }

                if (error.name === 'AbortError') {
                    lastError = new NetworkError('Request timed out', error);
                } else if (!(error instanceof NetworkError) && !(error instanceof UPSError)) {
                    // Wrap unknown errors
                    lastError = new NetworkError(error.message || 'Unknown error', error);
                }

                if (attempt < this.retryAttempts) {
                    const waitTime = Math.pow(2, attempt) * 1000;
                    await this.delay(waitTime);
                    continue;
                }
            }
        }

        throw lastError || new NetworkError('Request failed after retries');
    }

    async get<T>(path: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(path, { ...options, method: 'GET' });
    }

    async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(path, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
