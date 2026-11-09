# RSVP backend (Google Sheets)

Without this, RSVPs are saved only in each guest's own browser, so the counter
isn't shared. With it, every response lands in a Google Sheet you own and all
guests see the same live count.

1. Create a new Google Sheet (e.g. "Kyaw & Shwe RSVPs").
2. **Extensions → Apps Script**. Replace the contents of `Code.gs` with the file
   in this folder and save.
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise when prompted, then copy the **Web app URL** (ends in `/exec`).
5. In the project root create `.env.local`:

   ```
   VITE_RSVP_ENDPOINT=https://script.google.com/macros/s/XXXXXXXX/exec
   ```

   Set the same variable in your hosting provider (Vercel / Netlify / etc.).
6. Rebuild / redeploy the site.

After changing `Code.gs`, use **Deploy → Manage deployments → Edit → New
version** so the URL stays the same.
