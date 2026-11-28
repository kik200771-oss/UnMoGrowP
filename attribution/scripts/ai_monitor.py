import os, requests, datetime, json

repo_url = os.getenv("REPO_URL")
token = os.getenv("GITHUB_TOKEN")
headers = {"Authorization": f"token {token}"}

owner_repo = repo_url.replace("https://github.com/", "")
today = datetime.datetime.utcnow().strftime("%Y-%m-%d")

print(f"📊 Analyzing repository: {owner_repo} on {today}")

# Получаем последние 10 коммитов
commits_url = f"https://api.github.com/repos/{owner_repo}/commits"
commits = requests.get(commits_url, headers=headers).json()[:10]

summary = {
    "date": today,
    "commits": [],
}

for c in commits:
    summary["commits"].append({
        "sha": c.get("sha"),
        "author": c.get("commit", {}).get("author", {}).get("name"),
        "message": c.get("commit", {}).get("message"),
        "url": c.get("html_url"),
    })

output_dir = "reports/daily"
os.makedirs(output_dir, exist_ok=True)
with open(f"{output_dir}/report_{today}.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"✅ Report saved to {output_dir}/report_{today}.json")