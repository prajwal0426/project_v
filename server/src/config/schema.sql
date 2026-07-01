create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name varchar(160) not null,
  email varchar(255) unique not null,
  password_hash text not null,
  date_of_birth date not null,
  government_id_file text,
  id_verification_status varchar(40) not null default 'pending',
  privacy_policy_accepted boolean not null default false,
  terms_accepted boolean not null default false,
  age_confirmed boolean not null default false,
  legal_accepted_at timestamptz,
  privacy_policy_version varchar(20),
  terms_version varchar(20),
  role varchar(30) not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name varchar(180) not null,
  email varchar(255) unique not null,
  password_hash text not null,
  verification_file text,
  privacy_policy_accepted boolean not null default false,
  terms_accepted boolean not null default false,
  age_confirmed boolean not null default false,
  legal_accepted_at timestamptz,
  privacy_policy_version varchar(20),
  terms_version varchar(20),
  profile text,
  status varchar(40) not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admins (
  id uuid primary key default uuid_generate_v4(),
  name varchar(160) not null,
  email varchar(255) unique not null,
  password_hash text not null,
  role varchar(30) not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete set null,
  title varchar(180) not null,
  description text,
  difficulty varchar(20) not null check (difficulty in ('easy', 'medium', 'hard')),
  coin_reward int not null default 0,
  budget_inr numeric(12,2) not null default 0,
  reward_pool_inr numeric(12,2) not null default 0,
  bonus_inr numeric(12,2) not null default 0,
  payment_inr numeric(12,2) not null default 0,
  status varchar(40) not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  file_url text,
  status varchar(40) not null default 'submitted',
  feedback text,
  feedback_score numeric(4,2) not null default 0,
  star_rating numeric(3,2) not null default 0,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists rankings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  month date not null,
  projects_completed int not null default 0,
  feedback_score numeric(5,2) not null default 0,
  star_rating numeric(3,2) not null default 0,
  difficulty_score numeric(10,2) not null default 0,
  total_score numeric(12,2) not null default 0,
  badge varchar(30) not null default 'Bronze',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create table if not exists wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references users(id) on delete cascade,
  company_id uuid unique references companies(id) on delete cascade,
  coin_balance numeric(12,2) not null default 0,
  inr_balance numeric(12,2) not null default 0,
  pending_inr_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or company_id is not null)
);

create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  type varchar(40) not null,
  coin_amount numeric(12,2) not null default 0,
  inr_amount numeric(12,2) not null default 0,
  provider varchar(40) not null default 'paypal',
  provider_reference text,
  status varchar(40) not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  admin_id uuid references admins(id) on delete cascade,
  title varchar(180) not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null,
  sender_role varchar(30) not null,
  receiver_id uuid not null,
  receiver_role varchar(30) not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  rating numeric(3,2) not null check (rating >= 0 and rating <= 5),
  body text,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_company on projects(company_id);
create index if not exists idx_submissions_user on submissions(user_id);
create index if not exists idx_submissions_project on submissions(project_id);
create index if not exists idx_rankings_month_score on rankings(month, total_score desc);
create index if not exists idx_transactions_status on transactions(status);
create index if not exists idx_notifications_user on notifications(user_id, is_read);

alter table users add column if not exists privacy_policy_accepted boolean not null default false;
alter table users add column if not exists terms_accepted boolean not null default false;
alter table users add column if not exists age_confirmed boolean not null default false;
alter table users add column if not exists legal_accepted_at timestamptz;
alter table users add column if not exists privacy_policy_version varchar(20);
alter table users add column if not exists terms_version varchar(20);

alter table companies add column if not exists privacy_policy_accepted boolean not null default false;
alter table companies add column if not exists terms_accepted boolean not null default false;
alter table companies add column if not exists age_confirmed boolean not null default false;
alter table companies add column if not exists legal_accepted_at timestamptz;
alter table companies add column if not exists privacy_policy_version varchar(20);
alter table companies add column if not exists terms_version varchar(20);

alter table wallets add column if not exists inr_balance numeric(12,2) not null default 0;
alter table wallets add column if not exists pending_inr_balance numeric(12,2) not null default 0;
alter table transactions add column if not exists inr_amount numeric(12,2) not null default 0;
alter table projects add column if not exists budget_inr numeric(12,2) not null default 0;
alter table projects add column if not exists reward_pool_inr numeric(12,2) not null default 0;
alter table projects add column if not exists bonus_inr numeric(12,2) not null default 0;
alter table projects add column if not exists payment_inr numeric(12,2) not null default 0;
