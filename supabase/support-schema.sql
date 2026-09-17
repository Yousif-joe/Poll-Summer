-- ============================================================
-- Support Portal schema
-- Run this in the Supabase SQL Editor after schema.sql
-- ============================================================

-- 1. Knowledge base (editable via Supabase table editor — no redeploy needed)
create table if not exists support_knowledge (
  id         uuid primary key default gen_random_uuid(),
  topic      text not null check (topic in ('meal', 'systems')),
  title      text not null,
  content    text not null,
  created_at timestamptz default now()
);

-- 2. Escalation log
create table if not exists support_requests (
  id           uuid primary key default gen_random_uuid(),
  topic        text not null,
  assigned_to  text not null,
  user_question text not null default '',
  status       text not null default 'open',
  created_at   timestamptz default now()
);

-- 3. RLS
alter table support_knowledge enable row level security;
alter table support_requests  enable row level security;

-- anon can read the knowledge base (the API route fetches on behalf of the user)
create policy "anon can select support_knowledge"
  on support_knowledge for select
  to anon
  using (true);

-- anon can log escalations
create policy "anon can insert support_requests"
  on support_requests for insert
  to anon
  with check (true);

-- 4. Seed data — replace with real content; add rows via the Supabase table editor
insert into support_knowledge (topic, title, content) values

-- Systems: PowerSchool enrollment
('systems', 'Enroll a Student in PowerSchool',
'Follow these steps to enroll a new student in PowerSchool:

1. Log in to PowerSchool at your school''s PowerSchool URL.
2. From the main menu, click "Enrollment" → "New Student Enrollment".
3. Fill in the student''s personal details: first name, last name, date of birth, and gender.
4. Enter the student''s address and emergency contact information.
5. Select the correct grade level and enrollment date.
6. Assign the student to their homeroom teacher and section.
7. Click "Save" to complete the enrollment.
8. Print the enrollment confirmation page for your records.

Note: If the student is transferring from another school, request their records
and enter the transfer date in the "Prior School" field.
If you encounter an error at any step, contact the Systems Officer for assistance.'),

-- Systems: password reset
('systems', 'Reset a Student Password in PowerSchool',
'To reset a student''s PowerSchool portal password:

1. Log in to PowerSchool with admin credentials.
2. Search for the student by name or student ID.
3. Open the student''s profile.
4. Click "Guardian/Student Access" in the left sidebar.
5. Under the student account section, click "Reset Password".
6. A temporary password will be generated — share it with the student.
7. Advise the student to change their password on first login.

If the student''s account does not appear, they may not have been enrolled in the portal yet.
Contact the Systems Officer to enable their account.'),

-- MEAL: data warehouse reporting
('meal', 'Run a Report in the Data Warehouse',
'To run a standard report in the data warehouse:

1. Log in to the data warehouse portal at [your portal URL — update this].
2. Navigate to "Reports" in the top navigation bar.
3. Select the report category (e.g., Programme Data, Monitoring, Evaluation).
4. Choose your report from the list and click to open it.
5. Set the date range and any required filters (e.g., programme, location, indicator).
6. Click "Generate Report" or "Run".
7. Wait for the report to load (large reports may take 30–60 seconds).
8. Export to Excel or PDF using the export button in the top right.

If the report shows no data, check that your filters match the data collection period.
Contact the MEAL Head if you need a custom report or cannot access a specific section.'),

-- MEAL: what is MEAL
('meal', 'What is MEAL?',
'MEAL stands for Monitoring, Evaluation, Accountability and Learning.

- Monitoring: Tracking programme activities and outputs on an ongoing basis.
- Evaluation: Assessing whether programmes are achieving their intended outcomes and impact.
- Accountability: Ensuring we are responsible and responsive to the communities we serve.
- Learning: Using data and findings to continuously improve our programmes.

The MEAL team is responsible for data collection frameworks, indicator tracking, quality
assurance, and reporting across all programmes. They also manage the data warehouse and
support staff in interpreting and using programme data.');
