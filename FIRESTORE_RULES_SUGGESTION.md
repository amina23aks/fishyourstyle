# Firestore security rules (proposed)

These rules are **not applied automatically**. Apply them to Firestore once data has been seeded and verified.

- Public read access for `products` and `categories` collections (allows storefront browsing and filters).
- Public write access only for `orders` collection (allows checkout without authentication).
- Writes to `products` and `categories` limited to admins (via server routes or authenticated admin users).

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public catalog reads
    match /products/{id} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Categories & designs stored together
    match /categories/{id} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Checkout submissions
    match /orders/{id} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if true; // anyone can place an order
    }
  }
}
```
