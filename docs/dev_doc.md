# 🏨 Myroomify Frontend – Fejlesztői Dokumentáció

Ez a dokumentáció a **Myroomify** szállásfoglaló rendszer frontend felépítését és fejlesztői környezetét írja le.

---

## 🛠 Eszközök és Verziók
A projekt a legfrissebb Angular ökoszisztémára épül, biztosítva a modern fejlesztői élményt.

| Eszköz | Verzió |
| :--- | :--- |
| **Angular** | 20.x |
| **Node.js** | v22.x |
| **Csomagkezelő** | npm (10.9.2) |
| **Stíluskezelés** | SCSS / CSS |

---

## 🚀 Indítás (Development Setup)

A fejlesztői környezet elindításához kövesd az alábbi parancsokat a projekt gyökérkönyvtárában:

```bash
# Függőségek telepítése
npm install

# Fejlesztői szerver indítása
# Az alkalmazás automatikusan megnyílik a http://localhost:4200 címen
ng serve -o
```

---

---

## 🏗 Architektúra részletei

### 📂 Szolgáltatások (Services) - `shared/`
A projekt üzleti logikája és az API kommunikáció szigorúan elkülönített szervizekben történik a **DRY** (Don't Repeat Yourself) elv mentén.

#### 🔐 Auth & Biztonság
* `AuthService`: Kezeli a bejelentkezést, kijelentkezést és a munkamenet állapotát.
* `AuthInterceptor`: Automatikusan beilleszti a JWT tokent a kimenő HTTP kérések fejlécébe.
* `RoleGuard`: Megvalósítja az útvonalvédelmet a felhasználói szerepkörök alapján (Vendég vs. Admin).

#### ⚙️ Admin Funkciók
Az adminisztrációs felület az alábbi dedikált szervizeket használja:
* `AdminUserService` / `AdminGuestService`: Teljes körű CRUD műveletek a rendszerfelhasználókhoz és a vendégadatokhoz.
* `AdminRoomsService` / `AdminRoomService`: A szobák listázásának és részletes adatainak kezelése.
* `AdminImageService`: Dedikált szerviz a képfeltöltések és tárolási hivatkozások kezeléséhez.
* `AdminBookingService`: A vendégfoglalások teljes életciklusának menedzselése.

#### 👤 Felhasználói Funkciók (Me & Public)
* `MeProfileService` / `MeBookingService`: A bejelentkezett felhasználó saját profiljának és előzményeinek elérése és frissítése.
* `PublicRoomService`: Lekéri a nyilvános szobaadatokat (bejelentkezés nélkül is elérhető).

---

### 🧩 Komponensek Felépítése
A vizuális elemek logikailag elkülönített modulokba szerveződnek a feladatok tiszta szétválasztása érdekében.

#### 🔑 Beléptetés
* `register/`: Regisztrációs folyamat új felhasználók számára.
* `login/`: Biztonságos hozzáférés a meglévő felhasználóknak.

#### 🏠 Vendég Felület (`guest/`)
Minden, ami a látogatói élménnyel kapcsolatos:
* `guestHomePage`: A vendégház főoldala.
* `guestRooms` / `guestRoom`: Szobaböngésző felület és részletes szobaadatlapok.
* `guestGallery`: A szálláshely vizuális bemutatása.
* `guestNavbar` & `guestProfile`: Navigáció és személyes beállítások kifejezetten vendégeknek.

#### 🛠 Admin Felület (`admin/`)
Korlátozott hozzáférésű terület a szálláshely kezeléséhez:
* `AdminRooms` / `AdminRoom`: Szobakészlet-kezelő és szerkesztő űrlapok.
* `AdminBookings` / `AdminGuests`: Interaktív foglalási naptár és vendégadatbázis.
* `AdminUsers`: A személyzeti/adminisztrátori fiókok kezelése.
* `AdminNavbar`: Speciális oldalsáv/navigáció adminisztratív gyorshivatkozásokkal.

---