# Manual de Segurança do Aplicativo (Bloqueio por PIN e Biometria)

O **Vault Finance OS** conta com um sistema avançado de proteção de segurança nativa que impede o acesso não autorizado aos seus dados financeiros quando o aplicativo estiver em segundo plano ou fechado.

---

## 🔒 Como funciona o bloqueio automático?

Sempre que você minimizar o aplicativo ou alternar para outra tela do seu dispositivo móvel (colocando o app em background), o Vault Finance OS ativa imediatamente o modo de bloqueio seguro. 

Ao retornar para o aplicativo, a interface inteira será coberta por uma tela protetora fosca (*glassmorphic blur*), garantindo que dados confidenciais de saldos e transações não fiquem expostos no seletor de aplicativos ou para outras pessoas.

---

## 🔑 Opções de Desbloqueio

Você pode restaurar o acesso à sua conta de duas formas práticas e seguras:

### 1. 🖲️ Autenticação Biométrica (Impressão Digital ou Face ID)
* Ao abrir o aplicativo bloqueado, o leitor de biometria nativo do seu dispositivo será acionado automaticamente.
* Basta posicionar o dedo no sensor ou olhar para a câmera para desbloquear o app em frações de segundo.
* **Fallback Manual:** Se a biometria falhar ou for cancelada por engano, você pode clicar no botão **"Usar Biometria"** na parte inferior da tela para disparar o leitor novamente.

### 2. 🔢 Código PIN Numérico (Passcode)
* Caso prefira ou o seu dispositivo não possua leitor biométrico ativo, você poderá digitar o seu código de segurança PIN.
* O teclado numérico suporta códigos seguros de **4 a 6 dígitos**.
* **PIN Padrão:** Por padrão, para fins de demonstração e primeiro acesso, o PIN de fábrica é `1234`. Você pode digitá-lo no teclado numérico para desbloquear o app.

---

## ⚙️ FAQ / Perguntas Frequentes

### O bloqueio funciona na versão Web?
No navegador (Web), a tela de bloqueio simula a autenticação biométrica com fins ilustrativos, liberando o acesso mediante o clique de confirmação ou digitando o PIN `1234` no teclado numérico virtual. A segurança máxima integrada ao hardware (Enclave Seguro) opera exclusivamente na versão móvel compilação Capacitor (Android & iOS).

### Posso mudar meu PIN padrão?
Sim. O PIN de desbloqueio é armazenado de forma segura localmente no dispositivo. Em uma próxima atualização, você poderá alterar o seu PIN diretamente pelas configurações de segurança do aplicativo.

---

## 📱 Dispositivos Autorizados (Sincronização em Segundo Plano)

Para que o aplicativo móvel capte e envie transações do seu celular ao sistema de forma segura, o aparelho deve estar autorizado.

### Como autorizar o telemóvel:
1. **Prompt de Confiança:** Ao fazer login pela primeira vez no app móvel nativo, um modal perguntará: **"Confiar neste aparelho?"**.
2. **Autorização Automática:** Ao clicar em **"Sim"**, o aplicativo solicita um token criptográfico único ao backend Django e o armazena nas preferências seguras do Android.
3. **Resolução de Problemas:** Se o registro falhar e apresentar a mensagem `"Erro ao registrar dispositivo"`, o sistema registrará os detalhes técnicos no console do desenvolvedor (`console.error`). Verifique se a sua conexão está ativa e se a sua sessão do usuário não expirou (tente fazer logout e login novamente para atualizar o token de autorização).
