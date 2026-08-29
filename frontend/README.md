# EduPay Manager

Build a simple, clean, responsive web-based Institute Fee Management & Receipt System.

This is an MVP/demo for a small institute with a low budget. Keep the system simple, professional, and easy for an admin to use.

TECH STACK:

- React.js

- Tailwind CSS

- JavaScript

- Use localStorage for demo data

- No backend/database for now

- Make it responsive for both mobile/iPhone and laptop/desktop

MAIN USER:

Admin only.

1. ADMIN LOGIN

Create a simple login page.

Fields:

- Username

- Password

After login, redirect to Dashboard.

2. DASHBOARD

Show summary cards:

- Total Students

- Total Fees

- Total Paid

- Total Remaining

- Payments Due Today

- Upcoming Payments

Add a "Fee Reminders" section.

Reminder categories:

- Due Today

- Due Tomorrow

- Upcoming

- Overdue

Each reminder should show:

- Student Name

- Course

- Remaining Fee

- Payment Due Date

- Status

Example:

Rahul Patil

Remaining Fee: ₹5,000

Due Date: 20 August 2026

Status: Due Today

If the due date is today, show a clear "Payment Due Today" reminder to the admin.

If the due date has passed, show "Overdue".

3. STUDENT MANAGEMENT

Create a Students page.

Show students in a table/card layout.

Student fields:

- Student ID

- Student Name

- Mobile Number

- Email (optional)

- Course

- Batch

- Admission Date

- Total Course Fee

- Total Paid Fee

- Remaining Fee

- Next Payment Due Date

Buttons:

- Add Student

- Edit

- View

- Delete

- Search

4. ADD STUDENT

Create a form:

Student Name

Mobile Number

Email

Course

Batch

Admission Date

Total Course Fee

After saving, calculate remaining fee automatically.

5. FEE PAYMENT

Create a payment form.

Fields:

- Select Student

- Total Course Fee

- Previously Paid

- Current Payment

- Remaining Fee

- Payment Date

- Next Payment Due Date

- Payment Mode

Payment Mode options:

- Cash

- UPI

- Bank Transfer

Calculation:

Remaining Fee =

Total Course Fee - Total Paid Amount

Example:

Total Course Fee: ₹30,000

Previously Paid: ₹10,000

Current Payment: ₹5,000

Remaining Fee: ₹15,000

After payment, update the student's paid and remaining amount automatically.

6. PAYMENT DUE DATE

Every payment can have a "Next Payment Due Date".

Example:

Student:

Rahul Patil

Total Fee: ₹30,000

Paid: ₹15,000

Remaining: ₹15,000

Next Payment Date: 30 August 2026

The system must compare today's date with the Next Payment Due Date.

If:

- Date = Today → "Due Today"

- Date < Today → "Overdue"

- Date > Today → "Upcoming"

Show these reminders on the Admin Dashboard.

7. PAYMENT HISTORY

Create a simple payment history page.

Show:

- Student Name

- Receipt Number

- Payment Date

- Amount Paid

- Payment Mode

- Remaining Amount

- Next Due Date

Add search by student name.

8. RECEIPT GENERATION

After a payment is saved, allow the admin to generate a receipt.

Receipt should contain:

Institute Logo

Institute Name

Institute Address

Receipt Number

Receipt Date

Student Name

Mobile

Course

Batch

Total Course Fee

Previously Paid

Current Payment

Total Paid

Remaining Fee

Payment Mode

Next Payment Due Date

Add:

"Thank you"

Buttons:

- Download PDF

- Print Receipt

Use jsPDF or another suitable client-side PDF library.

9. REMINDER SYSTEM

Create a simple reminder system without SMS or WhatsApp.

On the Dashboard show:

🔔 Fee Reminders

Due Today:

Students whose payment due date is today.

Upcoming:

Students whose payment due date is within the next 7 days.

Overdue:

Students whose payment due date has already passed.

The admin should immediately see these reminders after logging in.

10. DESIGN

Create a modern, clean and professional institute dashboard.

Use:

- White background

- Soft blue / navy accent

- Rounded cards

- Clean tables

- Simple sidebar navigation

- Clear buttons

- Good spacing

- Responsive layout

Sidebar:

Dashboard

Students

Fee Collection

Payment History

Receipts

Reminders

Settings

Logout

11. SETTINGS

Basic institute settings:

- Institute Name

- Logo

- Address

- Mobile Number

- Email

These details should appear on generated receipts.

12. DEMO DATA

Add 5–8 sample students so the dashboard looks realistic.

Include different situations:

- One student due today

- One student overdue

- One student due tomorrow

- One student with no remaining fee

- One student with upcoming payment

Use Indian Rupees (₹).

IMPORTANT:

Keep this as a simple MVP.

DO NOT add:

- Inventory

- Product management

- GST accounting

- Online payment gateway

- WhatsApp API

- SMS API

- Advanced accounting

- Multi-admin roles

- Complex reports

Use localStorage so the demo works immediately without a backend.

Make sure all buttons and forms work properly and the fee calculations and due-date reminders are functional.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c9ee3a35-6162-4ff2-9a91-297ca5190546).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
