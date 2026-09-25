# Render.com Deployment Guide (100% Free Live Server & Global Database)

Ye guide aapko batayegi ki **Blinkit Dark Store Deep Cleaning Tracker** ko **Render.com** par 100% Free me live kaise karna hai taaki **Desktop aur Mobile dono aapas me real-time live sync** rahein!

---

## 🌟 Render.com Web Service Kyu Best Hai?
* **100% Free Forever**: Zero rupee lagta hai (koi credit card required nahi).
* **Built-in Server Database**: Jo bhi entry aap Desktop par karenge, wo Render server database par save ho jayegi aur Mobile par instant dikhegi!
* **Automatic Free SSL Certificate**: https:// secure connection milta hai.
* **Automatic Updates**: Jab bhi aap GitHub par code push karenge, Render automatic live kar dega.

---

## 🚀 Setup Steps: Render.com Par Web Service Banayein (2 Minute)

1. [Render.com](https://render.com/) open karein aur **"Sign in with GitHub"** karein.
2. Dashboard par top-right corner me **"New +"** button dabayein.
3. Select karein **"Web Service"** (Important: Static Site ki jagah **Web Service** select karein taaki server database active ho sake).
4. Apni GitHub repository (`blinkit-cleaning`) connect karein.
5. Settings fill karein:
   * **Name**: `blinkit-cleaning-tracker`
   * **Region**: Singapore / Frankfurt (koi bhi)
   * **Branch**: `main`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `node server.cjs`
   * **Instance Type**: `Free`
6. Click karein **"Create Web Service"**.

---

## 🎉 Ho Gaya Live & Connected!

1. 1 se 2 minute me Render aapki app aur backend database dono ko live kar dega.
2. Aapko ek official live link milega:
   👉 **`https://blinkit-cleaning-tracker.onrender.com`**
3. **Ab Global Sync Kaise Kaam Karega**:
   - Aap apne **Desktop** par ye link open karke store add karein ya cleaning entry karein.
   - Apne **Mobile** par wahi link open karein.
   - Mobile app server se sara data automatically download kar legi — **Desktop ki sari entries Mobile par turant dikhne lagengi!**
   - Koi supervisor mobile se entry karega to wo bhi aapko desktop par dikhegi!
