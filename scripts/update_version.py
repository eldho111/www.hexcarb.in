import json
import subprocess
from datetime import datetime

def get_git_short_sha():
    return subprocess.check_output([
        'git', 'rev-parse', '--short', 'HEAD'
    ]).decode().strip()

def main():
    data = {
        "commit": get_git_short_sha(),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    with open('version.json', 'w') as f:
        json.dump(data, f)
        f.write('\n')

if __name__ == "__main__":
    main()
