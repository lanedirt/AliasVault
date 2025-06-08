import { describe, it, expect } from 'vitest';

import { FormDetector } from '../FormDetector';

import { createTestDocument } from './TestUtils';

describe('FormDetector.getSuggestedServiceName (English)', () => {
  it('should extract service name from title with divider and include domain', () => {
    const { document, location } = createTestDocument(
      'Welcome to MyBank - Online Banking Platform For You',
      'https://www.mybank.com'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['MyBank', 'Banking Platform For You', 'mybank.com']);
  });

  it('should extract service name from title without divider and include domain', () => {
    const { document, location } = createTestDocument(
      'GitHub: Let\'s build from here',
      'https://github.com'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['GitHub', 'Let\'s build from here', 'github.com']);
  });

  it('should handle titles with multiple meaningful words and include domain', () => {
    const { document, location } = createTestDocument(
      'Amazon Shopping Cart',
      'https://www.amazon.com'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['Amazon Shopping', 'amazon.com']);
  });

  it('should return only domain name when title has no meaningful words', () => {
    const { document, location } = createTestDocument(
      'Home | Welcome',
      'https://www.example.com'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['example.com']);
  });

  it('should handle titles with special characters and include domain', () => {
    const { document, location } = createTestDocument(
      'Netflix - Watch TV Shows Online, Watch Movies Online',
      'https://www.netflix.com'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['Netflix', 'netflix.com']);
  });

  it('should handle titles with multiple dividers and include domain', () => {
    const { document, location } = createTestDocument(
      'Twitter / X - Social Media Platform',
      'https://twitter.com'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['Twitter', 'X - Social Media', 'twitter.com']);
  });

  it('should handle empty titles by returning only domain', () => {
    const { document, location } = createTestDocument(
      '',
      'https://www.example.com'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['example.com']);
  });

  it('should handle titles with only stop words by returning only domain', () => {
    const { document, location } = createTestDocument(
      'The and or but',
      'https://www.example.com'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['example.com']);
  });
});