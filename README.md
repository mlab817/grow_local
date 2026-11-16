# GrowLocal

GrowLocal helps local businesses in Marinduque attract customers through referrals and shop-created vouchers. Customers earn shop-specific referral codes through visits and share them with eligible friends. When a friend uses a code and completes a qualifying checkout, the friend can use the shop's offer in that checkout, gets their own referral code, and the referrer earns a voucher for a later visit.

Vouchers are not money, cashbacks, or wallet credits. Each shop defines the offer in its own words—for example, “10% off rebond (up to ₱100).” GrowLocal records and presents the offer; the shop is responsible for interpreting and honoring its terms. Earned vouchers belong to the customer, cannot be transferred, and expire one year after issue.

## Product Vision

1. **Discover local shops:** Customers can browse participating businesses around Marinduque and sign up from anywhere.
2. **Visit and earn referral codes:** A completed in-person checkout without using a voucher earns the customer a new shop-specific referral code. Every later non-voucher visit can earn another code even if prior codes have not been claimed. A new customer who checks out using a referral offer is enrolled too and receives their first referral code after that checkout completes.
3. **Share single-use referral codes:** Each code is valid for 30 days from when it was earned and can be claimed by one eligible friend only. Claiming it makes that code invalid; other active codes the customer earned remain separate and usable.
4. **Accept new or lapsed customers:** The friend must be new to the shop or have not visited within the shop's configured inactivity window. The default window is six months.
5. **Complete the referral checkout:** The cashier records the friend's visit and the referrer's code. The friend uses the shop-defined referral offer in this checkout. Only after that transaction is completed does the referrer earn a shop-issued voucher for a later visit. The referrer cannot use that newly earned voucher for the same payment; a separate, subsequent checkout is required, even if it happens on the same day.
6. **Accumulate and redeem vouchers:** Earned vouchers can accumulate. A customer can redeem at most one on a visit that is not itself using a referral offer. Unused vouchers remain available until their one-year expiry, and cannot be transferred to another customer.
7. **Continue the cycle:** The referred friend gets their own referral code after their first completed visit, including when that visit used a referral offer. They can invite eligible friends; later ordinary visits can earn them additional codes. Each code can be claimed once, so a referrer can earn vouchers from multiple distinct eligible friends, but the same friend cannot claim another referral from that referrer.

Referral rules should protect shops from self-referrals, duplicate claims, and mutual referral loops. Each shop controls its eligibility window and voucher wording. The default lapsed-customer window is six months. Voucher terms remain open text and are not converted into a calculated discount by GrowLocal. Referral rewards are sequential: a referrer earns their voucher only after the referred customer's payment completes.

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
- Issue a new single-use shop-specific referral code after each completed non-voucher visit, and issue the new customer's first code after their first completed visit even if they used a referral offer. Codes expire after 30 days.
- Let each shop define referral voucher terms and the inactivity period that makes an existing customer eligible again; default that period to six months.
- Allow referral claims from new customers and customers who meet the shop's lapsed-customer period; reject ineligible visits, self-referrals, duplicate referrer/referee claims, and mutual loops.
- On successful qualifying checkout, apply or record the friend's shop-defined referral offer, then issue the referrer's voucher only after payment completion. The newly issued voucher must be usable only on a separate subsequent checkout.
- Let customers accumulate non-transferable vouchers that expire one year after issue, and redeem at most one per visit that is not using a referral offer.
- Make each referral code single-use and expire it 30 days after issue, while allowing customers to earn separate codes on later ordinary visits. Prevent the same friend from claiming repeatedly from the same referrer.
- Show referral history and assigned vouchers to customers and shop owners; let cashiers record voucher redemption without calculating or paying out monetary value.
- Persist checkout, referral attribution, and voucher assignment consistently, and add end-to-end tests for issuance timing, one-use codes, expiry, voucher accumulation/redemption, and production database behavior.

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
