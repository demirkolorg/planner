export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p>
              When you use our Planner application, we collect the following information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address (for account authentication)</li>
              <li>Task and project data you create</li>
              <li>Google Calendar data (when you choose to integrate)</li>
              <li>Usage statistics for improving our service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our task management service</li>
              <li>Sync your tasks with Google Calendar (when enabled)</li>
              <li>Authenticate your account and ensure security</li>
              <li>Improve our application features and user experience</li>
              <li>Send important service updates (not marketing)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Google Calendar Integration</h2>
            <p>
              When you connect your Google Calendar:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We access your calendar to sync tasks as events</li>
              <li>We create a dedicated "Planner Calendar" for task synchronization</li>
              <li>We read existing calendar events to avoid conflicts</li>
              <li>We update calendar events when tasks are completed or modified</li>
              <li>You can disconnect at any time from Settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your data is stored securely using industry-standard encryption</li>
              <li>We use secure databases and follow best security practices</li>
              <li>Access to your data is limited to essential operations only</li>
              <li>We do not sell or share your personal data with third parties</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Disconnect Google Calendar integration</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services</h2>
            <p>We integrate with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Calendar API:</strong> For calendar synchronization</li>
              <li><strong>Google OAuth:</strong> For secure authentication</li>
              <li><strong>Vercel:</strong> For hosting and deployment</li>
            </ul>
            <p>These services have their own privacy policies that govern their use of your data.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p>
              We retain your data as long as your account is active. When you delete your account,
              we remove your personal data within 30 days, except where required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any 
              significant changes by posting the new policy on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: privacy@theplanners.vercel.app</li>
              <li>Website: https://theplanners.vercel.app</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}