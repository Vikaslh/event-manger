/*
# [Initial Schema Setup]
This script sets up the initial database schema for the Campus Event Management System. It creates tables for colleges, user profiles, events, registrations, attendance, and feedback. It also establishes relationships between these tables and sets up Row Level Security (RLS) to ensure data privacy and proper access control.

## Query Description: [This is a foundational script for a new database. It defines the entire structure for the application. There is no risk to existing data as it's intended for a fresh setup. However, applying it to a database with existing tables of the same name will cause errors.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["High"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Tables Created: colleges, profiles, events, registrations, attendance, feedback
- Foreign Keys: Established between all related tables.
- Indexes: Created on foreign key columns for performance.

## Security Implications:
- RLS Status: Enabled on all tables except `colleges`.
- Policy Changes: Yes, policies are created for all tables to control access based on user roles and college affiliation.
- Auth Requirements: Policies rely on `auth.uid()` and a custom `role` column in the `profiles` table.

## Performance Impact:
- Indexes: Added on foreign keys to optimize joins.
- Triggers: A trigger is added to automatically create a user profile upon new user signup.
- Estimated Impact: Low, as this is an initial setup.
*/

-- 1. Colleges Table
CREATE TABLE
  public.colleges (
    id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

COMMENT ON TABLE public.colleges IS 'Stores information about different colleges.';

-- 2. Profiles Table (for students and admins)
CREATE TABLE
  public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    college_id UUID REFERENCES public.colleges ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'student',
    updated_at TIMESTAMPTZ
  );

COMMENT ON TABLE public.profiles IS 'Stores user profiles, linking to auth.users. Includes role for access control.';

-- Function to automatically create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'student'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Events Table
CREATE TABLE
  public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    "type" TEXT NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    location TEXT,
    max_attendees INT,
    college_id UUID NOT NULL REFERENCES public.colleges ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

CREATE INDEX ON public.events (college_id);
CREATE INDEX ON public.events (created_by);
COMMENT ON TABLE public.events IS 'Stores all event information.';

-- 4. Registrations Table
CREATE TABLE
  public.registrations (
    id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, event_id)
  );

CREATE INDEX ON public.registrations (student_id);
CREATE INDEX ON public.registrations (event_id);
COMMENT ON TABLE public.registrations IS 'Tracks student registrations for events.';

-- 5. Attendance Table
CREATE TABLE
  public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    registration_id UUID NOT NULL REFERENCES public.registrations ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

CREATE INDEX ON public.attendance (registration_id);
COMMENT ON TABLE public.attendance IS 'Tracks student attendance at events.';

-- 6. Feedback Table
CREATE TABLE
  public.feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    registration_id UUID NOT NULL REFERENCES public.registrations ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

CREATE INDEX ON public.feedback (registration_id);
COMMENT ON TABLE public.feedback IS 'Stores feedback submitted by students for events.';


------------------------------------------------
-- RLS (Row Level Security) POLICIES
------------------------------------------------

-- Helper function to get user's role from profiles table
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's college_id from profiles table
CREATE OR REPLACE FUNCTION public.get_my_college_id()
RETURNS UUID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT college_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;


-- RLS Policies for COLLEGES table
CREATE POLICY "Colleges are publicly viewable." ON public.colleges
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage colleges." ON public.colleges
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');


-- RLS Policies for PROFILES table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for EVENTS table
CREATE POLICY "Authenticated users can view events" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create events for their college" ON public.events
  FOR INSERT WITH CHECK (
    get_my_role() = 'admin' AND college_id = get_my_college_id()
  );

CREATE POLICY "Admins can update events for their college" ON public.events
  FOR UPDATE USING (
    get_my_role() = 'admin' AND college_id = get_my_college_id()
  );

CREATE POLICY "Admins can delete events for their college" ON public.events
  FOR DELETE USING (
    get_my_role() = 'admin' AND college_id = get_my_college_id()
  );

-- RLS Policies for REGISTRATIONS table
CREATE POLICY "Users can view their own registrations" ON public.registrations
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can view registrations for their college's events" ON public.registrations
  FOR SELECT USING (
    get_my_role() = 'admin' AND
    event_id IN (SELECT id FROM public.events WHERE college_id = get_my_college_id())
  );

CREATE POLICY "Students can register for events" ON public.registrations
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can cancel their own registration" ON public.registrations
  FOR DELETE USING (auth.uid() = student_id);

-- RLS Policies for ATTENDANCE table
CREATE POLICY "Users can view their own attendance" ON public.attendance
  FOR SELECT USING (
    registration_id IN (SELECT id FROM public.registrations WHERE student_id = auth.uid())
  );

CREATE POLICY "Admins can manage attendance for their college's events" ON public.attendance
  FOR ALL USING (
    get_my_role() = 'admin' AND
    registration_id IN (
      SELECT r.id FROM public.registrations r JOIN public.events e ON r.event_id = e.id
      WHERE e.college_id = get_my_college_id()
    )
  );

-- RLS Policies for FEEDBACK table
CREATE POLICY "Users can manage their own feedback" ON public.feedback
  FOR ALL USING (
    registration_id IN (SELECT id FROM public.registrations WHERE student_id = auth.uid())
  );

CREATE POLICY "Admins can view feedback for their college's events" ON public.feedback
  FOR SELECT USING (
    get_my_role() = 'admin' AND
    registration_id IN (
      SELECT r.id FROM public.registrations r JOIN public.events e ON r.event_id = e.id
      WHERE e.college_id = get_my_college_id()
    )
  );
