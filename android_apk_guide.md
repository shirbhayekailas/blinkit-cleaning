# Android APK Generation & WhatsApp Distribution Guide

Ye guide aapko batayegi ki **Android APK file (.apk)** kaise banani hai aur supervisors ko WhatsApp par kaise bhejni hai.

---

## 🚀 Tarika 1: 1-Minute Free Cloud APK (Sabse Aasan & Tez)

Is tarike me aapko apne computer par koi 10GB ka Android Studio ya Java install nahi karna padta. Microsoft ka official trusted tool **PWABuilder** use hota hai.

### Steps:
1. **App ko Vercel ya Netlify par live karein** (e.g. `https://blinkit-cleaning.vercel.app`).
2. Browser me [PWABuilder.com](https://www.pwabuilder.com/) open karein.
3. Apna URL paste karein aur **"Start"** par click karein.
4. PWABuilder aapke PWA manifest aur icons ko check karega (100% Score aayega).
5. **"Package for Android"** button par click karein.
6. Settings me:
   * **Package ID**: `com.blinkit.deepcleaning`
   * **App Name**: `Blinkit Cleaning`
7. **"Generate APK / Package"** par click karein.
8. 30 seconds ke andar aapko `Blinkit_Cleaning.apk` file download ho jayegi!

### WhatsApp par Bhejne Ka Tarika:
1. WhatsApp Web ya WhatsApp Desktop kholein.
2. Apne supervisor ki chat kholein.
3. Attachment (Paperclip icon) 📎 par click karein ➡️ **Document** chunein.
4. `Blinkit_Cleaning.apk` file select karke bhej dein!
5. Supervisor apne mobile me us par tap karega aur **Install** kar lega.

---

## 🛠️ Tarika 2: Capacitor Native Android Build (Local Android Studio)

Agar aapke paas ya aapke developer ke paas **Android Studio** hai:

```bash
# 1. Project directory me jayein
cd blinkit-deepcleaning-tracker

# 2. Latest web build banayein
npm run build

# 3. Capacitor Android initialize karein
npx cap add android

# 4. Web build ko Android folder me copy karein
npx cap copy android

# 5. Android Studio me project kholein
npx cap open android
```

Android Studio me:
* **Build** menu ➡️ **Build Bundle(s) / APK(s)** ➡️ **Build APK(s)**.
* Output file: `android/app/build/outputs/apk/debug/app-debug.apk`.
* Is file ka naam badal kar `Blinkit_Cleaning_App.apk` rakh kar WhatsApp par bhej sakte hain.

---

## 💡 Supervisor ke Mobile me Install Kaise Hoga?
1. Supervisor WhatsApp par file par click karega.
2. Android puchega: *"Install from unknown source / WhatsApp?"*
3. Supervisor **"Allow"** karega.
4. App install ho jayegi aur phone ki home screen par **Blinkit Cleaning** ka icon aa jayega!
