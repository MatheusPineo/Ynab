package com.ynab.app

import android.Manifest
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.PermissionState
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(
    name = "DeviceAuth",
    permissions = [
        Permission(
            strings = [Manifest.permission.POST_NOTIFICATIONS],
            alias = "notifications"
        )
    ]
)
class DeviceAuthPlugin : Plugin() {

    @PluginMethod
    fun checkNotificationPermission(call: PluginCall) {
        val context = context
        val packageNames = NotificationManagerCompat.getEnabledListenerPackages(context)
        val isGranted = packageNames.contains(context.packageName)
        
        val ret = JSObject()
        ret.put("granted", isGranted)
        call.resolve(ret)
    }

    @PluginMethod
    fun checkPostNotificationPermission(call: PluginCall) {
        val ret = JSObject()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val isGranted = getPermissionState("notifications") == PermissionState.GRANTED
            ret.put("granted", isGranted)
        } else {
            ret.put("granted", true)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun requestPostNotificationPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (getPermissionState("notifications") != PermissionState.GRANTED) {
                requestPermissionForAlias("notifications", call, "notificationsCallback")
            } else {
                val ret = JSObject()
                ret.put("granted", true)
                call.resolve(ret)
            }
        } else {
            val ret = JSObject()
            ret.put("granted", true)
            call.resolve(ret)
        }
    }

    @PermissionCallback
    private fun notificationsCallback(call: PluginCall) {
        val ret = JSObject()
        val isGranted = getPermissionState("notifications") == PermissionState.GRANTED
        ret.put("granted", isGranted)
        call.resolve(ret)
    }

    @PluginMethod
    fun openNotificationSettings(call: PluginCall) {
        val context = context
        activity.runOnUiThread {
            val builder = AlertDialog.Builder(activity)
            builder.setTitle("Permissão de Leitura de Notificações")
            builder.setMessage("Para sincronizar suas despesas e faturas de forma automática e inteligente, o Vault Finance OS precisa ler as notificações recebidas de aplicativos financeiros. Na próxima tela, por favor, ative a chave do nosso aplicativo.")
            builder.setPositiveButton("Continuar") { _, _ ->
                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                call.resolve()
            }
            builder.setNegativeButton("Cancelar") { _, _ ->
                call.reject("Usuário cancelou o acesso à leitura de notificações.")
            }
            builder.setCancelable(false)
            builder.show()
        }
    }

    @PluginMethod
    fun storeDeviceKey(call: PluginCall) {
        val token = call.getString("token")
        if (token == null) {
            call.reject("Token is required")
            return
        }

        val sharedPref = context.getSharedPreferences("VaultFinancePrefs", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putString("DEVICE_KEY", token)
            apply()
        }
        
        call.resolve()
    }

    @PluginMethod
    fun getDeviceKey(call: PluginCall) {
        val sharedPref = context.getSharedPreferences("VaultFinancePrefs", Context.MODE_PRIVATE)
        val key = sharedPref.getString("DEVICE_KEY", null)
        val ret = JSObject()
        ret.put("key", key)
        call.resolve(ret)
    }
}