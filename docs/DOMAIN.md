# Domain Mapping

1. In Heroku → **Settings** → **Domains**, add `ai.hexcarb.in` and copy the Heroku DNS target.
2. In GoDaddy DNS, create a CNAME record for `ai` pointing to the Heroku DNS target from step 1.
3. Wait for the DNS changes to propagate; verify that https://ai.hexcarb.in resolves.
