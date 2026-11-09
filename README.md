# ballware-keycloak
Customized keycloak server with ballware user and role management extensions

## Versionen (Compile-Basis = Laufzeit-Basis)

| Stelle | Stand |
|---|---|
| Base-Image (`Dockerfile`) | `quay.io/keycloak/keycloak:26.8.2` (UBI 9.8, OpenJDK 21.0.13, linux/amd64 + linux/arm64) |
| `token-mapper/pom.xml`, `user-role-api/pom.xml` | `keycloak.version` `26.8.2` |
| `ballware-keycloakify` | `keycloakify` `11.16.4`, `@keycloakify/keycloak-account-ui` `~260700.0.4` (es gibt noch keine 26.8-Linie), `@keycloak/keycloak-admin-client` `26.8.2` |
| Dev-DB (`.devcontainer/docker-compose.yml`) | `postgres:17` (`KC_DB=postgres`, `jdbc:postgresql://db:5432/keycloak`) |
| Prod-DB | Azure PostgreSQL (`ballware.postgres.database.azure.com`) |

`@keycloakify/keycloak-ui-shared@~260700.0.3` deklariert `@keycloak/keycloak-admin-client` `26.7.0` als
Peer. Der Pin auf `26.8.2` läuft deshalb über den `overrides`-Block in
`ballware-keycloakify/package.json`; ohne ihn bricht `npm ci` (und damit der `keycloakifybuilder`-Stage).

## Build / Verifikation

```bash
mvn -q -f token-mapper/pom.xml clean package
mvn -q -f user-role-api/pom.xml clean package
docker build -t ballware-keycloak:26.8.2 .
docker compose -f .devcontainer/docker-compose.yml up --build   # KC 26.8.2 + postgres:17, start-dev --import-realm
```

Der Export aus einer laufenden Instanz braucht denselben DB-Zugang und darf nicht den Management-Port
des laufenden Servers belegen:

```bash
docker exec -e KC_DB=postgres -e KC_DB_URL=... -e KC_DB_USERNAME=... -e KC_DB_PASSWORD=... \
  -e KC_HEALTH_ENABLED=false <kc> /opt/keycloak/bin/kc.sh export \
  --dir /opt/keycloak/data/export --users realm_file --realm ballware
```

`import/ballware-realm.json` ist ein 26.8.2-Export (Namenskonvention `<realm>-realm.json` für
`--import-realm`); `keycloak-export/ballware-realm.json` ist derselbe Export in Roh-Formatierung
(Referenz, ohne Userdaten).

## Bekannte Verhaltensänderungen 26.6 → 26.8.2

| Änderung | Auswirkung hier | Status |
|---|---|---|
| Admin-Rest-API-Audience-Check + Client-Scope `kc-admin-api` (26.8.2) | Der alte Import (`keycloakVersion 22.0.4`) kannte den Scope nicht; `security-admin-console`/`admin-cli` haben ihn jetzt in den Default-Scopes | behoben (neu erzeugtes JSON), verifiziert: `kcadm` + Admin Console grün |
| Altes Import-JSON ist nicht mehr importierbar | `--import-realm` mit dem 22.0.4-JSON bricht auf **beiden** Ständen mit `Unable to find composite client role: manage-account` (getestet gegen 26.6.4 und 26.8.2) | behoben durch den 26.8.2-Export; Prod ist nicht betroffen (kein Re-Import) |
| DCR-Policy „Default Roles Disabled“ (26.8.2) | erscheint jetzt als `ClientRegistrationPolicy` im Export; **kein rolling upgrade** | dokumentiert, siehe Prod-Rollout |
| Admin-Zugriff über Protocol-Mapper-Rollen abgeschaltet (26.7.1) | Tokens mit `right`-Claims erhalten keinen Admin-API-Zugriff (verifiziert: `401` auf `/admin/realms/ballware/*`) | keine Anpassung nötig – ballware nutzt nur die Custom-Endpoints |
| Login-Failures in der DB, Tabelle `login_failure` (26.8.0) | Sperren überleben Container-Neustarts (verifiziert), zusätzliche DB-Schreiblast | dokumentiert |
| Index-Neubau Offline-Sessions + Auto-`CREATE INDEX CONCURRENTLY`, Skip ab 300 000 Zeilen (26.8.0) | langer erster Start nach der Migration | beobachten |
| Async-Commit für ephemere Tabellen (Postgres, 26.7.0) | Session-/Event-Writes nicht mehr synchron; Opt-out `--spi-connections-jpa--quarkus--async-commit=false` | bewusst nicht gesetzt |
| Themes: IdP-Button-Redesign (26.8.0), Login-Button-Layout + FreeMarker 2.3.32 (26.7.0) | `identityProviders: []` → keine IdP-Buttons; Theme e2e-grün | verifiziert |
| SMTP: StartTLS verpflichtend, kein Plaintext-Fallback (26.8.1) | Versand schlägt fehl, wenn STARTTLS scheitert (`smtp.strato.de:587`, `starttls: true`) | manueller Test mit echtem SMTP-Passwort erforderlich |
| `fullScopeAllowed` deprecated → WARN je Token (`Client 'ballwareweb' ... Full scope allowed`) | Log-Rauschen in Prod | bewusst **nicht** umgestellt: `RoleResolveUtil#getResolvedRealmRoles` liefert nur scope-gemappte Rollen, der `right`-Claim würde schmaler |
| Redirect-URIs mit `state`/`code`/`session_state` werden abgelehnt (26.7.3) | bestehende URIs sind sauber (`/signin-oidc`) | verifiziert |
| Deaktivierte Clients verlieren Audiences in `aud`/`resource_access` (26.8.0) | `Audience`-Mapper (`included.custom.audience: metaApi`) bleibt unverändert | verifiziert |
| `KC_PROXY` existiert seit 26.0 nicht mehr | `.env`-Relikt entfernt; hinter Load-Balancer `KC_PROXY_HEADERS=x-forwarded` | behoben |
| Shutdown-Timeout 10 s (26.7.0) | Orchestrator muss ≥ 15 s Grace erlauben (`--shutdown-timeout` zum Zurücksetzen) | Prod-Rollout |
| `kcadm`/`kcreg` lehnen selbstsignierte Zertifikate ohne Truststore ab (26.8.2) | nur Scripting gegen `start-dev` mit `--https-certificate-file` | Devcontainer: `kcadm` im Container nutzen |
| User Profile: unmanaged Attribute (25+) | In einem **frisch** erzeugten Realm werden `tenant`, `person`, `allowed_tenant`, `current_tenant`, `displayname` stillschweigend verworfen, wenn `unmanagedAttributePolicy` nicht gesetzt ist. Migration-Importe (Legacy-Realm) bekommen `ENABLED` automatisch. | behoben: das neue JSON enthält die `declarative-user-profile`-Komponente mit `"unmanagedAttributePolicy": "ENABLED"` |
| `passwordPolicy` `hashIterations(27500)` | KC 26 hashlt Argon2 → `WARN ... Iterations for Argon should be less than 100, using default`; der Wert ist wirkungslos | Follow-up: Policy bereinigen |
| `roles().getRoleById(realm, null)` | wirft in 26.8.2 `NullPointerException: Null keys are not supported!` (26.6: `null`); `POST /ballware-role-api/save` mit `"id": null` gibt 500 statt in den Create-Zweig zu fallen | unkritisch (der Client sendet die UUID aus `GET /new`), Härtung: `role.getId() != null` abfragen |
| `spi-sticky-session-encoder--infinispan--should-attach-route` deprecated | WARN beim Start | optional auf `false` setzen |
| Deprecated-Features `identity-brokering-api:v1`, `twitter-broker:v1` noch default | WARN beim Start | Follow-up (KC 27) |

## Prod-Rollout (Azure PostgreSQL, `ghcr.io/ballware/ballware-keycloak`)

1. Backup/Restore-Point der Postgres-DB vor der Migration (Downgrade nur mit Backup).
2. **Alle Keycloak-Instanzen stoppen** – 26.8.2 unterstützt wegen der
   Client-Registration-Policy-Migration kein rolling upgrade; gemischte 26.6/26.8-Knoten produzieren
   Tokens ohne `kc-admin-api`-Audience → 401 in Admin Console/`kcadm`.
3. Neues Image starten, Migration läuft automatisch; `--server-async-bootstrap` ist nicht nötig
   (Health-Endpoints gehen hoch, Readiness bleibt während der Initialisierung DOWN).
4. LB-Health-Check auf `/health/ready` (Management-Port 9000) statt reinem Port-Check.
5. Verifikation ohne Re-Import des Realms: `kcadm get realms/ballware/client-scopes` muss
   `kc-admin-api` enthalten; `right`-Claim, `ballware-role-api`/`ballware-user-api` (401/403/200),
   Theme-Branding, SMTP-Passwort-Reset, Brute-Force-Sperre nach Neustart (`select * from login_failure`).
6. Termination Grace Period ≥ 15 s (Shutdown-Timeout ist 10 s).

## Follow-ups

- `ballwareweb` von `fullScopeAllowed` auf explizite Client-Role-Scope-Mappings umstellen (eigener Plan).
- CORS-Härtung der Custom-Endpoints: `Cors.checkAllowedOrigins(...)` statt `allowAllOrigins()`.
- `@keycloakify/keycloak-account-ui` auf eine 26.8-Linie (`260800.x`) heben, sobald publiziert;
  danach `src/account/**` via `keycloakify own` neu abgleichen.
- KC-27-Vorbereitung: SHA1-Hashing entfällt → Realm-Hashing-/Credential-Konfiguration prüfen.
