package com.damn.lockinapp

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.view.WindowManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DamnWakeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        instance = this
    }

    override fun getName(): String = "DamnWakeModule"

    companion object {
        var instance: DamnWakeModule? = null

        fun triggerWakeUp(context: Context) {
            try {
                val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager

                // 1. Physically turn on the AMOLED display
                val wakeLock = powerManager?.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                    "DAMN:ScreenWakeUpLock"
                )
                wakeLock?.acquire(10000)

                // 2. Launch MainActivity over lock screen
                val intent = Intent(context, MainActivity::class.java).apply {
                    addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                    )
                    putExtra("WAKE_REASON", "VOICE_WAKE")
                }
                context.startActivity(intent)

                // 3. Unlock / Dismiss keyguard if activity available
                instance?.currentActivity?.let { activity ->
                    activity.runOnUiThread {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                            activity.setShowWhenLocked(true)
                            activity.setTurnScreenOn(true)
                        }
                        activity.window.addFlags(
                            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                        )
                        val keyguardManager = activity.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            keyguardManager?.requestDismissKeyguard(activity, null)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @ReactMethod
    fun wakeUpScreen(promise: Promise) {
        try {
            triggerWakeUp(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            e.printStackTrace()
            promise.reject("WAKE_SCREEN_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startForegroundWakeService(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, DamnForegroundService::class.java).apply {
                action = DamnForegroundService.ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            e.printStackTrace()
            promise.reject("FOREGROUND_SERVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopForegroundWakeService(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, DamnForegroundService::class.java).apply {
                action = DamnForegroundService.ACTION_STOP
            }
            context.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            e.printStackTrace()
            promise.reject("STOP_SERVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isScreenInteractive(promise: Promise) {
        try {
            val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
            val isInteractive = powerManager?.isInteractive ?: true
            promise.resolve(isInteractive)
        } catch (e: Exception) {
            promise.resolve(true)
        }
    }
}