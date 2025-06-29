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
