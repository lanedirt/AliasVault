/**
 * Setup the expanded mode.
 */
export function setupExpandedMode() : void {
  /**
   * This runs once when imported and checks if the popup was opened in expanded mode with unlimited width.
   * If not, it sets the width to 350px to force the default popup to a fixed width.
   * This is used to ensure the popup is always a fixed width, even if some content like email preview
   * is too wide to fit in the default width. Some browsers like Firefox and Safari will then try to
   * expand the popup to the width of the content, which can cause the popup to become too wide and bad UX.
   *
   * You can test this by opening the popup and then clicking on the email preview. If the popup width does
   * not change, it works. Then if you expand/popout the extension, the content of the page should adjust
   * to the new width of the resizable popup.
   */
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.get('expanded')) {
    document.documentElement.classList.add('max-w-[350px]');
  }
}
