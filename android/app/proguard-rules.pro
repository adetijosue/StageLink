# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor Proguard Rules
-keep class com.getcapacitor.** { *; }
-keep  class * extends com.getcapacitor.Plugin { *; }
-keep  class * extends com.getcapacitor.BridgeActivity { *; }

# WebKit / WebView
-keep class android.webkit.** { *; }

# Keep line numbers for better crash reports (optional but recommended)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
