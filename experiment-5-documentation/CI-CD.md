# TechFest 2026 Portal - CI/CD Pipeline & Version Control Guide

## Course: Web Technology Laboratory (23CSB40B) | Module 5: DevOps & CI/CD

---

## 1. What is CI/CD?
- **Continuous Integration (CI)**: The automated practice of building code and running automated tests whenever code changes are pushed or pull requests are opened. This catches syntax errors, broken tests, security regressions, and build issues early.
- **Continuous Deployment / Delivery (CD)**: The automated deployment of verified code from the repository directly to hosting environments (such as Render or Netlify) once CI checks pass.

---

## 2. GitHub Actions CI Configuration (`.github/workflows/ci.yml`)

The repository includes an automated workflow triggered on every push and pull request to `main` and `feature/**` branches:

```yaml
name: TechFest 2026 Portal CI/CD

on:
  push:
    branches: [ "main", "feature/**" ]
  pull_request:
    branches: [ "main" ]

jobs:
  backend-test:
    name: Backend Tests & Security Checks
    runs-on: ubuntu-latest

    env:
      NODE_ENV: test
      JWT_SECRET: test_jwt_secret_ci_environment_key_12345
      JWT_EXPIRES: 1h
      PORT: 5000

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js 20.x (LTS)
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install backend dependencies
        run: |
          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi

      - name: Run backend security and API test suite
        run: npm test

  frontend-build:
    name: Frontend Build Check
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js 20.x (LTS)
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build frontend if present
        run: |
          if [ -d "client" ] || [ -d "frontend" ] || [ -d "techfest-react" ]; then
            FRONTEND_DIR=$( [ -d "client" ] && echo "client" || ( [ -d "frontend" ] && echo "frontend" || echo "techfest-react" ) )
            echo "Frontend directory detected: $FRONTEND_DIR"
            cd "$FRONTEND_DIR"
            if [ -f package-lock.json ]; then
              npm ci
            else
              npm install
            fi
            npm run build
          else
            echo "No separate frontend folder found in repository root; skipping frontend build step."
          fi
```

---

## 3. How to Demonstrate Red-to-Green CI in Your Lab Exam

Examiners frequently ask students to demonstrate the failure and recovery of a CI pipeline. Follow these exact steps:

### Phase A: Introduce a Deliberate Failure (RED Pipeline)
1. In `tests/api.test.js`, edit the health endpoint test assertion:
   ```javascript
   // Change:
   expect(res.statusCode).toBe(200);
   // To an intentionally wrong expected code:
   expect(res.statusCode).toBe(418); // I'm a teapot (intentional test failure)
   ```
2. Commit and push:
   ```bash
   git add tests/api.test.js
   git commit -m "test: deliberately introduce test failure for CI demonstration"
   git push origin main
   ```
3. Open your GitHub repository → Click on the **Actions** tab.
4. Observe the workflow execution:
   - The job will turn **RED (Failed)** with a red `X` mark.
   - Click into the job log: you will see Jest report:
     `Expected: 418, Received: 200`.

### Phase B: Fix the Test and Restore (GREEN Pipeline)
1. Restore the correct assertion in `tests/api.test.js`:
   ```javascript
   expect(res.statusCode).toBe(200);
   ```
2. Commit and push the fix:
   ```bash
   git add tests/api.test.js
   git commit -m "fix(tests): restore correct HTTP 200 health check assertion"
   git push origin main
   ```
3. Go back to GitHub **Actions** tab:
   - Observe the new workflow run.
   - All 23 tests pass!
   - The workflow icon turns **GREEN (Passed)** with a checkmark.
4. Take a screenshot of the commit history and the green checkmark for your lab record.

---

## 4. Git Branching & Merge Conflict Demonstration (Lab Viva Reference)

### Branching & Merging Steps
1. Create a feature branch:
   ```bash
   git checkout -b feature/security
   ```
2. Make changes, stage and commit:
   ```bash
   git add .
   git commit -m "feat(security): enable helmet security headers"
   ```
3. Merge back into main:
   ```bash
   git checkout main
   git merge --no-ff feature/security -m "merge: integrate feature/security branch"
   ```

### Controlled Merge Conflict Demonstration
1. Create base file on `main`:
   ```bash
   echo "Base policy: default settings" > conflict-demo.txt
   git add conflict-demo.txt && git commit -m "docs: add conflict demo file"
   ```
2. Branch A modifies line 1:
   ```bash
   git checkout -b demo/team-auth
   echo "Team Auth: mandates httpOnly cookies" > conflict-demo.txt
   git add conflict-demo.txt && git commit -m "docs(auth): specify cookie policy"
   ```
3. Branch B modifies line 1 from main:
   ```bash
   git checkout main
   git checkout -b demo/team-headers
   echo "Team Headers: mandates strict Helmet CSP" > conflict-demo.txt
   git add conflict-demo.txt && git commit -m "docs(headers): specify helmet policy"
   ```
4. Merge Branch A into Branch B:
   ```bash
   git merge demo/team-auth
   ```
   *Result*: Git detects conflicting edits on line 1 and outputs:
   ```text
   CONFLICT (content): Merge conflict in conflict-demo.txt
   Automatic merge failed; fix conflicts and then commit the result.
   ```
5. View conflict markers:
   ```text
   <<<<<<< HEAD
   Team Headers: mandates strict Helmet CSP
   =======
   Team Auth: mandates httpOnly cookies
   >>>>>>> demo/team-auth
   ```
6. Resolve conflict:
   Open `conflict-demo.txt`, remove `<<<<<<<`, `=======`, `>>>>>>>` markers, combine the desired changes, then:
   ```bash
   git add conflict-demo.txt
   git commit -m "fix(merge-conflict): resolve conflict between team-headers and team-auth"
   ```

