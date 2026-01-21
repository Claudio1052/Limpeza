# Rio Cleaning Website

Professional cleaning service website with booking system and admin dashboard.

## Features

- **Customer Service Request Form**: Easy scheduling with validation
- **Admin Dashboard**: Complete management system with statistics
- **Responsive Design**: Works on all devices from mobile to desktop
- **Supabase Backend**: Secure data storage and management
- **PWA Support**: Install as app on mobile devices
- **Offline Support**: Works without internet connection
- **Dark Mode**: Automatic system theme detection

## Live Demo

[https://your-username.github.io/rio-cleaning](https://your-username.github.io/rio-cleaning)

## Setup Instructions

### 1. Supabase Setup

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL script from `supabase_setup.sql` in the SQL editor
4. Note your project URL and anon key from Settings > API
5. Update `supabase.js` with your credentials

### 2. Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/rio-cleaning.git

# Navigate to project
cd rio-cleaning

# Open in browser
# You can use any local server, for example:
python -m http.server 8000
# or
npx serve .
