-- CollabSpace Database Schema - Stage: User Profile Dashboard Job Title
-- Migration: 20240117000000_profile_job_title.sql
-- Description: Adds job_title column to public.profiles table

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'job_title'
  ) then
    alter table public.profiles add column job_title text default '';
  end if;
end $$;
