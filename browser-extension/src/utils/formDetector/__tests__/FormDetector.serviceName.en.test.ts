import { describe, it, expect } from 'vitest';
import { createTestDocument } from './TestUtils';
import { FormDetector } from '../FormDetector';

describe('FormDetector.getSuggestedServiceName (English)', () => {
  it('should extract service name from title with divider', () => {
    const { document, location } = createTestDocument(
      'Welcome to MyBank - Online Banking Platform For You',
      'https://www.mybank.com'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('MyBank');
  });

  it('should extract service name from title without divider', () => {
    const { document, location } = createTestDocument(
      'GitHub: Let\'s build from here',
      'https://github.com'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('GitHub');
  });

  it('should handle titles with multiple meaningful words', () => {
    const { document, location } = createTestDocument(
      'Amazon Shopping Cart',
      'https://www.amazon.com'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('Amazon Shopping');
  });

  it('should fall back to domain name when title has no meaningful words', () => {
    const { document, location } = createTestDocument(
      'Home | Welcome',
      'https://www.example.com'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('example.com');
  });

  it('should handle titles with special characters', () => {
    const { document, location } = createTestDocument(
      'Netflix - Watch TV Shows Online, Watch Movies Online',
      'https://www.netflix.com'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('Netflix');
  });

  it('should handle titles with multiple dividers', () => {
    const { document, location } = createTestDocument(
      'Twitter / X - Social Media Platform',
      'https://twitter.com'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('Twitter');
  });

  it('should handle empty titles', () => {
    const { document, location } = createTestDocument(
      '',
      'https://www.example.com'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('example.com');
  });

  it('should handle titles with only stop words', () => {
    const { document, location } = createTestDocument(
      'The and or but',
      'https://www.example.com'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('example.com');
  });
});