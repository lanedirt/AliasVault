import { AppInfo } from "./AppInfo";
import { StatusResponse } from "./types/webapi/StatusResponse";
import { VaultResponse } from "./types/webapi/VaultResponse";

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
  /**
   * Constructor for the WebApiService class.
   *
   * @param {Function} handleLogout - Function to handle logout.
   */
  public constructor(
    private readonly handleLogout: () => void
  ) {
    // Remove initialization of baseUrl
  }

  /**
   * Get the base URL for the API from settings.
   */
  private async getBaseUrl(): Promise<string> {
    const result = await chrome.storage.local.get(['apiUrl']);
    return (result.apiUrl ?? AppInfo.DEFAULT_API_URL).replace(/\/$/, '') + '/v1/';
  }

  /**
   * Fetch data from the API.
   */
  public async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    parseJson: boolean = true
  ): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = baseUrl + endpoint;
    const headers = new Headers(options.headers ?? {});

    // Add authorization header if we have an access token
    const accessToken = await this.getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    // Add client version header
    headers.set('X-AliasVault-Client', `${AppInfo.CLIENT_NAME}-${AppInfo.VERSION}`);

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

          return parseJson ? retryResponse.json() : retryResponse as unknown as T;
        } else {
          this.handleLogout();
          throw new Error('Session expired');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return parseJson ? response.json() : response as unknown as T;
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
      const baseUrl = await this.getBaseUrl();
      const response = await fetch(`${baseUrl}Auth/refresh`, {
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
   * Issue GET request to the API expecting a file download and return it as a Base64 string.
   */
  public async downloadBlobAndConvertToBase64(endpoint: string): Promise<string> {
    try {
      const response = await this.fetch<Response>(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream'
        }
      }, false);

      // Ensure we get the response as a blob
      const blob = await response.blob();
      return await this.blobToBase64(blob);
    } catch (error) {
      console.error('Error fetching and converting to Base64:', error);
      throw error;
    }
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
   * Calls the status endpoint to check if the auth tokens are still valid, app is supported and the vault is up to date.
   */
  public async getStatus(): Promise<StatusResponse> {
    return await this.get<StatusResponse>('Auth/status');
  }

  /**
   * Validates the status response and returns an error message if validation fails.
   */
  public validateStatusResponse(statusResponse: StatusResponse): string | null {
    if (!statusResponse.clientVersionSupported) {
      return 'This version of the AliasVault browser extension is outdated. Please update your browser extension to the latest version.';
    }

    if (!AppInfo.isServerVersionSupported(statusResponse.serverVersion)) {
      return 'The AliasVault server needs to be updated to a newer version in order to use this browser extension. Please contact support if you need help.';
    }

    return null;
  }

  /**
   * Validates the vault response and returns an error message if validation fails
   */
  public validateVaultResponse(vaultResponseJson: VaultResponse): string | null {
    /**
     * Status 0 = OK, vault is ready.
     * Status 1 = Merge required, which only the web client supports.
     */
    if (vaultResponseJson.status !== 0) {
      return 'Your vault needs to be updated. Please login on the AliasVault website and follow the steps.';
    }

    if (!vaultResponseJson.vault?.blob) {
      return 'Your account does not have a vault yet. Please complete the tutorial in the AliasVault web client before using the browser extension.';
    }

    if (!AppInfo.isVaultVersionSupported(vaultResponseJson.vault.version)) {
      return 'Your vault is outdated. Please login via the web client to update your vault.';
    }

    return null;
  }

  /**
   * Get the current access token from storage.
   */
  private async getAccessToken(): Promise<string | null> {
    const token = await chrome.storage.local.get('accessToken');
    return token.accessToken ?? null;
  }

  /**
   * Get the current refresh token from storage.
   */
  private async getRefreshToken(): Promise<string | null> {
    const token = await chrome.storage.local.get('refreshToken');
    return token.refreshToken ?? null;
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

  /**
   * Convert a Blob to a Base64 string.
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      /**
       * When the reader has finished loading, convert the result to a Base64 string.
       */
      reader.onloadend = () : void => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result.split(',')[1]); // Remove the data URL prefix
        } else {
          reject(new Error('Failed to convert Blob to Base64.'));
        }
      };

      /**
       * If the reader encounters an error, reject the promise with a proper Error object.
       */
      reader.onerror = () : void => {
        reject(new Error('Failed to read blob as Data URL'));
      };
      reader.readAsDataURL(blob);
    });
  }
}
