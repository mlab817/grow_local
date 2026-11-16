# GrowLocal

GrowLocal helps local businesses in Marinduque attract customers through referrals and shop-created vouchers. A completed, non-voucher visit makes a customer eligible to share their referral code for that shop. When an eligible friend uses that code and completes a qualifying checkout, the friend receives the shop's referral offer, gets their own referral code for that shop, and the referrer earns a shop-issued voucher.

Vouchers are not money, cashbacks, or wallet credits. Each shop defines the offer in its own words—for example, “10% off rebond (up to ₱100).” GrowLocal records and presents the offer; the shop is responsible for interpreting and honoring its terms.

## Product Vision

1. **Discover local shops:** Customers can browse participating businesses around Marinduque and sign up from anywhere.
2. **Visit and unlock referrals:** A customer's completed in-person checkout without using a voucher records their visit and earns them a shop-specific referral code. Repeated ordinary visits can earn additional referral opportunities even if no friend has used an earlier one yet.
3. **Share a time-limited, shop-specific referral code:** Each earned referral code is valid for 30 days from the date it was earned. The customer can share it with a friend during that period. The code identifies the referrer and the shop's referral offer; it is not itself a voucher or money. Using a voucher does not consume or replace other active referral codes.
4. **Accept new or lapsed customers:** The friend must be new to the shop or eligible to return after the shop-configured inactivity period (for example, no visit within the last several months).
5. **Complete the referral checkout:** The cashier records the friend's visit and the referrer's code. The friend receives the benefit defined by the shop's referral offer, and after the qualifying checkout succeeds the referrer earns a shop-issued voucher for a future visit.
6. **Accumulate and redeem vouchers:** Earned vouchers can accumulate; a customer cannot redeem them all at once. They can use at most one voucher on a later visit that is not already using a referral voucher. Unused vouchers remain available for future eligible visits.
7. **Continue the cycle:** The referred friend gets their own referral code for that shop, valid for 30 days, and can invite eligible customers. Each earned code can be claimed by one eligible friend; a referrer can earn and share new codes through later ordinary visits, while the same friend cannot claim another referral from that referrer. Ordinary visits keep the referral cycle open even when no friend has yet claimed an earlier code.

Referral rules should protect shops from self-referrals, duplicate claims, and mutual referral loops. Each shop controls its eligibility window and voucher wording. Voucher terms remain open text and are not converted into a calculated discount by GrowLocal.

## Implementation Status

### Implemented

- Customer and owner registration/sign-in.
- Customer shop directory and visit history.
- Owner cashier checkout, transaction history, and customer list.
- Checkout records the full bill amount and visit.
- Owners can create a voucher for a customer by entering free-text offer terms. The owner portal lists issued vouchers.
- Voucher terms are stored as shop-authored text; no money or wallet credits are issued.

Accounts have an internal member code, but customers cannot see or share it as a shop-specific referral code. Checkout does not attribute referrals, and referral-based eligibility and voucher assignment are not implemented.

### Still to Build

- Let customers view and share their referral codes.
- Let cashiers record referral attribution during checkout.
- Issue a shop-specific referral code after a completed visit without a voucher; each code expires 30 days after it is earned, and separate active codes/opportunities must remain usable independently.
- Let each shop define referral voucher terms and the inactivity period that makes an existing customer eligible again.
- Allow referral claims from new customers and customers who meet the shop's lapsed-customer period; reject ineligible visits, self-referrals, duplicate referrer/referee claims, and mutual loops.
- On successful qualifying checkout, apply or record the friend's shop-defined referral offer, issue a shop-authored voucher to the referrer, and activate the friend's own shareable code for that shop.
- Let customers accumulate earned vouchers and redeem at most one on a later non-referral-voucher visit; preserve unused vouchers for subsequent visits.
- Keep each referral code reusable for future distinct eligible referrals while preventing the same friend from claiming repeatedly from the same referrer. Ordinary visits keep referral opportunities open, but do not themselves issue a reward.
- Show referral history and assigned vouchers to customers and shop owners; let cashiers record voucher redemption without calculating or paying out monetary value.
- Persist checkout, referral attribution, and both voucher assignments consistently, and add end-to-end tests including production database behavior.

Some referral-related columns and repository interfaces exist as scaffolding. They do not yet provide an end-to-end referral system.

## Run Locally

### Requirements

- Node.js 18 or newer
- PostgreSQL for the Drizzle-backed API

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy and configure the environment file:
   ```bash
   cp .env.example .env
   ```
3. Apply the database schema and seed demo data:
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. Start the API and frontend:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - API health: `http://localhost:4000/api/health`
5. Run the server tests:
   ```bash
   npm test
   ```

### Demo Accounts

All demo passwords are `password123`.

| Role | Email |
|---|---|
| Shop owner | `owner@growlocal.local` |
| Customer | `maria@growlocal.local` |
| Customer | `carlo@growlocal.local` |
