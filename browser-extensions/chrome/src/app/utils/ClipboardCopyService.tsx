/**
 * Clipboard copy service that keeps track of the last copied ID so it can be shown in the UI.
 */
export class ClipboardCopyService {
  private currentCopiedId: string = '';
  private onCopyCallbacks: ((id: string) => void)[] = [];

  /**
   * Set the copied ID.
   */
  public setCopied(id: string) : void {
    this.currentCopiedId = id;
    this.notifySubscribers();
  }

  /**
   * Get the copied ID.
   */
  public getCopiedId(): string {
    return this.currentCopiedId;
  }

  /**
   * Subscribe to clipboard copy events.
   */
  public subscribe(callback: (id: string) => void) {
    this.onCopyCallbacks.push(callback);
    return () : void => {
      this.onCopyCallbacks = this.onCopyCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers.
   */
  private notifySubscribers() : void {
    this.onCopyCallbacks.forEach(callback => callback(this.currentCopiedId));
  }
}