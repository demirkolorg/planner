export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Planner application ("Service"), you accept and agree to be 
              bound by the terms and provision of this agreement. If you do not agree to abide by the 
              above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              Planner is a task management application that allows users to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage tasks and projects</li>
              <li>Organize tasks with priorities, tags, and due dates</li>
              <li>Sync tasks with Google Calendar</li>
              <li>Track progress and productivity</li>
              <li>Collaborate on projects</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Transmit any harmful, offensive, or inappropriate content</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to other user accounts</li>
              <li>Use the Service for any commercial purpose without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Google Calendar Integration</h2>
            <p>When using Google Calendar integration:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You grant us permission to access your Google Calendar as specified</li>
              <li>We will only access calendar data necessary for task synchronization</li>
              <li>You can revoke access at any time through your account settings</li>
              <li>Google's Terms of Service also apply to this integration</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Service and its original content are owned by us and our licensors</li>
              <li>You retain ownership of any content you create using the Service</li>
              <li>You grant us a license to use your content to provide the Service</li>
              <li>You may not copy, modify, or distribute our proprietary content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs 
              your use of the Service, to understand our practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We strive to maintain high service availability but cannot guarantee 100% uptime</li>
              <li>We may temporarily suspend the Service for maintenance or updates</li>
              <li>We are not liable for any loss or damage due to service interruptions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p>
              In no event shall we be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
              or other intangible losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may terminate your account at any time</li>
              <li>We may terminate or suspend your account for violations of these terms</li>
              <li>Upon termination, your data will be deleted according to our Privacy Policy</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of 
              significant changes. Continued use of the Service after changes constitutes acceptance 
              of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: support@theplanners.vercel.app</li>
              <li>Website: https://theplanners.vercel.app</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}