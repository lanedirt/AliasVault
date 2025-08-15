import { describe, it, expect, beforeEach } from 'vitest';

import type { Credential } from '@/utils/dist/shared/models/vault';

import { filterCredentials } from '../Filter';

describe('Filter - Credential URL Matching', () => {
  let testCredentials: Credential[];

  beforeEach(() => {
    // Create test credentials using shared test data structure
    testCredentials = createSharedTestCredentials();
  });

  it('should match exact URL', () => {
    const matches = filterCredentials(
      testCredentials,
      'https://www.coolblue.nl',
      ''
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].ServiceName).toBe('Coolblue');
  });

  it('should match base URL with path', () => {
    const matches = filterCredentials(
      testCredentials,
      'https://gmail.com/signin',
      ''
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].ServiceName).toBe('Gmail');
  });

  it('should match root domain with subdomain', () => {
    const matches = filterCredentials(
      testCredentials,
      'https://mail.google.com',
      ''
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].ServiceName).toBe('Google');
  });

  it('should return empty array for no matches', () => {
    const matches = filterCredentials(
      testCredentials,
      'https://nonexistent.com',
      ''
    );

    expect(matches).toHaveLength(0);
  });

  // New comprehensive test cases
  it('should match partial URL with full URL - dumpert.nl case', () => {
    // Test case: stored URL is "dumpert.nl", search with full URL
    const matches = filterCredentials(
      testCredentials,
      'https://www.dumpert.nl',
      ''
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].ServiceName).toBe('Dumpert');
  });

  it('should match full URL with partial URL', () => {
    // Test case: stored URL is full, search with partial
    const matches = filterCredentials(
      testCredentials,
      'https://coolblue.nl',
      ''
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].ServiceName).toBe('Coolblue');
  });

  it('should handle protocol variations correctly', () => {
    // Test that http and https variations match
    const httpsMatches = filterCredentials(
      testCredentials,
      'https://github.com',
      ''
    );
    const httpMatches = filterCredentials(
      testCredentials,
      'http://github.com',
      ''
    );
    const noProtocolMatches = filterCredentials(
      testCredentials,
      'https://github.com',  // Converting no-protocol to https for test
      ''
    );

    expect(httpsMatches).toHaveLength(1);
    expect(httpMatches).toHaveLength(1);
    expect(noProtocolMatches).toHaveLength(1);
    expect(httpsMatches[0].ServiceName).toBe('GitHub');
    expect(httpMatches[0].ServiceName).toBe('GitHub');
    expect(noProtocolMatches[0].ServiceName).toBe('GitHub');
  });

  it('should handle www variations correctly', () => {
    // Test that www variations match
    const withWww = filterCredentials(
      testCredentials,
      'https://www.dumpert.nl',
      ''
    );
    const withoutWww = filterCredentials(
      testCredentials,
      'https://dumpert.nl',
      ''
    );

    expect(withWww).toHaveLength(1);
    expect(withoutWww).toHaveLength(1);
    expect(withWww[0].ServiceName).toBe('Dumpert');
    expect(withoutWww[0].ServiceName).toBe('Dumpert');
  });

  it('should handle subdomain matching', () => {
    // Test subdomain matching
    const appSubdomain = filterCredentials(
      testCredentials,
      'https://app.example.com',
      ''
    );
    const wwwSubdomain = filterCredentials(
      testCredentials,
      'https://www.example.com',
      ''
    );
    const noSubdomain = filterCredentials(
      testCredentials,
      'https://example.com',
      ''
    );

    expect(appSubdomain).toHaveLength(1);
    expect(appSubdomain[0].ServiceName).toBe('Subdomain Example');
    expect(wwwSubdomain).toHaveLength(1);
    expect(wwwSubdomain[0].ServiceName).toBe('Subdomain Example');
    expect(noSubdomain).toHaveLength(1);
    expect(noSubdomain[0].ServiceName).toBe('Subdomain Example');
  });

  it('should ignore paths and query strings', () => {
    // Test that paths and query strings are ignored
    const withPath = filterCredentials(
      testCredentials,
      'https://github.com/user/repo',
      ''
    );
    const withQuery = filterCredentials(
      testCredentials,
      'https://stackoverflow.com/questions?tab=newest',
      ''
    );
    const withFragment = filterCredentials(
      testCredentials,
      'https://gmail.com#inbox',
      ''
    );

    expect(withPath).toHaveLength(1);
    expect(withPath[0].ServiceName).toBe('GitHub');
    expect(withQuery).toHaveLength(1);
    expect(withQuery[0].ServiceName).toBe('Stack Overflow');
    expect(withFragment).toHaveLength(1);
    expect(withFragment[0].ServiceName).toBe('Gmail');
  });

  it('should handle complex URL variations', () => {
    // Test complex URL matching scenario
    const complexUrl = filterCredentials(
      testCredentials,
      'https://www.coolblue.nl/product/12345?ref=google',
      ''
    );

    expect(complexUrl).toHaveLength(1);
    expect(complexUrl[0].ServiceName).toBe('Coolblue');
  });

  it('should prioritize exact matches over partial matches', () => {
    // Add a credential with exact domain match to test priority
    const credentialsWithExact = [
      ...testCredentials,
      createTestCredential(
        'Exact Match',
        'https://test.dumpert.nl',
        'user@test.dumpert.nl'
      )
    ];

    const matches = filterCredentials(
      credentialsWithExact,
      'https://test.dumpert.nl',
      ''
    );

    // Should prioritize exact match but also include partial matches
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // The exact match should be first due to priority
    expect(matches[0].ServiceName).toBe('Exact Match');
  });

  it('should match title only', () => {
    const matches = filterCredentials(
      testCredentials,
      'https://www.newyorktimes.com',
      'The New York Times'
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].ServiceName).toBe('Title Only newyorktimes');
  });

  /**
   * Creates the shared test credential dataset used across all platforms.
   * Note: when making changes to this list, make sure to update the corresponding list for iOS and Android tests as well.
   */
  function createSharedTestCredentials(): Credential[] {
    return [
      createTestCredential('Gmail', 'https://gmail.com', 'user@gmail.com'),
      createTestCredential('Google', 'https://google.com', 'user@google.com'),
      createTestCredential('Coolblue', 'https://www.coolblue.nl', 'user@coolblue.nl'),
      createTestCredential('Amazon', 'https://amazon.com', 'user@amazon.com'),
      createTestCredential('Coolblue App', 'com.coolblue.app', 'user@coolblue.nl'),
      createTestCredential('Dumpert', 'dumpert.nl', 'user@dumpert.nl'),
      createTestCredential('GitHub', 'github.com', 'user@github.com'),
      createTestCredential('Stack Overflow', 'https://stackoverflow.com', 'user@stackoverflow.com'),
      createTestCredential('Subdomain Example', 'https://app.example.com', 'user@example.com'),
      createTestCredential('Title Only newyorktimes', '', ''),
    ];
  }

  /**
   * Helper function to create test credentials with standardized structure.
   * @param serviceName - The name of the service
   * @param serviceUrl - The URL of the service
   * @param username - The username for the service
   * @returns A test credential matching the platform's Credential type
   */
  function createTestCredential(
    serviceName: string,
    serviceUrl: string,
    username: string
  ): Credential {
    return {
      Id: Math.random().toString(),
      ServiceName: serviceName,
      ServiceUrl: serviceUrl,
      Username: username,
      Password: 'password123',
      Notes: '',
      Logo: new Uint8Array(),
      Alias: {
        FirstName: '',
        LastName: '',
        NickName: '',
        BirthDate: '',
        Gender: undefined,
        Email: username
      }
    };
  }
});