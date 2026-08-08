package com.jabeproduction.stagelink

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.getcapacitor.BridgeActivity
import com.jabeproduction.stagelink.ui.StageLinkApp

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            StageLinkApp()
        }
    }
}
