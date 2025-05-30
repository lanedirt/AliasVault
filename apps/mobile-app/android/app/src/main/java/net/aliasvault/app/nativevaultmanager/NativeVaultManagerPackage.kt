package net.aliasvault.app.nativevaultmanager

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import java.util.HashMap

/**
 * The package for the NativeVaultManager module.
 */
class NativeVaultManagerPackage : TurboReactPackage() {
    /**
     * Get the module for the given name.
     */
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            NativeVaultManager.NAME -> NativeVaultManager(reactContext)
            else -> null
        }
    }

    /**
     * Get the React module info provider.
     * @return The React module info provider
     */
    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val moduleMap: MutableMap<String, ReactModuleInfo> = HashMap()
            moduleMap[NativeVaultManager.NAME] = ReactModuleInfo(
                NativeVaultManager.NAME,
                NativeVaultManager::class.java.name,
                false, // canOverrideExistingModule
                true, // needsEagerInit
                true, // hasConstants
                false, // isCxxModule
                true, // isTurboModule
            )
            moduleMap
        }
    }
}
