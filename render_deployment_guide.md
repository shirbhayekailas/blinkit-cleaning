# Render.com Deployment Guide (100% Free Hosting)

Ye guide aapko batayegi ki **Blinkit Dark Store Deep Cleaning Tracker** ko **Render.com** par 100% Free me live kaise karna hai.

---

## 🌟 Render.com Par Kyu Deploy Karein?
* **100% Free Forever**: Zero rupee lagta hai (koi credit card required nahi).
* **Automatic Free SSL Certificate**: https:// secure connection milta hai.
* **Instant Speed**: CDN-backed static hosting (koi cold-start delay nahi hota).
* **Automatic Updates**: Jab bhi aap GitHub par naya code push karenge, Render automatic live kar dega.

---

## 🛠️ Step 1: GitHub Par Repo Banayein Aur Code Push Karein (1 Minute)

1. [GitHub.com](https://github.com/) par jayein aur login karein.
2. Top right corner me **+** icon par click karein ➡️ **New repository**.
3. Settings:
   * **Repository name**: linkit-cleaning-tracker
   * **Visibility**: Public ya Private (dono chalega)
   * **Initialize with README**: *Uncheck rakhein* (tick mat lagayein).
4. Click **Create repository**.
5. Ab apne computer ke terminal / VS Code / Command Prompt me ye 3 commands run karein:

`ash
git branch -M main
git remote add origin https://github.com/AAPKA_USERNAME/blinkit-cleaning-tracker.git
git push -u origin main
`
*(Note: AAPKA_USERNAME ki jagah apna GitHub username dalein).*

---

## 🚀 Step 2: Render.com Par Static Site Banayein (2 Minute)

1. [Render.com](https://render.com/) open karein aur **"Get Started"** ya **"Sign in with GitHub"** karein.
2. Dashboard par top-right corner me **"New +"** button dabayein.
3. Select karein **"Static Site"**.
4. Apni GitHub repository (linkit-cleaning-tracker) connect karein.
5. Render aapse basic details puchega:
   * **Name**: linkit-cleaning-tracker
   * **Branch**: main
   * **Build Command**: 
pm install && npm run build
   * **Publish Directory**: dist
6. *(Important for React Routing)* Niche scroll karein ➡️ **"Advanced"** ya **"Redirects/Rewrites"** me jayein:
   * **Type**: Rewrite
   * **Source**: /*
   * **Destination**: /index.html
   *(Humne project me ender.yaml file daal di hai, jisse Render ye saari settings automatic fill kar deta hai!)*
7. Click karein **"Create Static Site"**.

---

## 🎉 Step 3: Ho Gaya Live!

1. 60 se 90 seconds ke andar Render aapki app ko build karke live kar dega.
2. Aapko ek official live link milega:
   👉 **https://blinkit-cleaning-tracker.onrender.com**
3. Ab aap aur aapke supervisors is link ko kisi bhi mobile, tablet, ya laptop par open kar sakte hain!
4. Mobile me browser kholte hi **"Install App"** ka pop-up aayega, jisse ye direct home screen par Android/iPhone app ban jayegi.

---

## 📲 Android APK Banane Ke Liye:
Jab aapki app Render par live ho jaye, to bas [PWABuilder.com](https://www.pwabuilder.com/) par Render ka link paste karke 1 click me **.apk file** download kar sakte hain aur WhatsApp par share kar sakte hain!
