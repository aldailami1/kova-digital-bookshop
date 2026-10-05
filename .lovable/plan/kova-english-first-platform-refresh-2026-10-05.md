# Kova English-first platform refresh

## Scope
- Convert every customer-facing and administration page to English with a left-to-right document layout, English metadata, dates, labels, errors, and confirmations.
- Preserve the Arabic catalog content as the books’ original-language data while translating the surrounding storefront interface.
- Refresh the existing glass design for a cleaner, premium bookstore feel across desktop and mobile without changing catalog, cart, checkout, or admin business logic.

## Global experience
- Rework the shared header and footer for English navigation, responsive search, currency, theme, account state, and a prominent **Sign In / Sign Up** action.
- Add a floating language selector in the header with a practical set of global languages. English remains the default; supported interface copy changes immediately, and Arabic switches the document direction to RTL.
- Add a site-wide customer-support launcher and drawer with common help topics plus a functional message form and clear simulated-response state.

## Authentication
- Keep email/password and Google sign-in using the existing secure account system.
- Move sign-in and sign-up into a polished modal opened from the header, while retaining `/auth` as a compatible public page for direct links and redirect-back checkout flows.
- Use sign-in credentials only; remove customer profile editing and display-name storage from the account experience. Existing order history and secure admin roles remain unchanged.
- Ensure signed-in navigation shows Account, Admin when applicable, and safe sign-out behavior.

## Storefront pages
- Translate and polish the home page, catalog filters, product details and reviews, cart, checkout, customer account, administration, empty/error states, and accessibility labels.
- Keep advanced catalog filtering and all existing purchase/review/admin flows intact.
- Update every page’s unique title, description, Open Graph metadata, and social-card metadata.

## Safety boundary
- Do not implement invisible ads, hidden network requests, background clicks, or undisclosed monetization. No ad code or tracking will be added.
- If advertising is added later, it must be visible, disclosed, consent-aware where required, and connected to a legitimate provider account.

## Validation
- Check the generated build signal and resolve any errors.
- Exercise the main storefront on desktop and mobile: language switching, account modal, catalog filtering, cart, theme, and support drawer.
