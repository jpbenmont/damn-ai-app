package com.damn.lockinapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class DamnWakeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        try {
            DamnWakeModule.triggerWakeUp(context)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

