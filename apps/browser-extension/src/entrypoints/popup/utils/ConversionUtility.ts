/**
 * Utility class for conversion operations.
 */
class ConversionUtility {
  /**
   * Convert all anchor tags to open in a new tab.
   * @param html HTML input.
   * @returns HTML with all anchor tags converted to open in a new tab when clicked on.
   *
   * Note: same implementation exists in c-sharp version in AliasVault.Shared.Utilities.ConversionUtility.cs
   */
  public convertAnchorTagsToOpenInNewTab(html: string): string {
    try {
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Select all anchor tags with href attribute
      const anchors = doc.querySelectorAll('a[href]');

      if (anchors.length > 0) {
        anchors.forEach((anchor: Element) => {
          // Handle target attribute
          if (!anchor.hasAttribute('target') || anchor.getAttribute('target') !== '_blank') {
            anchor.setAttribute('target', '_blank');
          }

          // Handle rel attribute for security
          if (!anchor.hasAttribute('rel')) {
            anchor.setAttribute('rel', 'noopener noreferrer');
          } else {
            const relValue = anchor.getAttribute('rel') ?? '';
            const relValues = new Set(relValue.split(' ').filter(val => val.trim() !== ''));

            relValues.add('noopener');
            relValues.add('noreferrer');

            anchor.setAttribute('rel', Array.from(relValues).join(' '));
          }
        });
      }

      return doc.documentElement.outerHTML;
    } catch (ex) {
      // Log the exception
      console.error(`Error in convertAnchorTagsToOpenInNewTab: ${ex instanceof Error ? ex.message : String(ex)}`);

      // Return the original HTML if an error occurs
      return html;
    }
  }
}

export default new ConversionUtility();
