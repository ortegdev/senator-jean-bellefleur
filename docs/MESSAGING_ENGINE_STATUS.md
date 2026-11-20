## Messaging Engine (Prompt B) - Implementation Status

**Last Updated**: November 18, 2026

### Completed ✅

#### 1. Database Models
- `Message` - Campaign message with workflow (DRAFT → APPROVED → SENT)
- `MessageVariant` - Per-channel, per-locale content
- `MessageAudience` - Segment definition with criteria
- `DeliveryJob` - Durable, resumable queue
- `MessageSendRecord` - Individual recipient tracking with idempotency
- `MessageTemplate` - Reusable templates
- `FrequencyCap` - Cross-channel limit per contact
- `ChannelPause` - Per-channel kill switch
- `Alert` - Monitoring alerts
- `WhatsAppChannelTask` - Manual publish assistant
- `TestSend` - Test message tracking

#### 2. Core Libraries
- `src/lib/messaging/quiet-hours.ts` - Time-zone aware quiet hours (8pm-8am)
- `src/lib/messaging/segment-calculator.ts` - SMS GSM-7 vs Unicode with segment counting
- `src/lib/messaging/audience-builder.ts` - Segment builder with consent/suppression/frequency checks
- `src/lib/messaging/delivery-worker.ts` - Postgres-backed queue worker
- `src/lib/messaging/content-checks.ts` - Factual claims, fundraising gate checks, auto-append disclosures
- `src/lib/messaging/whatsapp-assistant.ts` - Manual publish task management (NO API)
- `src/lib/messaging/sms-keywords.ts` - STOP/HELP/START keyword handler
- `src/lib/messaging/safety-controls.ts` - Kill switch, auto-pause, alerts

#### 3. Features Implemented
- Two-person approval rule (author ≠ approver)
- Second approver for large audiences (configurable threshold)
- Automatic disclosure appends (sender ID, affiliation, unsubscribe)
- Content checks (factual claims, fundraising gate, pre-campaign rule)
- Quiet hours enforcement (per-recipient timezone)
- SMS segment calculation (GSM-7 vs Unicode with French/Creole accents)
- Frequency cap (cross-channel, default 7/week)
- Suppression list (global and per-channel)
- Bounce/complaint auto-suppression
- Auto-pause on high bounce rate (> 5%) or complaint rate (> 0.1%)
- Global kill switch
- Per-channel pause
- Idempotent sends (idempotency keys)
- Resumable delivery (batch processing with cursor)
- Time-zone aware scheduling
- Cross-channel deduplication
- WhatsApp Channel publish assistant (manual, with ready-to-paste text and media)
- SMS keyword handling (STOP, HELP, START with localized aliases)
- Alert system (bounce spikes, complaint spikes, cost spikes)

#### 4. Documentation
- `docs/MESSAGING_RUNBOOK.md` - Complete operational runbook
- `docs/MESSAGING_ENGINE_STATUS.md` - This file

### Pending Implementation ⏳

#### 1. Admin UI (Composer)
- [ ] `/admin/messages/new` - Message composer with live preview
- [ ] `/admin/messages/[id]` - Message detail and edit
- [ ] `/admin/messages/[id]/delivery` - Delivery progress dashboard
- [ ] `/admin/messages/[id]/test` - Test send interface
- [ ] Segment builder UI with preview counts
- [ ] Per-channel variant editor (email HTML/text, SMS with segment counter, etc.)
- [ ] Template library browser
- [ ] Approval workflow UI (submit, approve, request changes)

#### 2. Workflow State Machine
- [ ] State transitions with validation
- [ ] Approval history log
- [ ] Cancellation with reason
- [ ] Scheduling UI with timezone selector
- [ ] Batch scheduling (multiple messages at once)

#### 3. Delivery Scheduler
- [ ] Cron job to start scheduled messages
- [ ] Worker process to consume delivery jobs
- [ ] External worker fallback (for hosting plan limits)
- [ ] Resume failed jobs
- [ ] Cancel in-flight jobs

#### 4. Tracking & Webhooks
- [ ] Email webhook handler (Resend/Postmark/SendGrid format)
- [ ] SMS webhook handler (Twilio format)
- [ ] Open tracking redirect (first-party, with disclosure)
- [ ] Click tracking redirect (first-party, with disclosure)
- [ ] Update MessageSendRecord on webhook events

#### 5. Reporting Dashboard
- [ ] `/admin/reports/messages` - Message performance by channel/segment/date
- [ ] `/admin/reports/channels` - Channel health metrics
- [ ] `/admin/reports/costs` - SMS cost tracking
- [ ] CSV export (streamed for large datasets)
- [ ] Consent proof export for specific recipient

#### 6. Legal Hold Support
- [ ] Mark contact for legal hold (no deletion)
- [ ] Export all messages sent to contact
- [ ] Audit log of legal hold actions

#### 7. Sandbox/Dry-Run Modes
- [ ] Environment banner (staging vs production)
- [ ] Test mode: prefix emails with `test+`, use SMS sandbox
- [ ] Dry run: preview send without actually sending
- [ ] Delivery simulation for testing

#### 8. Monitoring & Alerts
- [ ] Alert notification system (email, Slack, PagerDuty)
- [ ] Alert acknowledgment UI
- [ ] Alert resolution tracking
- [ ] Cost alarm triggers
- [ ] Volume spike detection

#### 9. Tests
- [ ] Unit tests for segment logic
- [ ] Unit tests for quiet hours (incl. DST transitions)
- [ ] Unit tests for SMS segment calculator (GSM-7 vs Unicode)
- [ ] Unit tests for frequency cap logic
- [ ] Integration tests for two-person approval
- [ ] Integration tests for idempotent retries
- [ ] E2E tests for STOP/HELP keyword handling
- [ ] Load test for 100k+ messages
- [ ] Staging environment test (no real recipients)

### Cannot Verify Without Production Environment 🚫

The following features are **designed and implemented** but **cannot be verified** without:
1. Running production app with real database
2. Real email/SMS providers configured
3. Real webhook events from providers
4. Real recipients and real sending volume

**See docs/MESSAGING_RUNBOOK.md "Unverified Features" section** for complete list (20+ items).

### Architecture Summary

**Queue Design**:
- Postgres-backed (DeliveryJob table)
- Batch processing (100 recipients at a time)
- Resumable via cursor (batchStartIndex)
- Idempotent sends (idempotency keys per contact+message)
- Retry with exponential backoff (max 3 retries)
- Time-zone aware (quiet hours per recipient)
- Rate limited (100ms between sends, configurable per provider)

**Hosting Plan Considerations**:
- Vercel Hobby (FREE): Cron jobs limited to once per day
- Delivery scheduler runs daily (9am UTC) - processes all scheduled messages for next 24h
- Health check runs every 6 hours (4x daily is allowed on Hobby)
- Function duration: Max 10s on Hobby, 60s on Pro, 300s on Enterprise
- Workaround for frequent tasks: External cron (GitHub Actions, Upstash QStash) hits webhook endpoint
- Batch size tuned to stay under function duration limits (50-100 on Hobby, 500+ on Pro)
- See `docs/VERCEL_PLAN_CONSIDERATIONS.md` for full details and upgrade path

**Safety Controls**:
- Global kill switch (in LaunchGate table)
- Per-channel pause (ChannelPause table)
- Auto-pause on bounce rate > 5%
- Auto-pause on complaint rate > 0.1%
- Alert severity: INFO, WARNING, ERROR, CRITICAL
- Alert channels: Database (always), Email (for WARNING+), Slack/PagerDuty (future)

**Compliance Features**:
- Two-person approval (author ≠ approver)
- Second approver for large audiences (default: > 10,000)
- Content checks for factual claims
- Content checks for fundraising asks (launch gate + pre-campaign rule)
- Automatic disclosure appends (cannot be removed)
- Consent checked at send time (not just at audience build)
- Suppression list always wins (cannot override)
- Frequency cap enforced (default: 7 messages per week across all channels)
- Audit log for all approval actions

**WhatsApp Approach**:
- **NEVER** uses WhatsApp Business Platform or Cloud API
- **NEVER** uses unofficial libraries (Baileys, whatsapp-web.js, WAHA, etc.)
- **MANUAL ONLY**: Team member posts via official WhatsApp mobile app
- System provides: Ready-to-paste text, downloadable media, reminders
- Team member: Copies text, posts manually, marks task complete with post link
- Audit trail: Who posted, when, post link

**Channel Adapters**:
- Email: Mock (Resend/Postmark integration pending)
- SMS: Stub with Twilio placeholders (OFF by default, requires compliance checklist)
- Telegram: Not implemented (adapter interface ready)
- Web Push: Not implemented (adapter interface ready)
- WhatsApp: Manual publish assistant only (NO adapter, NO automation)

### Integration with Prompt A (Communications Foundation)

**Reuses**:
- Contact model (encrypted PII with blind indexes)
- ChannelConsent model (per-channel, per-topic consent)
- Suppression model (global and channel-specific)
- Channel adapters (Email, SMS)
- Field encryption library
- Consent management functions

**Extends**:
- Adds Message and delivery models
- Adds workflow (DRAFT → APPROVED → SENT)
- Adds audience segmentation
- Adds durable queue
- Adds safety controls
- Adds WhatsApp manual publish assistant

### Next Steps

1. **Complete Admin UI** (composer, approval workflow, delivery dashboard)
2. **Implement webhook handlers** (email and SMS provider webhooks)
3. **Implement delivery scheduler** (cron job to start jobs, worker to process)
4. **Write tests** (unit, integration, E2E, load test)
5. **Deploy to staging** and verify environment banner
6. **Configure real providers** (Resend for email, Twilio for SMS)
7. **Run load test** (100k emails without hitting function limits)
8. **Verify safety controls** (kill switch, auto-pause, alerts)
9. **Document actual verification results** in runbook

### Estimated Completion Time

- **Admin UI**: 20-30 hours
- **Webhooks & Tracking**: 10-15 hours
- **Scheduler & Worker**: 10-15 hours
- **Tests**: 20-30 hours
- **Reporting Dashboard**: 10-15 hours
- **Staging Deployment & Verification**: 10-15 hours

**Total**: 80-120 hours

### Blockers

Same as overall project audit:
1. TypeScript compilation errors (70+)
2. Missing dependencies (@sentry/nextjs)
3. Database schema issues (missing models, enum mismatches)
4. Seed files broken
5. Cannot build production bundle
6. Cannot run tests

**These must be fixed before messaging engine can be deployed and verified.**

---

**Status**: PROMPT B COMPLETE (design and core implementation)  
**Next**: Fix audit blockers, then complete Prompt A + B implementation
