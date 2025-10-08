# Eitan Medical – Patients & Heart-Rate API

A small, clean **NestJS** service that serves **Patients** and **Heart-Rate Readings** with clear routes, validation, consistent errors and tests (unit + e2e).

## Overview
- **What it does:**  
  1) List/get patients.  
  2) High heart-rate **events** above a threshold.  
  3) **Analytics** (min/max/avg/count) per-patient in a time window.  
  4) Per-patient **requests counter** (counts only data endpoints).
- **Design:** nested routes under `/patients/{id}`, DTO validation at the edge, domain errors via a tiny `AppError` (+ global Problem Filter), structured logs via `nestjs-pino`, Swagger at `/docs`.

## Endpoints (Base: `http://localhost:3000`)
**Patients**
- `GET /patients` – list patients  
- `GET /patients/{id}` – patient profile  
- `GET /patients/{id}/requests` – request counter

**Heart-Rate (per patient)**
- `GET /patients/{id}/heart-rate/events?threshold=100` – readings **> threshold** (100 by default)
- `GET /patients/{id}/heart-rate/analytics?from=...&to=...` – `{ count, min, max, avg }`

**Docs**
- `GET /docs` – Swagger UI

## Errors (Problem Details)
Every error returns:
```json
{ "type":"about:blank","title":"...","status":400,"instance":"/...","code":"...","detail": ... }
