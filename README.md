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

### 3. Pull the Latest Changes
It's good practice to pull before you push.
```bash
git pull origin main --allow-unrelated-histories
```

### 4. Add, Commit, and Push Your Code
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

If you face any errors, you can try forcing the push (use with caution):
```bash
git push -u origin main -f
```

---
By following these steps, you can resolve the connection issue and successfully push your code to GitHub.
