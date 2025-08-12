import subprocess, json, datetime, pathlib

repo_root = pathlib.Path(__file__).resolve().parent.parent
site_dir = repo_root / ('docs' if (repo_root / 'docs' / 'index.html').exists() else '.')

sha = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode().strip()
ts = datetime.datetime.utcnow().isoformat() + 'Z'

site_dir.mkdir(parents=True, exist_ok=True)
(site_dir / 'version.json').write_text(json.dumps({'commit': sha, 'timestamp': ts}))
