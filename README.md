Here’s a clear step-by-step guide with commands to **connect a local project to GitHub** and perform `pull`, `commit`, and `push` operations. I’ll assume you already have **Git installed** and a **GitHub account**.

---

### **1️⃣ Initialize Git in your project**

If your project is not already a Git repository:

```bash
cd /path/to/your/project
git init
```

---

### **2️⃣ Connect your local repo to GitHub**

Replace `YOUR_REPO_URL` with your GitHub repository URL (HTTPS or SSH):

```bash
git remote add origin YOUR_REPO_URL
```

Check if it’s added:

```bash
git remote -v
```

---

### **3️⃣ Pull latest changes from GitHub**

To make sure your local repo is up-to-date:

```bash
git pull origin main
```

> Replace `main` with your branch name if it’s different (e.g., `master`).

---

### **4️⃣ Stage changes**

Add all modified files to the staging area:

```bash
git add .
```

Or add a specific file:

```bash
git add filename
```

---

### **5️⃣ Commit changes**

```bash
git commit -m "Your commit message here"
```

---

### **6️⃣ Push changes to GitHub**

```bash
git push origin main
```

> If it’s your first push to a new repository, you may need:

```bash
git push -u origin main
```

---

### **7️⃣ Optional: Check status**

To see which files are changed or staged:

```bash
git status
```

---

✅ That’s the full workflow:

1. `git init` → initialize repo
2. `git remote add origin <URL>` → connect to GitHub
3. `git pull origin main` → get latest changes
4. `git add .` → stage changes
5. `git commit -m "message"` → commit
6. `git push origin main` → push changes
