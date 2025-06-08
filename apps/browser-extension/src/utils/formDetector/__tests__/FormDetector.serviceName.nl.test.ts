import { describe, it, expect } from 'vitest';

import { FormDetector } from '../FormDetector';

import { createTestDocument } from './TestUtils';

describe('FormDetector.getSuggestedServiceName (Dutch)', () => {
  it('should extract service name from title with divider and include domain', () => {
    const { document, location } = createTestDocument(
      'ING - Online Bankieren',
      'https://www.ing.nl'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['ING', 'Bankieren', 'ing.nl']);
  });

  it('should extract service name from title without divider and include domain', () => {
    const { document, location } = createTestDocument(
      'Bol.com | De winkel van ons allemaal',
      'https://www.bol.com'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['Bol.com', 'bol.com']);
  });

  it('should handle titles with multiple meaningful words and include domain', () => {
    const { document, location } = createTestDocument(
      'Albert Heijn Online Boodschappen',
      'https://www.ah.nl'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['Albert Heijn Online Boodschappen', 'ah.nl']);
  });

  it('should return only domain name when title has no meaningful words', () => {
    const { document, location } = createTestDocument(
      'Home | Welkom',
      'https://www.voorbeeld.nl'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['voorbeeld.nl']);
  });

  it('should handle titles with special characters and include domain', () => {
    const { document, location } = createTestDocument(
      'NS - Nederlandse Spoorwegen',
      'https://www.ns.nl'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['Nederlandse Spoorwegen', 'ns.nl']);
  });

  it('should handle titles with multiple dividers and include domain', () => {
    const { document, location } = createTestDocument(
      'KPN / Internet & TV',
      'https://www.kpn.nl'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['KPN', 'Internet & TV', 'kpn.nl']);
  });

  it('should handle empty titles by returning only domain', () => {
    const { document, location } = createTestDocument(
      '',
      'https://www.voorbeeld.nl'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['voorbeeld.nl']);
  });

  it('should handle titles with only Dutch stop words by returning only domain', () => {
    const { document, location } = createTestDocument(
      'Je in op de',
      'https://www.voorbeeld.nl'
    );
    const suggestions = FormDetector.getSuggestedServiceName(document, location);
    expect(suggestions).toEqual(['voorbeeld.nl']);
  });
});