# How to Push Your Code to GitHub

**Important:** Always follow these steps in this exact order to avoid errors. This is the standard and safest way to keep your local code and GitHub in sync.

1.  **Add all your local changes:** This prepares all your modified files to be saved.
    ```bash
    git add .
    ```

2.  **Commit your changes:** This saves your changes locally with a descriptive message.
    ```bash
    git commit -m "Your descriptive commit message here"
    ```

3.  **Pull the latest changes from GitHub:** This downloads any new updates from the remote repository and merges them with your local changes.
    ```bash
    git pull origin main
    ```
    *If a text editor (like `vim` or `nano`) opens after this command, it means there was a merge. Just save and close it (`Ctrl+X`, then `Y`, then `Enter`).*

4.  **Push your final changes to GitHub:** This uploads your saved and merged changes.
    ```bash
    git push origin main
    ```

---

### **If `git push` Fails (Last Resort)**

If you are still unable to push your code after following the steps above, you can use a "force push". 

**Warning:** This will overwrite any changes on GitHub with your local code. Only use this if you are absolutely sure your local code is the version you want to keep and you don't mind losing any changes that might be on GitHub.

```bash
git push -f origin main
```
