# Price alerts

Requires `IWMM_API_KEY`.

## Create an alert

> Alert me if Lightning Bolt LEA drops below $1000.

`[tool: create_price_alert]` with the card UUID, target price, and direction (`below` or `above`).

## List your alerts

> What price alerts do I have set?

`[tool: list_price_alerts]`.

## Update an alert

> Change my Lightning Bolt alert threshold to $900.

`[tool: update_price_alert]`.

## Delete an alert

> Cancel the alert on Force of Will.

`[tool: delete_price_alert]`.

## Notifications

When an alert fires, it shows up as a notification:

> Any new price notifications?

`[tool: list_notifications]` or `[tool: get_unread_notification_count]`. Mark them read with `[tool: mark_notification_read]` or `[tool: mark_all_notifications_read]`.
