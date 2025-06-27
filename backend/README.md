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
