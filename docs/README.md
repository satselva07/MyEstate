# SeRa Web UI (Public + Free Hosting)

This is a static Web UI version of your property booking app, designed for:
- Free public hosting on GitHub Pages
- Free Postgres database on Supabase
- Booking conflict prevention (same property + overlapping dates blocked)
- Storing customer inquiries (name, email, mobile, message)

Includes:
- Public booking page (`index.html`)
- Admin console (`admin.html`) to view bookings and inquiries

## Project structure

- `index.html`, `styles.css`, `app.js`: Web UI
- `config.example.js`: template for Supabase config
- `config.js`: local config (ignored by git)
- `sql/schema.sql`: DB schema + policies + seed data

## 1) Create free Supabase project

1. Go to Supabase and create a project.
2. Open **SQL Editor**, run contents of `sql/schema.sql`.
3. In Supabase project settings, copy:
   - Project URL
   - `anon` public key

## 2) Configure app locally

Edit `config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY",
};
```

## 3) Test locally

From this folder:

```powershell
python -m http.server 8080
```

Open: `http://localhost:8080`

## 4) Publish to GitHub Pages (free)

1. Create a new GitHub repo (example: `sera-webui`).
2. Push files from this folder.
3. In repo settings:
   - **Pages** → **Deploy from a branch**
   - Branch: `main`, Folder: `/ (root)`
4. Your site becomes available at:
   - `https://<github-username>.github.io/sera-webui/`

### Important for config.js

`config.js` is git-ignored. For GitHub Pages, create a committed public config file.

Option A (simple):
- Remove `config.js` from `.gitignore`
- Commit `config.js` with your Supabase URL + anon key (safe for public web clients)

Option B (preferred for clean repo):
- Keep `.gitignore` as is
- Create a separate deployment step/workflow to generate `config.js` at build/publish time

For MVP speed, Option A is easiest.

## 5) Add your custom domain later

When you buy domain:
1. In GitHub Pages settings, set custom domain (e.g., `stay.sera.com`).
2. Add DNS records as GitHub instructs.
3. Enable HTTPS in GitHub Pages.

## Data model behavior

- Booking inserts go to `bookings` table.
- Overlap is blocked by DB exclusion constraint `bookings_no_overlap` for `pending/confirmed` status.
- Inquiries go to `inquiries` table with contact details.

## Admin console

- Open `admin.html`
- Sign in using Supabase Auth email/password
- View latest bookings and inquiries in read-only tables
- Update booking status (`pending`, `confirmed`, `cancelled`) from the bookings table

Create an admin user in Supabase:
- Authentication → Users → Add user
- Use that email/password on `admin.html`

Important: if you already applied SQL earlier, run `sql/schema.sql` again so the `auth update bookings status` policy is created.

## Admin review

Use Supabase Table Editor / SQL to review:
- `public.bookings`
- `public.inquiries`

## Suggested next steps

- Add admin login dashboard for viewing bookings/inquiries from UI
- Add WhatsApp/email notification on new booking request
- Add status updates (`pending` → `confirmed` / `cancelled`) with admin actions
