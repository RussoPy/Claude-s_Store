# Final Handover Instructions

This guide outlines the final steps to switch the store over to the business owner's live credentials. Follow these instructions carefully.

---

## Part 1: Updating SendGrid (Email Server)

This task involves updating the email address that sends order confirmations and receives notifications.

**Your Goal:** Update the backend so that emails are sent from the business owner's verified email address.

### Step-by-Step Instructions:

1.  **Confirm Verification:** Before you begin, make sure the business owner has received the verification email from SendGrid and **clicked the verification link**. You cannot proceed until this is done.

2.  **Edit the Backend Environment File:** Open the following file in your code editor:
    *   `backend/.env`

3.  **Update the Email Variables:** Inside this file, find these two lines and replace the email addresses with the business owner's verified email.

    ```
    # Before
    SENDGRID_FROM_EMAIL="your-current-verified-email@example.com"
    ADMIN_EMAIL="your-current-admin-email@example.com"

    # After (Example)
    SENDGRID_FROM_EMAIL="owner@businessdomain.com"
    ADMIN_EMAIL="owner@businessdomain.com"
    ```

4.  **Restart the Backend Server:** The final step is to restart your backend server. The server only reads the `.env` file when it starts, so this is required for the changes to apply.

### **⚠️ Important Notes for SendGrid:**
*   You **do not** need to rebuild or redeploy the frontend for this change. This is purely a backend configuration update.
*   If emails are not being received after the update, the most likely cause is that the owner has not yet clicked the verification link in the email from SendGrid.

---

## Part 2: Updating PayPal (Payment Processor)

This task involves switching the payment system from your test credentials to the owner's live business credentials.

**Your Goal:** Update the frontend so that payments are processed through the business owner's PayPal account.

### Step-by-Step Instructions:

1.  **Receive the Live Client ID:** The business owner must provide you with their **Live PayPal Client ID**.
    *   **Crucially, confirm they got this from the "Live" tab in their PayPal Developer Dashboard, not the "Sandbox" tab.**

2.  **Edit the Frontend Environment File:** Open the following file in your code editor:
    *   `frontend/.env`

3.  **Update the PayPal Variable:** Inside this file, find the line for `REACT_APP_PAYPAL_CLIENT_ID` and replace the existing ID with the owner's live Client ID.

    ```
    # Before
    REACT_APP_PAYPAL_CLIENT_ID="YOUR_TEST_CLIENT_ID"

    # After (Example)
    REACT_APP_PAYPAL_CLIENT_ID="A1b2C3d4E5f6G7h8I9j0K..."
    ```
    *(Note: If the `frontend/.env` file does not exist, you will need to create it.)*

4.  **Rebuild and Redeploy the Frontend:** This is the most important step for the PayPal update. You must rebuild your frontend application and deploy the new version to Firebase.
    *   **Build Command:** `npm run build --prefix frontend`
    *   **Deploy Command:** `firebase deploy --only hosting`

### **⚠️ Important Notes for PayPal:**
*   You **must** rebuild the frontend. The Client ID is "baked into" the code during the build process. Simply restarting the server will not work.
*   If payments are failing after deployment, double-check that you copied the **Live** Client ID correctly and that it doesn't contain any extra spaces or characters.
*   Once the new version is deployed, it's a good idea to clear your browser cache or perform a hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`) when testing the live site. 