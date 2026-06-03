**Placement Cell Portal**

A simple backend API for a placement cell portal (Express + MongoDB).

**Requirements**
- **Node.js** (v16+ recommended)
- **npm**
- A MongoDB Atlas cluster or accessible MongoDB instance

**Setup**
- Copy or create an `.env` file in the `backend` folder with the required environment variables (see below).
- Install dependencies and start the server:

```bash
cd backend
npm install
npm run dev   # development (nodemon)
npm start     # production
```

**Environment variables**
Create `backend/.env` and set:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/placementPortal?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
```

- The repository ignores `.env` (see [.gitignore](.gitignore)).
- If your password contains special characters, URL-encode them (e.g. `@` → `%40`).
- If you see DNS SRV lookup errors (`querySrv ENOTFOUND`), confirm the cluster host is correct and your IP is whitelisted in Atlas Network Access.

**Key files**
- Server entry: [backend/server.js](backend/server.js#L1)
- DB connection: [backend/config/db.js](backend/config/db.js#L1)
- Models: [backend/models](backend/models)

**Notes**
- This repo contains only the backend. Keep secrets out of version control.

---
Created and pushed from the local workspace.
