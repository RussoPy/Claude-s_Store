# Claude's Delicatessen - Backend

This directory contains the backend server for the Claude's Delicatessen online store.

## Overview

The backend is a powerful and scalable API built using the Django Rest Framework. It serves as the central hub for managing products, categories, and orders for the e-commerce platform.

## Core Technologies

- **Python:** The primary programming language.
- **Django & Django Rest Framework:** A high-level web framework used to build a robust and secure RESTful API.
- **Firebase:** Utilized as the primary data store and for user authentication.
  - **Firestore:** A NoSQL, cloud-native database used to store all product and category information, allowing for flexible and scalable data management.
  - **Firebase Authentication:** Handles secure user registration, login, and role management (administrators).

## Architecture

The architecture is designed to be modern and decoupled. The Django backend exposes a set of API endpoints that the frontend application consumes. This separation of concerns allows for independent development and scaling of the frontend and backend. All product and user data is managed through integrations with Firebase services, leveraging their reliability and real-time capabilities.

## Environment Variables Setup

### PayPal Configuration
In your `.env` file, add the following PayPal credentials:
```
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_secret_here
PAYPAL_MODE=live  # Use 'live' for production, 'sandbox' for testing
```

To get these credentials:
1. Go to developer.paypal.com
2. Log in with the business PayPal account
3. Go to "My Apps & Credentials"
4. Create a new app or select existing app
5. Copy the Live Client ID and Secret (or Sandbox for testing)

### SendGrid Configuration
In your `.env` file, add:
```
SENDGRID_API_KEY=your_sendgrid_api_key_here
DEFAULT_FROM_EMAIL=your_verified_sender_email@domain.com
ADMIN_EMAIL=business_owner@domain.com
```

To set up SendGrid:
1. Create/login to SendGrid account
2. Go to Settings → API Keys
3. Create new API key with "Mail Send" permissions
4. Verify your sender email in SendGrid
5. Update the environment variables with your credentials

### Updating Production Environment
When deploying to Render:
1. Add all these environment variables in Render's dashboard
2. Make sure to use the production/live credentials
3. Double-check the sender email is verified in SendGrid

# Backend Instructions for the Business Owner

This document provides instructions on how to manage the essential credentials for your online store. These credentials should be kept secret and secure.

## Understanding Environment Variables

Your store's backend uses a special file named `.env` to hold sensitive information like API keys. This file is located in the root of the `backend` directory. It is intentionally kept separate from the main codebase to protect your credentials.

**IMPORTANT:** Never share the contents of your `.env` file or commit it to a public repository.

## Updating Your Credentials

To update the store's credentials, you will need to edit the `backend/.env` file. It will look something like this:

```
# Email settings for SendGrid
SENDGRID_API_KEY="YOUR_SENDGRID_API_KEY_HERE"
SENDGRID_FROM_EMAIL="your-verified-email@yourdomain.com"
ADMIN_EMAIL="email-to-receive-orders@yourdomain.com"

# Payment settings for PayPal
PAYPAL_CLIENT_ID="YOUR_PAYPAL_CLIENT_ID_HERE"
```

Follow the steps below to get the correct values for each setting.

### 1. How to Get Your SendGrid API Key

SendGrid is used to send transactional emails (like order confirmations) to your customers.

1.  **Log in** to your [SendGrid account](https://app.sendgrid.com/).
2.  Navigate to **Settings** > **API Keys**.
3.  Click **Create API Key**.
4.  Give the key a name (e.g., "ClaudeShop Key").
5.  Choose **Full Access** for the permissions.
6.  Click **Create & View**.
7.  **Copy the generated API key immediately.** SendGrid will only show you this key once.
8.  In your `.env` file, replace `"YOUR_SENDGRID_API_KEY_HERE"` with the key you just copied.

You will also need to set up a **Verified Sender Identity** in SendGrid for the `SENDGRID_FROM_EMAIL`. This ensures your emails don't go to spam.

### 2. How to Get Your PayPal Client ID

PayPal is used to process payments from your customers.

1.  **Log in** to your [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2.  Go to the **My Apps & Credentials** section.
3.  Ensure you are in the **Live** tab (not Sandbox).
4.  If you don't have an app yet, click **Create App**.
5.  Once you have an app, you will see its details.
6.  Find the **Client ID** on this page and copy it.
7.  In your `.env` file, replace `"YOUR_PAYPAL_CLIENT_ID_HERE"` with the Client ID you just copied.

### 3. Final Step: Restart the Server

After you have updated your `.env` file, you must **restart your backend server**. The server only reads the `.env` file when it starts up, so a restart is required for the changes to take effect.
