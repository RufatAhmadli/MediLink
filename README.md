# MediLink — frontend prototype

**Your medical history, wherever you go.**

MediLink connects private clinics and labs in Azerbaijan. Patients book doctor visits and lab tests, and their verified results and doctor summaries follow them from one provider to the next — shared only with the patient's permission.

This repository is a clickable **frontend prototype** for a university pitch. There is no backend: all data comes from a local mock layer and login is simulated.

> **All data is fictional.** Every patient, doctor, clinic, lab and result in this app is invented. No real patient data is used.

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Other scripts: `npm run build` (type-check + production build into `dist/`), `npm run preview`, `npm run lint`.

## Demo accounts

The login page lists one-click demo shortcuts. Any email and password also work — the selected tab (Patient / Doctor / Lab) and the matching demo email decide the account.

| Role | Name | Email |
| --- | --- | --- |
| Patient | Elshad Mammadov, 58 — type 2 diabetes, hypertension | `elshad@medilink.demo` |
| Patient | Aysel Karimova, 29 — pregnancy | `aysel@medilink.demo` |
| Doctor | Dr. Leyla Hasanova — cardiologist, Baku Cardio Clinic | `leyla.hasanova@medilink.demo` |
| Doctor | Dr. Rauf Aliyev — endocrinologist, Ailə Medical Center | `rauf.aliyev@medilink.demo` |
| Doctor | Dr. Nigar Huseynova — gynecologist, Sahil Women's Clinic | `nigar.huseynova@medilink.demo` |
| Lab | Nur Lab | `staff@nurlab.demo` |
| Lab | Caspian Diagnostics | `staff@caspian.demo` |
| Lab | Mərkəz Lab | `staff@merkezlab.demo` |

New patients can sign up with **Get started**; any 6 digits work as the SMS code.

Demo actions are saved in the browser (localStorage), so they survive a refresh. Use **Reset demo data** (login page, patient Profile, or the ↺ button in the doctor/lab sidebar) to start over.

## Demo flow

1. Landing → **Log in** → **Demo: Elshad**. Home shows his next appointment and verified results from three labs.
2. Home → **Timeline** → HbA1c: one chart across Mərkəz Lab, Caspian Diagnostics and Nur Lab.
3. **Book** → Dr. Leyla Hasanova → *Cardiology consultation* (instant booking) → pick a time → share records for the visit → **Confirm booking**.
4. Log in as **Dr. Hasanova** → the appointment is in **Schedule** → open Elshad: verified results, timeline and Dr. Aliyev's earlier summaries.
5. **Order lab tests** (HbA1c, Creatinine) → **Write summary** (ICD-10 search, e.g. `I10`). Saving the summary completes the visit.
6. Back as Elshad → **My lab orders** → **Book at a lab** → Nur Lab.
7. Log in as **Nur Lab** → **Orders** shows the order → **Publish result** → enter values → **Publish**.
8. Dr. Hasanova's **Results inbox** shows "Results ready for Elshad Mammadov — HbA1c, Creatinine"; Elshad sees the new verified result.
9. Elshad → Home → **Give feedback** → it appears on Dr. Hasanova's **Feedback** page (private, never published).
10. Elshad → **Records access** → access log → **Revoke** → Dr. Hasanova's patient page is locked again.

Smaller flows:

- **Request booking:** book Dr. Hasanova's *Extended consultation with echocardiography* → "Waiting for doctor's confirmation" → doctor approves, declines or proposes another time in **Requests**.
- **Follow-up request:** log in as Aysel → Home → "Dr. Nigar Huseynova asks you to book a follow-up…" → **Choose a time**. Doctors send these from a patient page.
- **Self-booked routine test:** Book → Labs → Nur Lab → *Complete blood count*. Tests such as HbA1c show "This test requires a doctor's order."
- **QR sharing:** Records access → **Share via QR** shows a code valid for 10 minutes. In the doctor's **Patients** page, type that code to open the record.
- **Access request:** a locked patient page has **Request access**; the patient approves it in Records access (Elshad already has one pending from Dr. Kamran Ismayilov).

## Structure

```
src/
  types.ts          FHIR-shaped types (Patient, Practitioner, Appointment, Observation, Consent, …)
  mock/             Seed data: directory, test catalog (LOINC), ICD-10 list, generated history
  store/            Zustand stores: in-memory "database", auth, toasts
  services/         Async functions the UI calls — the only code that touches the store
  i18n/strings.ts   All UI text (English), ready for an Azerbaijani translation
  components/       Shared UI, result cards, slot picker, Recharts timeline
  layouts/          Patient (mobile, bottom tabs), doctor/lab (desktop, sidebar), route guards
  pages/            public/, patient/, doctor/, lab/
```

The services return Promises with simulated latency, so a Spring Boot backend (JWT, PostgreSQL, FHIR) can replace `src/services/` without touching components.

## Tech

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Zustand, Recharts, qrcode.react, date-fns, lucide-react.

## Deploy

Deploys to Vercel as a static site with no environment variables. `vercel.json` rewrites every route to `index.html` so deep links work on refresh.

## Not in this prototype

Patient-uploaded results, AI features, payments, chat, telemedicine, medication reminders, real authentication and any real API calls.
