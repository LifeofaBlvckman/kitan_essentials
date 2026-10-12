# Kitan Essentials

Online store and admin panel for Kitan Essentials, a clothing and sunglasses brand in Lagos & Ibadan.

- **Store:** `/`
- **Admin:** `/admin/`

## Go live

1. **Supabase:** in a new project, open **SQL Editor**, paste in [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
2. **Admin login:** go to **Authentication → Users → Add user**, enter her email and a password, tick **Auto Confirm**, then run the last 3 lines of `schema.sql` again.
3. **Connect:** paste the Project URL and anon key (**Project Settings → API**) into [`public/js/config.js`](public/js/config.js).
4. **Vercel:** import the repo and deploy. `vercel.json` already handles the settings.

Until step 3 is done, the site runs in demo mode (admin login: `musaolaitan5@gmail.com` / `kitan-demo`).

## In the admin

- **Products:** prices, stock and photos (the first photo is the cover)
- **Storefront:** hero slideshow and lookbook photos
- **Settings:** delivery fees, bank details and WhatsApp number

## Local preview

```bash
npm install && npm run dev   # http://localhost:5173
```
