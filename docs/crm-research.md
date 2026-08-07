# CRM Feature Research — What to Build for This App

Date: 2026-08-07
Scope: Survey of sales CRMs, personal CRMs, job-application trackers, relationship-intelligence
tools, and sales-engagement platforms, filtered against **this** use case.

## The filter

Every verdict below is judged against one specific situation, not against "a CRM":

- **One user.** No assignment, no permissions, no handoffs, no shared pipeline.
- **~40–60 relationships**, all high-intent, most of whom you have actually met.
- **Maybe 30–60 applications** over the life of a search, not 3,000 leads a quarter.
- **Personalization is the product.** Every message is hand-written. Nothing is sent in bulk.
- **The search ends.** This is a tool with a finish line, which caps how much infrastructure
  is ever worth building.

Most CRM features exist to solve problems that only appear at volume or with a team. At 50
relationships you can hold the whole dataset in your head — the app's job is to stop you from
*forgetting*, not to help you *scale*. That distinction decides almost every call in this doc.

**Verdicts:** `BUILD` = worth doing now · `LATER` = real value, blocked on data/effort/sequencing ·
`SKIP` = do not build, and here's why it looks tempting anyway.

---

## 1. Capture

The single most important category. The consistent finding across the research: **most people
abandon a personal CRM within two weeks, and manual data entry is why.** Sales reps spend ~4
hours/week on CRM entry. Miss two logging sessions and the record goes stale; a stale CRM stops
being worth opening, and the tool dies. Every capture decision should be read as a retention
decision.

| Feature | Who does it | Verdict |
|---|---|---|
| Freeform note → structured record via LLM | (yours) | **BUILD** — already the app's best idea; make it the only path that matters |
| Manual forms | everyone | **BUILD** (have it) — keep strictly as the correction path, never the primary one |
| Paste a job description → parsed opportunity | Teal, Huntr | **BUILD** — same parser you already have, new record type |
| Email sync / auto-logged interactions | Dex, Affinity, Nylas | **BUILD** — the largest remaining manual category |
| Quick-add from anywhere (keyboard) | Attio, Linear-likes | **BUILD** — cheap, and capture friction is the whole ballgame |
| Voice note → transcript → parse | Dex, Monica | **LATER** — high value right after a call, but needs mobile to matter |
| Calendar sync | Dex, Affinity | **LATER** — meetings are the interactions you're least likely to forget |
| CSV / LinkedIn connections import | most | **LATER** — one-time seeding; a script, not a feature |
| Browser extension | Huntr, Teal, Simplify | **SKIP** |
| ATS autofill (Workday/Greenhouse/Lever) | Simplify | **SKIP** |
| Business-card OCR | Covve | **SKIP** |

**On email sync — scope it hard.** The value is auto-creating interactions and bumping
`last_touch_at`. Do *not* try to parse arbitrary mail. Only touch threads with addresses already
in `contacts.email`, only extract date/direction/subject, and let the existing capture flow handle
anything richer. A broad inbox scraper is a different, much larger product.

**Why SKIP the browser extension and ATS autofill.** Both are the headline features of
Simplify and Huntr, and both are priced by the volume they serve. Autofill scrapes the DOM of a
dozen ATS vendors that redesign without warning — permanent maintenance for a fixed
seconds-per-application saving. At 500 applications that trade is obvious. At 40 it is weeks of
work to save perhaps two hours, and the failure mode is silently submitting a form with stale
data. **A paste box that accepts a JD and a URL captures ~80% of the value at ~2% of the cost.**

---

## 2. Reminders, cadence, and follow-up

This is where a job-search CRM earns its keep. The failure this tool prevents is *the
relationship you let go cold*, and that failure is invisible until it's expensive.

| Feature | Who does it | Verdict |
|---|---|---|
| Per-contact keep-in-touch cadence | Dex, Clay, Monica | **BUILD** (have it — [`lib/cadence.ts`](../lib/cadence.ts)) |
| Snooze / defer | Huntr, Todoist-likes | **BUILD** (have it) |
| Stage-based stall alerts | Affinity, Pipedrive | **BUILD** — needs the opportunity object first |
| Follow-up sequence templates | Outreach, Salesloft, Apollo | **BUILD** — scaled way down; see below |
| Daily/weekly digest email | Dex, Monica | **BUILD** — the cheapest defense against abandonment |
| Interview-prep reminders / pre-meeting brief | Dex, Huntr | **LATER** — genuinely useful, but a feature of the interview flow you haven't built |
| Birthdays and important dates | Monica, Covve | **SKIP** for now |
| Automated email *sending* | Outreach, Apollo, Salesloft | **SKIP** |
| A/B testing subject lines, send-time optimization | Outreach, Apollo | **SKIP** |

**Sequences, correctly scaled.** Outreach's mechanic is a named multi-step touch plan that
materializes tasks on a schedule: email day 1, LinkedIn day 3, call day 7, close-out day 14. The
*automation* is what needs volume; the *template* does not. A "post-application" template that
creates three dated tasks — follow up day 5, ping the referrer day 10, mark dormant day 21 —
converts your task table from reactive to proactive and costs one table plus a materializer. That
is the whole idea worth taking.

**Why SKIP automated sending.** Auto-sent outreach is a volume play that trades reply rate for
throughput. You have 50 relationships where the personalization *is* the value, and a detectably
templated note to someone who might refer you is worse than no note. The economics that justify
sequences for an SDR invert completely at your scale.

**Why the digest matters more than it looks.** The documented failure mode is not "the user
disliked the app," it's "the user stopped opening it." Your [Today page](<../app/(app)/today/page.tsx>)
is excellent but it's *pull* — it only works if you remember to visit. A scheduled email
containing the same three counts converts it to *push*. Affinity's version of this is alerting
when a relationship score crosses a threshold, and the reason it works is the same: maintenance
work never generates its own reminder, so the system has to.

---

## 3. Enrichment

The category that most looks like magic and is most consistently wasted at small scale.

| Feature | Who does it | Verdict |
|---|---|---|
| Duplicate detection / merge | everyone | **BUILD** — trivial version; you have `findContactByName` already |
| Company facts pulled from a pasted about-page | Clay, Apollo | **LATER** — your existing parser can already do most of this |
| Job-change alerts on contacts | Dex, Clay | **LATER** — real job-search value, bad mechanics (see below) |
| Third-party contact enrichment (email/phone/firmographics) | Clay, Apollo, ZoomInfo | **SKIP** |
| News alerts about contacts and companies | Clay | **SKIP** |
| Auto-generated relationship summaries | Dex, folk | **SKIP** |

**Why SKIP paid enrichment.** Enrichment exists to make strangers addressable — it turns a name
on a list into a working email so you can contact 10,000 people you've never met. You have ~50
people you have *personally met*. You already know their email, or you can ask. You would be
paying a per-record fee to be told things you know, about a list short enough to fill by hand in
an afternoon. This is the single clearest example of a feature whose entire premise is volume.

**Job-change alerts are the exception that's still not worth it yet.** A contact moving to a
target company is a genuine lead, and this is one of Dex's strongest features. But there is no
sanctioned LinkedIn API for it; every implementation scrapes, which is fragile and against
LinkedIn's terms. Park it — and note that a monthly "have any of these 50 people changed jobs?"
manual pass gets you most of the value with none of the risk.

---

## 4. Pipeline and views

**The one structural gap in your schema.** Every CRM separates the *organization* from the *thing
you are pursuing at that organization*. You've merged them: `companies` currently carries
`status`, `conviction`, `founder_delegation_style`, `autonomy_scope`, and `social_pct` — all of
which describe a **role**, not a company.

That breaks in ordinary cases: two roles at one company, a company that is both a target and a
networking source, a re-application six months after a rejection (no history, just an overwritten
field). Fix this before building anything else in this section.

| Feature | Who does it | Verdict |
|---|---|---|
| Opportunity/application object with stages | all sales CRMs, Huntr, Teal | **BUILD** — the highest-priority change in this doc |
| `stage_entered_at` timestamps | Pipedrive, Salesforce | **BUILD** — one column; unlocks stall detection *and* all of §5 |
| Kanban board over applications | Huntr | **BUILD** — the right view for this object specifically |
| Contact↔contact relationship edges | Monica, Affinity | **BUILD** — closes the networking→application loop |
| Referral attribution on an application | Huntr, Affinity | **BUILD** — one FK; the most decision-relevant field you can add |
| Filterable list views | everyone | **BUILD** basic |
| Documents / which resume went where | Huntr, Teal | **LATER** — low effort, real annoyance, not urgent |
| Saved-view infrastructure | Attio, Twenty | **SKIP** — you'll have four views total; hardcode them |
| Custom objects / custom fields builder | Attio, Twenty | **SKIP** |
| Multiple pipelines | HubSpot, Pipedrive | **SKIP** — one search, one pipeline |
| Lead vs. Contact as separate objects | Salesforce | **SKIP** |
| Ownership / assignment / territories | all sales CRMs | **SKIP** — single user |
| Map view of opportunities | Huntr | **SKIP** — decorative |

**Why SKIP the custom-object builder**, even though Attio and Twenty are the most impressive
architecture in the survey. A metadata-driven engine — user-defined objects and attributes, API
regenerated at runtime, no migrations — is months of work whose entire payoff is letting *other
people* model *their* domain. You are one user with a known domain and a text editor. When you
need a field, write the migration. This is the most seductive SKIP on the list.

**Why SKIP Lead-vs-Contact.** Salesforce splits them because a lead is unqualified, owned by
marketing, and gets *converted* into Contact + Account + Opportunity at a handoff boundary
between two teams. You have no handoff and no second team. The split would buy you a conversion
workflow and a second set of duplicate rules in exchange for nothing. One `contacts` table with a
status field, if you ever need it.

---

## 5. Analytics

Cut hard here. Most CRM analytics answer management questions, and you are not managing anyone.
The useful subset answers exactly one question: **is my strategy working, or am I busy?**

| Feature | Who does it | Verdict |
|---|---|---|
| Computed relationship strength (recency × frequency) | Affinity | **BUILD** — one SQL view over `interactions` |
| Outcome by source (referral vs. cold apply vs. recruiter) | Huntr, Teal | **BUILD** — the one number that should change your behavior |
| Funnel counts (applied → interviewing → offer) | Huntr, Teal | **LATER** — needs `stage_entered_at` and a few months of data |
| Time-in-stage averages | Pipedrive | **LATER** — same |
| Response rate by channel | Outreach, Apollo | **LATER** — thin at your N, but directionally readable |
| Network graph *visualization* | Affinity | **SKIP** the picture, **BUILD** the edges |
| Weighted pipeline / revenue forecasting | Salesforce, HubSpot | **SKIP** |
| Activity leaderboards, rep scorecards, quota tracking | all sales CRMs | **SKIP** |
| Cohort and attribution dashboards | Outreach, HubSpot | **SKIP** |

**Relationship strength is worth the effort, and here's the design.** Your `warmth` is
self-reported, which means it is accurate exactly once — the day you set it — and decays silently
after. Affinity's insight is that recency and frequency of *actual logged interactions* predict
relationship strength better than anyone's self-assessment. You already have the interaction data.
The right shape is a **hybrid**: keep manual `warmth` as an explicit override, compute the signal
alongside it, and surface it when the two disagree — "you rated Alice a 5, you haven't spoken in
four months." The disagreement is the useful output. Your existing overdue-*ratio* ranking in
[`listColdContacts`](../lib/db/contacts.ts) is already this instinct in miniature.

**Why SKIP the network graph visualization** while building the edges underneath it. Force-directed
graphs are the most screenshotted and least used feature in relationship intelligence. They look
like insight and deliver a hairball; at 50 nodes you learn nothing you didn't know. The *query* —
"who do I know who can introduce me to this person" — is the entire value, and it's a two-hop
lookup rendered as a sentence, not a canvas.

**Why SKIP forecasting.** Weighted pipeline multiplies deal value by stage probability to predict
revenue. You have no deal values, your N is far too small for stage probabilities to mean
anything, and the output — "you will get 0.7 jobs this quarter" — is not actionable. You need one
offer, not a distribution.

---

## 6. Integrations

| Feature | Verdict |
|---|---|
| Gmail (read: auto-log interactions from known contacts) | **BUILD** |
| CSV export of everything | **BUILD** — cheap insurance; it's your data and this app is disposable |
| Mobile-usable capture page | **BUILD** — capture happens 90 seconds after a call ends, on a phone |
| Google Calendar | **LATER** |
| LinkedIn | **SKIP** — no sanctioned API; every option is scraping |
| Slack / Teams | **SKIP** — single user |
| Zapier / webhooks / public API | **SKIP** — you have direct DB access and no integrators |

---

## 7. UX patterns worth stealing

Not "this exists," but *why the mechanism works* — which is what determines whether it survives
being copied into a different context.

**1. Kanban drag-to-stage** (Huntr). Works because **the gesture is the state change** — no form,
no save, no modal. It also encodes ordering spatially, so "what's furthest along" is answered by
looking rather than sorting. Precondition: few stages, mutually exclusive, and a natural
left-to-right progression. Applications qualify. **Contacts do not** — don't put your contact list
on a board, warmth isn't a pipeline.

**2. The single-decision surface** (your Today page; Superhuman, Linear). Works because it removes
the "where do I start" cost, which is the real reason people stop opening tools like this. The
discipline that makes it work is *ruthless exclusion*: the moment Today shows everything, it shows
nothing. Every future feature will want a slot on that page. Most should be denied one.

**3. Confidence + flagged ambiguities on AI output** (yours, [`schema.ts`](../lib/capture/schema.ts)).
Works because it makes the model's uncertainty **legible and located** — you're told *which field*
is shaky, so you can trust the rest without re-verifying everything. This is the pattern that
makes AI capture usable at all; without it every parse needs a full audit and you've saved nothing.
Keep it as you add record types.

**4. Snooze as a first-class action** (Huntr, task managers). Works because the alternative is
lying — without a defer, users mark things "done" to clear the list, and the list stops describing
reality. Snooze keeps the item honest and the backlog trustworthy. You have this; resist ever
removing it for simplicity.

**5. Inline edit over modal** (Attio, Linear). Works because editing in place **preserves your
position in the list** — you keep the comparison context that made you want to edit. A modal
destroys that context and adds an open/save/close round trip to a one-character change.

**6. Quick-add from any screen** (Attio, Superhuman, Linear). Works because capture competes with
*not bothering*, and any navigation step loses that competition. If logging a call requires going
to a page and picking a person, it won't happen in the 90 seconds after the call when you still
remember the details.

**7. Timeline as the spine of a detail page** (Huntr, Affinity, Monica). Works because a
relationship is a **narrative**, and a field list can't hold one. "What is going on with this
person" is answered by the last four events in order, not by nine labeled attributes. You have a
[`timeline` component](../components/timeline.tsx) — it should be the primary content of the
contact page, with the fields secondary.

**8. Threshold alerts instead of dashboard numbers** (Affinity). Works because maintenance work
generates no signal of its own — nothing happens when a relationship goes cold, which is precisely
the problem. A number on a dashboard requires you to already be worried. A push notification
manufactures the worry at the right moment. This is the same argument as the digest in §2.

**9. Per-application checklists** (Huntr). Works because applications have a **repeatable shape** —
same five steps every time — so a template beats improvisation and removes the decision of "what
now." Directly implementable as your sequence templates.

**10. Honest empty states** (yours: "You're all caught up"). Works because an empty list is
ambiguous — broken, or genuinely clear? — and resolving that ambiguity is what makes a dashboard
trustworthy enough to rely on. You already do this well.

---

## 8. The volume test

A heuristic for features this doc doesn't cover. Ask: **does this feature's value scale with the
number of records, or with the importance of each one?**

- **Scales with count** — enrichment, autofill, sequences-as-automation, dedup at scale,
  forecasting, saved views, custom object builders, bulk anything. These are how you cope with
  data you can't hold in your head. You can hold yours in your head. **Skip.**
- **Scales with stakes** — reminders, timelines, referral paths, follow-up templates, stall
  alerts, capture speed. These stop you from dropping something that mattered. One dropped warm
  intro can cost you the search. **Build.**

Nearly every SKIP above is a count feature wearing a stakes feature's clothing.

---

## 9. Recommended order

1. **`opportunities` table** — move `status`, `conviction`, `autonomy_scope`, `social_pct`,
   `founder_delegation_style` off `companies`; add `stage`, `stage_entered_at`, `source`,
   `referrer_contact_id`. Add `opportunity_id` to `interactions` and `tasks`. *Closes the "job
   applications" half of the use case, which currently does not exist.*
2. **Kanban view + stage-stall watchlist** on Today.
3. **`contact_relationships` edges** + the two-hop "warmest path to X" query.
4. **Computed relationship strength** alongside manual warmth, surfacing disagreements.
5. **Gmail interaction ingestion**, scoped to known contacts.
6. **Sequence templates** that materialize dated tasks.
7. **Digest email** + outcome-by-source.

Items 1–3 are structural and get harder the longer you wait. 4–7 are additive and can land in any
order.

---

## Sources

Data models and architecture: [Twenty](https://docs.twenty.com/user-guide/data-model/overview) ·
[Attio](https://attio.com/help/reference/attio-101/attios-data-model/understanding-attio-data-model) ·
[HubSpot CRM data model](https://blog.hubspot.com/marketing/crm-data-model) ·
[Monica (GitHub)](https://github.com/monicahq/monica)

Personal CRM and relationship intelligence:
[Dex roundup](https://getdex.com/blog/personal-crm-for-networking/) ·
[Affinity relationship intelligence](https://www.affinity.co/product/relationship-intelligence) ·
[Affinity on warm intros](https://www.affinity.co/blog/expand-your-network)

Job trackers: [Huntr](https://huntr.co/product/job-tracker) ·
[Teal](https://www.tealhq.com/tool/job-search-crm) ·
[2026 tracker comparison](https://offboard.co/resources/best-job-application-trackers-2026)

Sequences and adoption:
[Apollo vs. Salesloft vs. Outreach](https://www.apollo.io/magazine/apollo-vs-salesloft-vs-outreach-platform-alternatives) ·
[Why CRM adoption fails](https://www.backstory.ai/sales-activity-capture-cluster-pages/crm-adoption-why-it-fails-and-what-actually-fixes-it) ·
[The cost of CRM data entry](https://www.introhive.com/blog-posts/crm-data-entry-automation/) ·
[Building a CRM with Nylas](https://www.nylas.com/blog/how-to-build-crm-dev/)
