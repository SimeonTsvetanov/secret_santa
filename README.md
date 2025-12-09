# Secret Santa 🎁
> *Because spreadsheets kill the holiday vibe.*

[![Live App](https://img.shields.io/badge/🎄_Open_App-Secret_Santa-dc2626?style=for-the-badge&logo=gift)](https://simeontsvetanov.github.io/secret_santa/)
[![Support](https://img.shields.io/badge/☕_Buy_Me_A_Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/simeontsvetanov)

A beautifully minimalist, privacy-focused Progressive Web App (PWA) for organizing your Secret Santa gift exchange. No servers, no sign-ups, no nonsense. Just pure holiday spirit (and a bit of JavaScript).

![Clean Interface](https://img.shields.io/badge/Style-Minimalist_Dark_Mode-000000?style=for-the-badge) ![Tech](https://img.shields.io/badge/Built_With-React_x_n8n-blue?style=for-the-badge)

## ✨ Features

- **🥷 Ninja Mode (Secret):** Draw names and automatically email everyone their assignments. Shh!
- **👤 Normal Mode (Party):** Pass the device around. "Don't look!" style.
- **💰 Budget Control:** Set a budget so your rich friends don't show off. *Don't be cheap, though.*
- **📱 PWA Ready:** Install it on your phone just like a native app. Works offline!
- **🔒 Privacy First:** All data stays on your device (localStorage). We don't want to know who you're gifting to.
- **📧 Email Automation:** Powered by **n8n** webhooks for reliable delivery.

## 🚀 How to Use

1. **Add Participants:** Name + Email. Easy.
2. **Set a Budget:** Optional, but recommended to avoid awkward "socks vs. iPad" situations.
3. **Choose Mode:**
   - **Secret:** Click "Send Emails" and let the robots do the work.
   - **Normal:** Click "Draw Names" and pass the phone.
4. **Exchange Gifts:** Try to act surprised.

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (v4)
- **UI Components:** shadcn/ui (radix-ui)
- **Automation:** n8n (Webhook + Gmail)
- **Deployment:** GitHub Pages (via Actions)

## 🏃‍♂️ Run Locally

Clone this repo and bring the holiday spirit to your localhost:

```bash
# Install dependencies (because node_modules are the real gift)
npm install

# Start the dev server
npm run dev
```

## ❤️ Support

If this app saved your holiday party from chaos, consider buying me a coffee. It fuels the code.

[**☕ Buy me a coffee**](https://buymeacoffee.com/simeontsvetanov)

---
*Built with 🎄 by Simeon Tsvetanov*
