<!-- README.md -->
# AI Football Predictor

Static World Cup site powered by GitHub Actions, Supabase, Cloudflare, and Bluehost static hosting.

## Architecture

- `site/`: static HTML, CSS, and browser JavaScript
- `database/`: Supabase schema, RLS policies, and public views
- `automation/`: GitHub Actions scripts
- `.github/workflows/`: scheduled automation

## Security

- Browser JavaScript may only use `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- GitHub Actions uses `SUPABASE_SERVICE_ROLE_KEY`
- Football API keys never run in the browser
- Public database access is read-only through RLS