# Connect to GitHub & Push Code

Follow these steps to connect your local project to a GitHub repository and push your code.

### 1. Initialize Git (if you haven't already)
```bash
git init
```

### 2. Connect to Your GitHub Repository
Replace `YOUR_REPO_URL` with the URL of your repository from GitHub.
```bash
git remote add origin https://github.com/rieeir59-ui/company-management-system-new1.git
```

To check if it was added correctly:
```bash
git remote -v
```

### 3. Fetch and Reset to Match Remote (Resolves Rebase/Merge Issues)
This step will discard your local changes and match your local branch with the remote `main` branch. Use this if you are having trouble with pulling/rebasing.
```bash
git fetch origin
git reset --hard origin/main
```

### 4. Add, Commit, and Push Your Code
Now, re-apply your changes, and then use the following commands.
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

If you still face any errors, you can try forcing the push (use with caution, as it overwrites the remote history):
```bash
git push -u origin main -f
```
---
By following these steps, you can resolve connection and rebasing issues and successfully push your code to GitHub.
