# Uzhavan Direct — FPO Portal: Audit & Change Report

**Scope:** `index.html`, `app.js`, `style.css` (static SPA) and the existing `server/` API.
**Deliverable:** add a complete **FPO Manager Portal** (Tier‑1 collection → Tier‑2 corridor
batching → Tier‑3 hub dispatch) and wire every FPO action into the shared order
`deliveryStage` so the consumer's live Leaflet map / timeline update instantly.

---

## PART 1 — COMPREHENSIVE REPOSITORY AUDIT

### 1.1 Current state analysis

**Architecture.** Zero-backend static SPA. `index.html` is a shell (auth screen + app shell
with sidebar, topbar, `#viewRoot`), `app.js` holds all state, routing, views and actions,
`style.css` holds a token-based design system. Pages are rendered imperatively: `renderView(viewId)`
clears `#viewRoot` and calls a `renderX(root)` function. No bundler, no framework, no
`package.json` at root. (A separate Express + PostgreSQL API exists at `server/` — see §1.3.)

**Roles present before this change:** `farmer`, `consumer`. The auth screen offered a two-way
role switch (`#roleFarmerBtn` / `#roleConsumerBtn`), `ROLE_LABELS`, `AUTH_ROLE_BUTTONS`, and
`setAuthRole(role)` toggled a single active button.

**Navigation/views (pre-change).**

| Role | Sidebar views |
|---|---|
| farmer | dashboard, sell, bidding, demand, chat |
| consumer | dashboard, nearby, bidding, search, history |
| (both) | non-nav: profile, settings, pending, completed, moneyTable, itemsOrdered, cart, following, farmerProfile |

**State — `store` facade over `localStorage`:**

| Key | Shape |
|---|---|
| `ud_users` | `{username: {username, name, type, password, ...profile}}` |
| `ud_produce` | farmer listings |
| `ud_orders` | order records (the multi-role spine) |
| `ud_auctions` / `ud_demand` | farmer bidding surfaces |
| `ud_cart_<username>` | per-consumer cart |
| `ud_donations` / `ud_ratings` | ledgers |
| `ud_seeded_v2` | one-shot seed guard |
| `ud_demo_credentials_v2` | demo-password migration guard |

`ud_currentUser` is intentionally removed on load (`currentUser = null`) so a login is required
each visit.

**Order tracking stages (pre-change).**

```js
const DELIVERY_STAGES = ['placed','confirmed','packed','atFarmerCity',
                         'atCustomerCity','atFpo','outForDelivery','delivered'];
```

`getOrderStage(o)` migrates legacy values (`atFarmerFpo`→`atFarmerCity`, `atCity`→`atCustomerCity`)
and otherwise derives a stage from `o.status`. Stage writes were **scattered**: the farmer's
`advanceOrderStage()` wrote `deliveryStage` directly, `updateOrderStatus()` wrote `status`
separately, and the tracking modal re-read the order on every open.

### 1.2 Gaps & missing implementations

1. **No FPO role.** No third role button, no `ROLE_LABELS`/`AUTH_ROLE_BUTTONS` entry, no
   `fpo` record shape, no demo FPO login, no signup branch.
2. **No FPO navigation.** `renderNav()` chose between exactly two nav arrays; `renderView()`
   had exactly two role branches.
3. **No logistics state.** There was nowhere to persist a *shipment* (a group of orders moving
   together on one corridor/vehicle). Orders only knew about themselves.
4. **No grading / weighment fields.** Nothing recorded AGMARK quality or a digitally weighed
   quantity distinct from the ordered quantity.
5. **No single stage writer.** Because farmer advance and status updates wrote independently,
   there was no way for an external actor (FPO) to change a stage **and** notify an already-open
   UI. The consumer's tracking modal was a snapshot, not a subscription.
6. **Missing `.btn-success`.** The tracking modal's delivery-schedule form referenced
   `.btn-success`, which was never defined in `style.css` (rendered unstyled).
7. **Backend sync gap (frontend ↔ `server/`).** The Express/PostgreSQL API at `server/` is built
   and tested (25/25) but **the SPA has no API client** — no `fetch` layer, no auth token flow,
   no write-through/outbox. All state is still browser-local.
8. **Stage-model drift.** The API's `DELIVERY_STAGES` (`server/src/lib/http.js`,
   `server/src/routes/orders.js`) is the **7-stage** pipeline; the SPA carries an extra
   `atCustomerCity`. `server/README.md` already flags this. Any sync work must reconcile
   `atCustomerCity` (frontend) vs the FPO stage band used server-side.
9. **Pre-existing security/robustness findings (unchanged, still open).**
   - DOM XSS: raw `innerHTML` interpolation of user input across renderers (e.g. `renderSearch`
     interpolates `No produce matching "${q}"`).
   - Passwords stored in plaintext in `localStorage`.
   - "Money Spent" counts refunded orders.
   - `renderDemand` crashes on an empty array.
   - `getUser()` re-parses `localStorage` on every call.
   - Modals lack Escape-to-close and a focus trap; `tickTimers()` interval is never cleared.
   - Heavy third-party externals (Leaflet, Google Fonts, OSM/Nominatim/OSRM).

### 1.3 Planned code changes & delta

**Files modified:** `app.js` (bulk), `index.html` (one role button + hint copy), `style.css`
(new FPO block + real `.btn-success` + responsive stat strip). `server/` untouched.

**(a) Auth & roles**

- `index.html`: new `🏢 FPO` button — `<button class="role-btn" data-role="fpo" id="roleFpoBtn">`.
- `app.js`: `ROLE_LABELS.fpo='FPO'`; `AUTH_ROLE_BUTTONS={farmer,consumer,fpo}`; `setAuthRole()`
  now toggles all three buttons and every `.roleLabelInline`; `DEMO_LOGIN_USERS.fpo='thanjai_fpo'`;
  signup creates an `fpo` record (`{type:'fpo', cluster, hub}`).

**(b) State & schema evolution**

- New localStorage key **`ud_fpo_batches`** via `store.fpoBatches()` / `store.saveFpoBatches()`,
  holding shipment objects `{id, fpo, sourceCluster, destinationHub, corridor, vehicle,
  orderIds[], status: assembling|dispatched|received, createdAt, dispatchedAt, receivedAt}`.
- New order fields written by FPO actions:
  `fpo`, `fpoGrade` (A/B/C), `fpoWeighKg`, `fpoGradedAt`, `fpoBatchId`, `fpoCorridor`,
  `fpoVehicle`, `fpoDispatchedAt`, `fpoEvAgent`, `fpoEvAssignedAt`.
- New migration guard **`ud_fpo_v1`** → `ensureFpoPortalData()`: creates `thanjai_fpo`, ensures
  `ud_fpo_batches`, and seeds demo orders `fd1`–`fd4` plus batch `fb1` covering every tier.

**(c) New single choke-point for stage writes**

```js
function setOrderStage(orderId, stage, extraFields){
  const orders = store.orders();
  const o = orders.find(x=>x.id===orderId);
  if (!o) return null;
  o.deliveryStage = stage;
  if (stage === 'delivered') o.status = 'completed';
  if (extraFields) Object.assign(o, extraFields);   // e.g. {fpoDispatchedAt}
  store.saveOrders(orders);
  window.dispatchEvent(new CustomEvent('ud-stage-changed', {detail:{orderId, stage}}));
  return o;
}
```

`advanceOrderStage()` (farmer) and `updateOrderStatus()` now delegate to it.
`openTrackingModal()` registers an `onStageChanged` listener (guards on `orderId`, re-reads the
order, resyncs the route, re-renders the timeline, pans the map) and `closeTrackingModal()`
detaches it.

**(d) New views / nav / actions**

- `FPO_NAV = [dashboard, fpoCollect(`fpoTier1`), fpoCorridors(`fpoTier2`), fpoHub(`fpoTier3`)]`.
- `renderNav()` picks FARMER/FPO/CONSUMER nav; `renderView()` gains an `fpo` branch.
- Views: `renderFpoDashboard`, `renderFpoCollection`, `renderFpoCorridors`, `renderFpoHub`,
  `renderFpoProfile`, `renderFpoSettings`.
- Actions: `confirmFpoGrade`, `createFpoBatch`, `dispatchFpoBatch`, `receiveFpoBatch`,
  `assignFpoEvAgent`, `notifyOrderConsumer`.
- Selectors/lookups: `AGMARK_GRADES`, `FPO_CORRIDORS`, `FPO_VEHICLES`, `FPO_EV_AGENTS`,
  `fpoAwaitingGrade`, `fpoEnRoute`, `fpoBatchQueue`, `fpoHubQueue`, `fpoDispatched`,
  `fpoBatchWeightKg`, `fpoBatchStatusLabel`, `fpoSourceForCorridor`, `fpoHubForCorridor`.

**(e) i18n & CSS** — new keys `fpoTier1/fpoTier2/fpoTier3/fpoPortal` in en/ta/hi; a full FPO
style block (tier cards, weigh input, grade picker, capacity meter, queue list, batch cards,
status chips, slot chips, EV assign), a real `.btn-success`, and a `max-width:900px` stat-strip
wrap.

---

## PART 3 — IMPLEMENTATION MAP (updated files)

The complete, updated files **are the ones on disk** — the table below is the index into the
new FPO workflows so the code can be reviewed section by section.

### `index.html`
| Line | Change |
|---|---|
| 45 | `🏢 FPO` role button (`#roleFpoBtn`, `data-role="fpo"`) |
| ~48 | demo-login hint copy → "select Farmer, Consumer or FPO" |

### `app.js` (3,425 lines)
| Lines | Section |
|---|---|
| 362–368 | `store.fpoBatches()` / `saveFpoBatches()` (`ud_fpo_batches`) |
| 383–447 | `ensureFpoPortalData()` — `ud_fpo_v1` migration + demo seed |
| 633 | `AUTH_ROLE_BUTTONS` incl. `fpo` |
| 805–812 | `FPO_NAV` (three tiers) |
| 880–885 | `renderView()` FPO branch |
| 958 | `DELIVERY_STAGES` (shared pipeline) |
| 1040–1060 | `setOrderStage()` choke-point + `advanceOrderStage()` |
| 1379–1402 | tracking modal listener (`onStageChanged`) / `closeTrackingModal` |
| 2009–2025 | FPO PORTAL header comment (tier overview) |
| 2026–2078 | FPO config + lookups (`AGMARK_GRADES`, corridors, vehicles, EV agents, predicates) |
| 2070–2079 | `notifyOrderConsumer()` |
| 2081–2101 | **Tier‑1** `confirmFpoGrade()` |
| 2102–2149 | **Tier‑2** `createFpoBatch()` / `dispatchFpoBatch()` |
| 2150–2190 | **Tier‑3** `receiveFpoBatch()` / `assignFpoEvAgent()` |
| 2192–2322 | `renderFpoDashboard` |
| 2261–2329 | `renderFpoCollection` |
| 2330–2399 | `renderFpoCorridors` |
| 2400–2457 | `renderFpoHub` |
| 2459–2485 | `renderFpoProfile` |
| 2487+ | `renderFpoSettings` |

### `style.css` (658 lines)
| Lines | Section |
|---|---|
| 559, 573, 646 | `.btn-success` (delivery-schedule form + global) |
| 579–645 | FPO portal block (tier grid/cards, weigh input, grade picker, capacity meter, queue list, batch cards, status/slot chips, EV assign) |
| ~648–658 | responsive stat-strip wrap |

### Live-linkage proof points (verified in-browser)
1. FPO grades a lot → it lands in the corridor queue (`ud_fpo_batches` + `fpoGrade`/`fpoWeighKg`).
2. Corridor **Dispatch** → every batched order `deliveryStage='atFpo'` via `setOrderStage`,
   which fires `ud-stage-changed`.
3. Hub **Receive** → batch `status='received'`; **assign EV agent** → order `outForDelivery`
   (guarded: you cannot assign before the shipment is received).
4. Consumer's **open** tracking modal receives `ud-stage-changed` and re-renders the timeline and
   Leaflet map without a reload.
5. Farmer's **Advance tracking** still moves one step and fires the same event.

## Remaining work (not in scope of this change)
- Wire the SPA to `server/` (API client, auth token, write-through/outbox) and reconcile the
  frontend's extra `atCustomerCity` stage with the API's 7-stage model.
- The pre-existing findings in §1.2 item 9 (XSS, plaintext passwords, empty-array crash, etc.).
