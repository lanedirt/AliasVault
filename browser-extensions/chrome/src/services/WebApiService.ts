import { Buffer } from 'buffer';

interface TokenResponse {
  token: string;
  refreshToken: string;
}

export class WebApiService {
  private baseUrl: string = '';

  constructor(
    private getAccessToken: () => string | null,
    private getRefreshToken: () => string | null,
    private updateTokens: (accessToken: string, refreshToken: string) => void,
    private handleLogout: () => void
  ) {
    // Load the API URL from storage when service is initialized
    this.initializeBaseUrl();
  }

  private async initializeBaseUrl() {
    const result = await chrome.storage.local.get(['apiUrl']);
    // Trim trailing slash if present
    this.baseUrl = (result.apiUrl || 'https://app.aliasvault.net/api').replace(/\/$/, '') + '/v1/';
  }

  public async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.baseUrl + endpoint;
    const headers = new Headers(options.headers || {});

    // Add authorization header if we have an access token
    const accessToken = this.getAccessToken();
    console.log('accessToken in webapi:', accessToken);
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, requestOptions);

      if (response.status === 401) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          const retryResponse = await fetch(url, {
            ...requestOptions,
            headers,
          });

          if (!retryResponse.ok) {
            throw new Error('Request failed after token refresh');
          }

          return retryResponse.json();
        } else {
          this.handleLogout();
          throw new Error('Session expired');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}Auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ignore-Failure': 'true',
        },
        body: JSON.stringify({
          token: this.getAccessToken(),
          refreshToken: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenResponse: TokenResponse = await response.json();
      this.updateTokens(tokenResponse.token, tokenResponse.refreshToken);
      return tokenResponse.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleLogout();
      return null;
    }
  }

  // Helper methods for common operations
  public async get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET' });
  }

  public async post<T>(endpoint: string, data: any): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  public async put<T>(endpoint: string, data: any): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }
}