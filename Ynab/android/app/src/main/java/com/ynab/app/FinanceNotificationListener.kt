package com.ynab.app // Certifica-te de que este corresponde ao teu pacote real

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class FinanceNotificationListener : NotificationListenerService() {

    // 🎯 Variáveis de teste unificadas aqui dentro para que o Android as leia corretamente:
    private val targetPackages = setOf(
        "com.nu.production",
        "com.cgd.mobile",
        "com.revolut.production",
        "com.google.android.apps.messaging" // Suporte temporário para SMS padrão
    )

    private val financialKeywords = listOf(
        "compra", "aprovada", "transferência", "pix", "€", "r$", "teste"
    )

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName
        if (!targetPackages.contains(packageName)) return

        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val fullText = "$title - $text"

        if (financialKeywords.none { fullText.lowercase().contains(it) }) return

        val sharedPref = applicationContext.getSharedPreferences("VaultFinancePrefs", Context.MODE_PRIVATE)
        val deviceKey = sharedPref.getString("DEVICE_KEY", null)

        if (deviceKey != null) {
            sendToDjangoBackend(fullText, packageName, deviceKey)
        } else {
            Log.e("VaultFinance", "Device Key não encontrada. Notificação ignorada.")
        }
    }

    private fun sendToDjangoBackend(notificationText: String, packageName: String, deviceKey: String) {
        thread {
            try {
                val url = URL("https://ynab-backend.onrender.com/api/inbox/notification/")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; utf-8")
                conn.setRequestProperty("Accept", "application/json")
                conn.setRequestProperty("Authorization", "DeviceKey $deviceKey")
                conn.doOutput = true

                val jsonParam = JSONObject()
                jsonParam.put("text", notificationText)
                jsonParam.put("package_name", packageName)

                OutputStreamWriter(conn.outputStream).use { os ->
                    os.write(jsonParam.toString())
                    os.flush()
                }

                val responseCode = conn.responseCode
                Log.d("VaultFinance", "Status do envio para Inbox IA: $responseCode")

                if (responseCode in 200..299) {
                    showLocalNotification("Transação salva no sistema")
                }

                conn.disconnect()
            } catch (e: Exception) {
                Log.e("VaultFinance", "Erro de rede no background: ${e.message}")
            }
        }
    }

    private fun showLocalNotification(text: String) {
        val channelId = "vault_finance_channel"
        val channelName = "Vault Finance OS"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificações de sincronização do Vault Finance OS"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Vault Finance OS")
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }
}