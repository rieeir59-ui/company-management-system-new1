
# Connect Local Project to GitHub & Manage Changes

Here’s a clear step-by-step guide with commands to **connect a local project to GitHub** and perform `pull`, `commit`, and `push` operations. I’ll assume you already have **Git installed** and a **GitHub account**.

### 1. Initialize Git (if you haven't already)
If your project is not already a git repository, open a terminal in your project's root directory and run:
```bash
git init
```

### 2. Connect to Your GitHub Repository
Replace `YOUR_REPO_URL` with the URL of your repository from GitHub.
```bash
git remote add origin https://github.com/rieeir59-ui/company-management-system-new1.git
```
To check if the remote was added correctly:
```bash
git remote -v
```

### 3. Fetch and Reset to Match Remote (Resolves Rebase/Merge Issues)
This step will discard your local changes and match your local branch with the remote `main` branch. Use this if you are having trouble with pulling or rebasing.
```bash
git fetch origin
git reset --hard origin/main
```

### 4. Add, Commit, and Push Your Code
Now, you can re-apply your changes, and then use the following commands to push them to GitHub.
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

If you still face any errors (for example, if the remote branch has history that you want to overwrite), you can try forcing the push. **Use with caution, as this overwrites the remote history:**
```bash
git push -u origin main -f
```
---
By following these steps, you can resolve connection and rebasing issues and successfully push your code to GitHub.
