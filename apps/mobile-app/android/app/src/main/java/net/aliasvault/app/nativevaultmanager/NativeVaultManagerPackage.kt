package net.aliasvault.app.nativevaultmanager

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import java.util.HashMap

class NativeVaultManagerPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            NativeVaultManager.NAME -> NativeVaultManager(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val moduleMap: MutableMap<String, ReactModuleInfo> = HashMap()
            moduleMap[NativeVaultManager.NAME] = ReactModuleInfo(
                NativeVaultManager.NAME,
                NativeVaultManager::class.java.name,
                false, // canOverrideExistingModule
                true,  // needsEagerInit
                true,  // hasConstants
                false, // isCxxModule
                true   // isTurboModule
            )
            moduleMap
        }
    }
}