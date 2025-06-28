# ClaudeShop TODO List

Here are the features and fixes we plan to implement next:

### High Priority
- [ ] **Implement Auth State Listener:** Create a mechanism that checks if a user's authentication token is still valid. If a non-authenticated user tries to access an admin-only page, they should be redirected to the customer home page.
- [ ] **Add Discount Label:** Add a "discount" field to products. If a discount is applied, display a prominent label on the `ProductCard` showing the original price crossed out and the new price.
- [ ] **Add Coupon Code System:** Implement a coupon code feature in the checkout process. Users can enter a code to receive a percentage or flat discount on their total order. 