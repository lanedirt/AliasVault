import { describe, it, expect } from 'vitest';
import { createTestDocument } from './TestUtils';
import { FormDetector } from '../FormDetector';

describe('FormDetector.getSuggestedServiceName (Dutch)', () => {
  it('should extract service name from title with divider', () => {
    const { document, location } = createTestDocument(
      'ING - Online Bankieren',
      'https://www.ing.nl'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('ING');
  });

  it('should extract service name from title without divider', () => {
    const { document, location } = createTestDocument(
      'Bol.com | De winkel van ons allemaal',
      'https://www.bol.com'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('Bol.com');
  });

  it('should handle titles with multiple meaningful words', () => {
    const { document, location } = createTestDocument(
      'Albert Heijn Online Boodschappen',
      'https://www.ah.nl'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('Albert Heijn Online Boodschappen');
  });

  it('should fall back to domain name when title has no meaningful words', () => {
    const { document, location } = createTestDocument(
      'Home | Welkom',
      'https://www.voorbeeld.nl'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('voorbeeld.nl');
  });

  it('should handle titles with special characters', () => {
    const { document, location } = createTestDocument(
      'NS - Nederlandse Spoorwegen',
      'https://www.ns.nl'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('NS - Nederlandse Spoorwegen');
  });

  it('should handle titles with multiple dividers', () => {
    const { document, location } = createTestDocument(
      'KPN / Internet & TV',
      'https://www.kpn.nl'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('KPN');
  });

  it('should handle empty titles', () => {
    const { document, location } = createTestDocument(
      '',
      'https://www.voorbeeld.nl'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('voorbeeld.nl');
  });

  it('should handle titles with only Dutch stop words', () => {
    const { document, location } = createTestDocument(
      'Je in op de',
      'https://www.voorbeeld.nl'
    );
    const serviceName = FormDetector.getSuggestedServiceName(document, location);
    expect(serviceName).toBe('voorbeeld.nl');
  });
});