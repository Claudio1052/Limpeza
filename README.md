# Rio Cleaning Website

Professional cleaning service website with booking system and admin dashboard.

## Features

- Customer service request form
- Admin dashboard with statistics
- Service request management (view, edit, delete, update status)
- Responsive design for all devices
- Supabase backend for data storage

## Setup Instructions

1. **Supabase Configuration**:
   - Create a Supabase account at https://supabase.com
   - Create a new project
   - Run the SQL script in `sql_setup.sql` to create the table
   - Update the Supabase URL and anon key in `supabase.js`

2. **GitHub Pages Deployment**:
   - Upload all files to a GitHub repository
   - Go to repository Settings > Pages
   - Select source branch (usually `main`)
   - Save and wait for deployment
   - Your site will be available at `https://[username].github.io/[repository-name]`

3. **Admin Access**:
   - Default admin password: `admin123`
   - Change this in `admin.js` for production use

## Files Structure

- `index.html` - Main website page
- `schedule.html` - Service scheduling form
- `admin.html` - Admin dashboard
- `style.css` - All styles
- `script.js` - Main JavaScript
- `supabase.js` - Supabase configuration and functions
- `admin.js` - Admin dashboard functionality

## Security Notes

- This is a demo application. For production use:
  - Implement proper authentication for admin access
  - Use environment variables for Supabase credentials
  - Add input validation and sanitization
  - Enable Row Level Security in Supabase
