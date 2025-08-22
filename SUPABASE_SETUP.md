# Supabase Database Setup Instructions

## Prerequisites
- A Supabase account and project
- Your Supabase database connection string

## Setup Steps

### 1. Access Supabase SQL Editor
1. Log in to your Supabase dashboard
2. Select your project
3. Navigate to the SQL Editor from the left sidebar

### 2. Run the Setup Script
1. Open the `supabase-setup.sql` file
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click "Run" to execute the script

### 3. Verify the Setup
After running the script, you should see:
- Success message: "Database setup completed successfully!"
- All tables created in the Table Editor

### 4. Update Your Environment Variables
Make sure your `.env` file has the correct Supabase connection string:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

You can find this in:
- Supabase Dashboard → Settings → Database → Connection String

### 5. Important Notes

#### For Production:
- Remove or comment out the default user creation (lines 159-165)
- Review and adjust the permissions based on your security requirements
- Consider using Row Level Security (RLS) policies

#### Tables Created:
- `users` - User profiles
- `teams` - Team/group management
- `team_members` - Team membership
- `note_templates` - Medical note templates
- `notes` - Medical notes
- `smart_phrases` - Dot phrases for quick text insertion
- `team_todos` - Team task management
- `team_calendar_events` - Team calendar
- `user_lab_settings` - User lab preferences
- `pertinent_negative_presets` - Medical symptom presets
- `sessions` - Session storage

#### Default Data:
- Development user (ID: `123e4567-e89b-12d3-a456-426614174000`)
- Three default note templates (Admission, Progress, Consult)

### 6. Troubleshooting

#### If you get permission errors:
Check that your database user has the necessary privileges:
```sql
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
```

#### If you need to reset the database:
The script includes DROP statements at the beginning, so you can safely re-run it to reset everything.

#### If you're using Supabase Auth:
Uncomment lines 191-192 in the script to grant permissions to authenticated users.

### 7. Testing the Connection
After setup, test your application:
1. Deploy to Vercel (or run locally)
2. Try creating a smart phrase (dot phrase)
3. Check if data appears in Supabase Table Editor

## Security Considerations

1. **Row Level Security (RLS)**: Consider enabling RLS on all tables and creating policies
2. **API Keys**: Never expose your Supabase service key in client-side code
3. **User Authentication**: Integrate with Supabase Auth or Auth0 for production
4. **Data Privacy**: Ensure HIPAA compliance if handling real medical data

## Next Steps

1. Enable Row Level Security policies
2. Set up regular database backups
3. Monitor database performance
4. Configure alerts for errors

## Support

If you encounter issues:
1. Check the Supabase logs (Dashboard → Logs → Postgres)
2. Verify your connection string is correct
3. Ensure your Supabase project is active (not paused)