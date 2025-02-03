type RequestInit = globalThis.RequestInit;

/**
 * Type for the token response from the API.
 */
type TokenResponse = {
  token: string;
  refreshToken: string;
}

/**
 * Service class for interacting with the web API.
 */
export class WebApiService {
  private baseUrl: string = '';

  /**
   * Constructor for the WebApiService class.
   *
   * @param {Function} handleLogout - Function to handle logout.
   */
  public constructor(
    private handleLogout: () => void
  ) {
    // Load the API URL from storage when service is initialized
    this.initializeBaseUrl();
  }

  /**
   * Initialize the base URL for the API from settings.
   */
  public async initializeBaseUrl() : Promise<void> {
    const result = await chrome.storage.local.get(['apiUrl']);
    // Trim trailing slash if present
    this.baseUrl = (result.apiUrl || 'https://app.aliasvault.net/api').replace(/\/$/, '') + '/v1/';
  }

  /**
   * Fetch data from the API.
   */
  public async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    parseJson: boolean = true
  ): Promise<T> {
    const url = this.baseUrl + endpoint;
    const headers = new Headers(options.headers || {});

    // Add authorization header if we have an access token
    const accessToken = await this.getAccessToken();
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

          return parseJson ? retryResponse.json() : retryResponse.text() as T;
        } else {
          this.handleLogout();
          throw new Error('Session expired');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return parseJson ? response.json() : response.text() as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token.
   */
  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = await this.getRefreshToken();
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
          token: await this.getAccessToken(),
          refreshToken: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenResponse: TokenResponse = await response.json();
      this.updateTokens(tokenResponse.token, tokenResponse.refreshToken);
      return tokenResponse.token;
    } catch {
      this.handleLogout();
      return null;
    }
  }

  /**
   * Issue GET request to the API.
   */
  public async get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET' });
  }

  /**
   * Issue POST request to the API.
   */
  public async post<TRequest, TResponse>(
    endpoint: string,
    data: TRequest,
    parseJson: boolean = true
  ): Promise<TResponse> {
    return this.fetch<TResponse>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, parseJson);
  }

  /**
   * Issue PUT request to the API.
   */
  public async put<TRequest, TResponse>(endpoint: string, data: TRequest): Promise<TResponse> {
    return this.fetch<TResponse>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Issue DELETE request to the API.
   */
  public async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE' }, false);
  }

  /**
   * Logout and revoke tokens via WebApi.
   */
  public async logout(): Promise<void> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      return;
    }

    await this.post('Auth/revoke', {
      token: await this.getAccessToken(),
      refreshToken: refreshToken,
    }, false);
  }

  /**
   * Get the current access token from storage.
   */
  private async getAccessToken(): Promise<string | null> {
    const token = await chrome.storage.local.get('accessToken');
    console.log('accessToken get', token);
    return token.accessToken || null;
  }

  /**
   * Get the current refresh token from storage.
   */
  private async getRefreshToken(): Promise<string | null> {
    const token = await chrome.storage.local.get('refreshToken');
    console.log('refreshToken get', token);
    return token.refreshToken || null;
  }

  /**
   * Update both access and refresh tokens in storage.
   */
  private async updateTokens(accessToken: string, refreshToken: string): Promise<void> {
    await chrome.storage.local.set({
      accessToken,
      refreshToken
    });
  }
}
