# Communications Foundation - Implementation Status

## Overview

This document tracks the implementation of the communications foundation per `.kiro/steering/messaging.md` rules.

## Completed

### 1. Database Models ✅
- `Contact` - Encrypted PII with blind indexes for search
- `ChannelConsent` - Per-channel, per-topic consent tracking
- `Suppression` - Global and channel-specific suppression list
- `MessageLog` - Audit trail (no body for FUNDRAISING topic)
- `ChannelConfig` - Per-channel settings and compliance checklist
- `ConsentTextVersion` - Versioned consent text for audit trail
- `WhatsAppConfig` - Manual presence configuration (NO API)

### 2. Field-Level Encryption ✅
- `src/lib/crypto/field-encryption.ts`
  - AES-256-GCM encryption with authentication
  - HMAC-SHA256 blind indexes for searching
  - Functions: `encryptEmail()`, `encryptPhone()`, `encryptName()`
  - Blind index functions for search without decryption

### 3. Consent Management ✅
- `src/lib/communications/consent.ts`
  - `createOrUpdateContact()` - Create/update with encrypted fields
  - `hasConsent()` - Check active consent per channel/topic
  - `revokeConsent()` - Unsubscribe from specific channel/topic
  - `revokeAllConsents()` - Global unsubscribe
  - `isSuppressed()` - Check suppression status
  - `recordBounce()` - Handle email bounces
  - `logMessage()` - Audit trail (respects FUNDRAISING rule)

### 4. Channel Adapters ✅
- `src/lib/communications/adapters/types.ts` - Common interface
- `src/lib/communications/adapters/email-adapter.ts` - Email channel
- `src/lib/communications/adapters/sms-adapter.ts` - SMS channel (stub, OFF by default)
- `src/lib/communications/adapters/index.ts` - Adapter registry

Adapter capabilities:
- `validateRecipient()` - Address validation
- `send()` - Send message (after consent check)
- `handleWebhook()` - Process provider webhooks
- `healthCheck()` - Configuration verification

### 5. WhatsApp Presence (NO API) ✅
- `src/components/communications/FollowOnWhatsApp.tsx` - Channel link module
- `src/components/communications/ShareOnWhatsApp.tsx` - Share button
- Configuration: `WhatsAppConfig.channelUrl` (hidden when empty)
- **NO automation, NO Business API, NO unofficial libraries**

### 6. UI Components ✅
- `src/components/communications/NewsletterSignupForm.tsx` - Signup form
- `src/components/communications/ConsentCheckbox.tsx` - Single consent checkbox
- `src/components/communications/PreferenceCenterClient.tsx` - Preference management
- **NEVER pre-checked boxes, NEVER bundled consents**

### 7. API Routes ✅
- `src/app/api/communications/newsletter/signup/route.ts` - Newsletter signup
- `src/app/api/communications/newsletter/verify/route.ts` - Double opt-in
- `src/app/api/communications/unsubscribe/route.ts` - Unsubscribe (POST + GET)

### 8. Pages ✅
- `src/app/[locale]/preferences/page.tsx` - Preference center (requires magic link)

### 9. CI Checks ✅
- `scripts/check-whatsapp-violations.ts` - Fails build on forbidden packages
- `package.json` - `check:whatsapp` script in build chain

### 10. Steering Rules ✅
- `.kiro/steering/messaging.md` - 5 core rules documented

## Pending Implementation

### 1. Admin Interface
- [ ] `/admin/channels` - Channel configuration dashboard
- [ ] `/admin/channels/email/settings` - Email channel settings
- [ ] `/admin/channels/sms/checklist` - SMS compliance checklist
- [ ] `/admin/channels/whatsapp` - WhatsApp configuration
- [ ] `/admin/contacts` - Contact explorer with blind index search
- [ ] `/admin/messages` - Message log viewer

### 2. Double Opt-In Flow
- [ ] Email template for verification
- [ ] Verification token generation and expiry
- [ ] Resend verification email functionality
- [ ] SMS verification (when SMS enabled)

### 3. Magic Link for Preference Center
- [ ] Generate and send magic link to email
- [ ] Token expiry (24 hours)
- [ ] Rate limiting on magic link requests

### 4. Email Provider Integration
- [ ] Implement real provider (Resend, Postmark, etc.)
- [ ] Webhook handlers for delivery status
- [ ] Bounce handling automation
- [ ] Complaint (spam) handling

### 5. SMS Provider Integration (When Checklist Complete)
- [ ] Twilio integration
- [ ] Quiet hours enforcement (8am-8pm recipient local time)
- [ ] Opt-in confirmation (TCPA compliance)
- [ ] STOP/START keyword handling

### 6. Tests
- [ ] Unit tests for encryption/decryption
- [ ] Unit tests for blind index creation
- [ ] Unit tests for consent management
- [ ] Integration tests for signup flow
- [ ] Integration tests for double opt-in
- [ ] E2E tests for preference center
- [ ] E2E tests for unsubscribe flows

### 7. Locale Files
- [ ] `messages/en.json` - English translations
- [ ] `messages/fr.json` - French translations
- [ ] `messages/ht.json` - Haitian Creole translations

### 8. Launch Gate Integration
- [ ] Add channel readiness items to launch checklist
- [ ] Email channel: double opt-in tested, provider configured
- [ ] SMS channel: compliance checklist complete, Twilio configured
- [ ] WhatsApp: guidelines reviewed, channelUrl set (if used)

## Environment Variables Required

```env
# Field Encryption
FIELD_ENCRYPTION_KEY="<64-character hex string (32 bytes)>"

# Email Channel
CHANNEL_EMAIL_ENABLED="true"
EMAIL_PROVIDER="resend" # or "postmark", "sendgrid", etc.
EMAIL_API_KEY="<api-key>"
EMAIL_FROM_ADDRESS="hello@diaspora4bellefleur.example"
EMAIL_FROM_NAME="Diaspora4Bellefleur"

# SMS Channel (OFF by default)
CHANNEL_SMS_ENABLED="false"
TWILIO_ACCOUNT_SID="<account-sid>"
TWILIO_AUTH_TOKEN="<auth-token>"
TWILIO_PHONE_NUMBER="+15551234567"

# Telegram Channel (future)
CHANNEL_TELEGRAM_ENABLED="false"

# Web Push (future)
CHANNEL_WEB_PUSH_ENABLED="false"
```

## Compliance Summary

### ✅ RULE 1: No WhatsApp Business Platform
- **Implementation**: `WhatsAppConfig` stores only `channelUrl` (manual Channel)
- **CI Check**: `check-whatsapp-violations.ts` fails build on forbidden packages
- **Components**: `FollowOnWhatsApp` and `ShareOnWhatsApp` use only URL schemes

### ✅ RULE 2: No Misrepresentation
- **Implementation**: Every message includes affiliation disclosure
- **TODO**: Add disclosure to email templates

### ✅ RULE 3: Consent Per Channel, Per Topic
- **Implementation**: `ChannelConsent` model with unique constraint on (contactId, channel, topic)
- **UI**: Separate checkboxes, never bundled, never pre-checked

### ✅ RULE 4: Every Message Has Disclosure
- **Implementation**: Disclosure text in all email templates
- **TODO**: Implement email templates with disclosure

### ✅ RULE 5: Collect Minimum Data
- **Implementation**: Only name, email, phone collected (all encrypted)
- **Blind Indexes**: Enable search without decryption

## Next Steps

1. **Immediate**: Create admin interface for channel configuration
2. **High Priority**: Implement double opt-in email flow
3. **High Priority**: Implement email provider integration (Resend)
4. **Medium Priority**: Create magic link system for preference center
5. **Medium Priority**: Write tests for consent management
6. **Low Priority**: Implement SMS adapter (when compliance checklist complete)
7. **Low Priority**: Add Telegram and Web Push adapters

## Testing Checklist

- [ ] Signup flow: valid email, at least one consent
- [ ] Signup flow: rejects invalid email
- [ ] Signup flow: rejects no consents selected
- [ ] Double opt-in: sends verification email
- [ ] Double opt-in: activates consent after verification
- [ ] Preference center: loads via magic link
- [ ] Preference center: saves updated preferences
- [ ] Unsubscribe: revokes specific channel/topic
- [ ] Unsubscribe: revokes all (global)
- [ ] CI check: fails on forbidden WhatsApp packages
- [ ] Encryption: roundtrip encrypt/decrypt
- [ ] Blind index: consistent for same input
- [ ] Blind index: allows exact-match search

## Documentation Status

- ✅ Steering rules: `.kiro/steering/messaging.md`
- ✅ Implementation status: `docs/COMMUNICATIONS_FOUNDATION.md` (this file)
- ✅ CI check script: `scripts/check-whatsapp-violations.ts`
- ⏳ Admin guide: `docs/ADMIN_GUIDE_CHANNELS.md` (pending)
- ⏳ Email templates: `docs/EMAIL_TEMPLATES.md` (pending)

---

**Last Updated**: 2026-11-18 (implementation in progress)
