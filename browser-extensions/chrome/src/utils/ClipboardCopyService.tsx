export class ClipboardCopyService {
    private currentCopiedId: string = '';
    private onCopyCallbacks: ((id: string) => void)[] = [];

    public setCopied(id: string) {
      this.currentCopiedId = id;
      this.notifySubscribers();
    }

    public getCopiedId(): string {
      return this.currentCopiedId;
    }

    public subscribe(callback: (id: string) => void) {
      this.onCopyCallbacks.push(callback);
      return () => {
        this.onCopyCallbacks = this.onCopyCallbacks.filter(cb => cb !== callback);
      };
    }

    private notifySubscribers() {
      this.onCopyCallbacks.forEach(callback => callback(this.currentCopiedId));
    }
  }