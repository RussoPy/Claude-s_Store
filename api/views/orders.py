# --- Send Confirmation Emails ---
try:
    # Prepare customer email
    customer_subject = f"Your claudeShop order confirmation! Order ID: {order_id}"
    customer_message = (
        f"Hello {customer_name},\n\n"
        f"Thank you for your order! We have received it and it's now being processed.\n\n"
        f"Order Summary:\n{product_details_text}\n"
        f"Total: ₪{total_price:.2f}\n\n"
        f"Thank you for choosing claudeShop!"
    )
    print("Attempting to send customer confirmation email...")
    customer_email_sent_count = send_mail(
        subject=customer_subject,
        message=customer_message,
        from_email=from_email,
        recipient_list=[customer_email],
        fail_silently=False,
    )
    print(f"send_mail for customer returned: {customer_email_sent_count}")
    if customer_email_sent_count > 0:
        print(f"Customer confirmation email successfully sent to {customer_email}")
    else:
        print(f"Customer confirmation email failed to send to {customer_email} (send_mail returned 0).")

    # Prepare admin notification email
    admin_subject = f"New Order Received! Order ID: {order_id}"
    admin_message = (
        f"A new order has been placed!\n\n"
        f"Order Details:\n"
        f"Order ID: {order_id}\n"
        f"Customer Name: {customer_name} ({customer_email})\n"
        f"Phone: {customer_phone}\n\n"
        f"Products:\n{product_details_text}\n"
        f"Total: ₪{total_price:.2f}"
    )
    print("\nAttempting to send admin notification email...")
    admin_email_sent_count = send_mail(
        subject=admin_subject,
        message=admin_message,
        from_email=from_email,
        recipient_list=[admin_email],
        fail_silently=False,
    )
    print(f"send_mail for admin returned: {admin_email_sent_count}")
    if admin_email_sent_count > 0:
        print(f"Admin notification email successfully sent to {admin_email}")
    else:
        print(f"Admin notification email failed to send to {admin_email} (send_mail returned 0).")

except Exception as e:
    # Log any exception that occurs during email sending
    logger.critical(f"Could not send order emails for order {order_id}. Error: {e}") 