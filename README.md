# How to Push Your Code to GitHub

**Important:** Always follow these steps in this exact order to avoid errors.

1.  **Pull the latest changes from GitHub:** This downloads any new updates from the remote repository.
    ```bash
    git pull origin main
    ```
    *If a text editor opens after this command, just save and close it (`Ctrl+X`, then `Y`, then `Enter`).*

2.  **Add all your local changes:** This prepares your changes to be saved.
    ```bash
    git add .
    ```

3.  **Commit your changes:** This saves your changes locally with a message.
    ```bash
    git commit -m "Your descriptive commit message here"
    ```

4.  **Push your changes to GitHub:** This uploads your saved changes.
    ```bash
    git push origin main
    ```

---

### **If `git push` Fails (Last Resort)**

If you are still unable to push your code after following the steps above, you can use a "force push". 

**Warning:** This will overwrite any changes on GitHub with your local code. Only use this if you are sure your local code is the version you want to keep.

```bash
git push -f origin main
```
