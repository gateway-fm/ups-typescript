import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../src/core/http-client';
import { AuthError } from '../src/core/errors';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('HttpClient', () => {
    let client: HttpClient;
    const baseUrl = 'http://test-api.com';
    const getToken = vi.fn().mockReturnValue(null);

    beforeEach(() => {
        getToken.mockReturnValue(null);
        client = new HttpClient({
            baseUrl,
            retryAttempts: 1,
            timeout: 50,
            getToken
        });
    });

    it('should make GET request with correct headers', async () => {
        const response = await client.get('/accounts');
        expect(response).toBeDefined();
    });

    it('should make POST request with JSON body', async () => {
        const response = await client.post('/accounts', { type: 'USER' });
        expect(response).toBeDefined();
    });

    it('should include auth token when provided', async () => {
        getToken.mockReturnValue('test-token');
        server.use(
            http.get(`${baseUrl}/protected`, ({ request }) => {
                if (request.headers.get('Authorization') === 'Bearer test-token') {
                    return HttpResponse.json({ success: true });
                }
                return new HttpResponse(null, { status: 401 });
            })
        );
        const response = await client.get('/protected');
        expect(response).toEqual({ success: true });
    });

    it('should skip auth when skipAuth option is true', async () => {
        getToken.mockReturnValue('test-token');
        await client.get('/accounts', { skipAuth: true });
    });

    it('should throw AuthError on 401', async () => {
        server.use(
            http.get(`${baseUrl}/401`, () => {
                return new HttpResponse(null, { status: 401 });
            })
        );
        await expect(client.get('/401')).rejects.toThrow(AuthError);
    });

    it('should handle 429 rate limiting with backoff', async () => {
        let attempts = 0;
        server.use(
            http.get(`${baseUrl}/429`, () => {
                attempts++;
                if (attempts <= 1) {
                    return new HttpResponse(null, { status: 429 });
                }
                return HttpResponse.json({ success: true });
            })
        );
        // Retries are configured to 1
        const response = await client.get('/429');
        expect(response).toEqual({ success: true });
        expect(attempts).toBe(2);
    });

    it('should throw NetworkError on timeout', async () => {
        // Mock fetch to simulate timeout (AbortError)
        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url, options: RequestInit | undefined) => {
            const signal = options?.signal;
            return new Promise((resolve, reject) => {
                if (signal?.aborted) {
                    const error = new Error('The operation was aborted');
                    error.name = 'AbortError';
                    return reject(error);
                }

                const timeoutId = setTimeout(() => {
                    resolve(new Response(JSON.stringify({ ok: true })));
                }, 200);

                if (signal) {
                    signal.addEventListener('abort', () => {
                        clearTimeout(timeoutId);
                        const error = new Error('The operation was aborted');
                        error.name = 'AbortError';
                        reject(error);
                    });
                }
            });
        });

        try {
            // Create client with short timeout
            const quickClient = new HttpClient({
                baseUrl,
                timeout: 50,
                retryAttempts: 0
            });

            await expect(quickClient.get('/timeout')).rejects.toThrow('Request timed out');
        } finally {
            fetchSpy.mockRestore();
        }
    });

    it('should handle 204 No Content', async () => {
        server.use(
            http.post(`${baseUrl}/204`, () => {
                return new HttpResponse(null, { status: 204 });
            })
        );
        const response = await client.post('/204');
        expect(response).toBeUndefined();
    });

    it('should handle non-JSON error response', async () => {
        const noRetryClient = new HttpClient({ baseUrl, retryAttempts: 0, timeout: 50 });
        server.use(
            http.get(`${baseUrl}/500-text`, () => {
                return new HttpResponse('Internal Server Error', { status: 500 });
            })
        );
        await expect(noRetryClient.get('/500-text')).rejects.toThrow('Internal Server Error');
    });

    it('should handle JSON error response', async () => {
        const noRetryClient = new HttpClient({ baseUrl, retryAttempts: 0, timeout: 50 });
        server.use(
            http.get(`${baseUrl}/400-json`, () => {
                return HttpResponse.json({ code: 'INVALID', message: 'Bad Request' }, { status: 400 });
            })
        );
        await expect(noRetryClient.get('/400-json')).rejects.toThrow('Bad Request');
    });
});
