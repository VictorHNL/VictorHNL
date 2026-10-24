#!/usr/bin/env python3
"""Atualiza métricas do perfil no SVG; preserva valores existentes se a API falhar."""
import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "assets" / "neofetch.svg"
USER = "VictorHNL"
TOKEN = os.environ.get("GITHUB_TOKEN", "")


def get_json(url):
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "VictorHNL-profile-readme",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.load(response)


def collect():
    user = get_json(f"https://api.github.com/users/{USER}")
    repos = get_json(f"https://api.github.com/users/{USER}/repos?per_page=100&type=owner")
    public_repos = [r for r in repos if not r.get("fork")]
    stars = sum(r.get("stargazers_count", 0) for r in public_repos)
    langs = {}
    for repo in public_repos:
        lang = repo.get("language")
        if lang:
            langs[lang] = langs.get(lang, 0) + 1
    languages = " · ".join(k for k, _ in sorted(langs.items(), key=lambda x: (-x[1], x[0]))[:3]) or "—"
    # Commits públicos no ano corrente, paginados em lotes de 100.
    from datetime import datetime, timezone
    since = datetime(datetime.now(timezone.utc).year, 1, 1, tzinfo=timezone.utc).isoformat()
    commits = 0
    for repo in public_repos:
        try:
            page_number = 1
            while True:
                page = get_json(f"https://api.github.com/repos/{USER}/{repo['name']}/commits?author={USER}&since={since}&per_page=100&page={page_number}")
                commits += len(page)
                if len(page) < 100:
                    break
                page_number += 1
        except (urllib.error.HTTPError, urllib.error.URLError):
            continue
    return {"repos": str(user.get("public_repos", 0)), "stars": str(stars),
            "followers": str(user.get("followers", 0)), "commits": str(commits), "langs": languages}


def replace(svg, key, value):
    return re.sub(rf'(<tspan id="{key}">).*?(</tspan>)', lambda m: m.group(1) + value + m.group(2), svg)


def main():
    svg = SVG.read_text(encoding="utf-8")
    try:
        values = collect()
        for key, value in values.items():
            svg = replace(svg, key, value)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ValueError, KeyError) as exc:
        print(f"GitHub API indisponível; mantendo fallback/últimos valores: {exc}")
    SVG.write_text(svg, encoding="utf-8")
    readme = ROOT / "README.md"
    content = readme.read_text(encoding="utf-8")
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    content = re.sub(r"(Perfil atualizado em )\d{2}/\d{2}/\d{4}", rf"\g<1>{today}", content)
    readme.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    main()
