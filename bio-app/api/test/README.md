# bio-app API automated tests

Run unit tests:

```powershell
npm test
```

Run the complete HTTP route smoke test against a running API server:

```powershell
$env:BIO_API_BASE_URL = "http://127.0.0.1:9092"
npm run test:api:all
```

The smoke test discovers every router mounted by `src/server.js`, calls every
declared GET/POST/PUT/DELETE/PATCH endpoint, rejects global-404 fallthrough and
HTTP 5xx responses, and reports each route as an individual subtest. Requests
use deliberately empty bodies and placeholder IDs so the default run does not
create, update, or delete production records.

Set `BIO_API_TOKEN` only when testing a dedicated disposable database. An
authenticated run can reach mutation handlers and therefore must not target a
production environment.

Optional timeout setting:

```powershell
$env:BIO_API_TEST_TIMEOUT_MS = "30000"
```
