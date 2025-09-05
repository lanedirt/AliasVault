import WebAuthnUtility from '@/utils/WebAuthnUtility';

/**
 * Utility for detecting platform-specific features.
 */
export default class PlatformUtility {
  /**
   * Check if the current platform is MacOS.
   */
  public static isMacOS(): boolean {
    return WebAuthnUtility.isMacOS();
  }

  /**
   * Check if Touch ID is available on the current device.
   */
  public static async isTouchIDAvailable(): Promise<boolean> {
    return await WebAuthnUtility.isTouchIDAvailable();
  }

  /**
   * Get the appropriate biometric display name based on the platform.
   */
  public static getBiometricDisplayName(): string {
    if (this.isMacOS()) {
      return 'Touch ID';
    }
    
    // Default to a generic name for other platforms
    return 'Biometric Authentication';
  }

  /**
   * Check if biometric authentication is supported on the current platform.
   */
  public static async isBiometricAuthSupported(): Promise<boolean> {
    // For now, we only support Touch ID on MacOS
    if (this.isMacOS()) {
      return await this.isTouchIDAvailable();
    }
    
    return false;
  }
}

