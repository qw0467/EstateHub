import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: April 9, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using EstateHub ("the Platform", "we", "us", or "our"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms in full, you must not use the Platform. Your continued use of EstateHub constitutes your acceptance of any updates or amendments to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. About EstateHub</h2>
            <p>
              EstateHub is an online real estate marketplace that connects property seekers with available listings. We provide tools including property searches, booking requests, membership benefits, market insights, and agent support services. EstateHub does not act as a real estate agent, broker, or legal adviser. All transactions and agreements related to properties remain solely between the parties involved.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years of age to create an account and use EstateHub. By registering, you confirm that all information you provide is accurate, current, and complete. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. User Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Maintaining the security and confidentiality of your password</li>
              <li>All activity that occurs under your account</li>
              <li>Notifying us immediately at support@estatehub.com of any unauthorised use</li>
              <li>Ensuring your account information remains accurate and up to date</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these Terms or are suspected of fraudulent activity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Membership Plans</h2>
            <p>
              EstateHub offers free and paid membership tiers. Paid memberships (Monthly and Yearly) grant access to additional features including priority bookings, VIP property previews, concierge services, market insights, and exclusive events.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Monthly membership</strong> renews automatically on a monthly basis unless cancelled before the renewal date.</li>
              <li><strong>Yearly membership</strong> renews automatically on an annual basis unless cancelled at least 7 days before renewal.</li>
              <li>Membership fees are non-refundable except where required by applicable law.</li>
              <li>We reserve the right to change membership pricing with 30 days' notice.</li>
              <li>Downgrading or cancelling your membership removes access to paid features at the end of the billing period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Property Listings</h2>
            <p>
              EstateHub displays property listings sourced from agents, landlords, and developers. While we make reasonable efforts to ensure accuracy, we do not warrant that any listing information (including price, availability, or description) is complete or error-free. You should independently verify all material facts before making any property-related decision.
            </p>
            <p className="mt-2">
              EstateHub reserves the right to remove or modify any listing at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Booking Requests</h2>
            <p>
              Booking requests submitted through EstateHub are expressions of interest only and do not constitute a legally binding reservation or agreement to purchase or rent a property. Priority viewing requests are subject to membership eligibility and agent availability. Confirmation of any viewing or appointment is at the discretion of the property agent or owner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Platform for any unlawful, fraudulent, or harmful purpose</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Submit false, misleading, or inaccurate information</li>
              <li>Attempt to gain unauthorised access to any part of the Platform or its systems</li>
              <li>Scrape, harvest, or collect data from the Platform without our written consent</li>
              <li>Use automated tools or bots to interact with the Platform</li>
              <li>Post spam, unsolicited communications, or malicious content</li>
              <li>Circumvent any access controls or membership restrictions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Intellectual Property</h2>
            <p>
              All content on EstateHub, including but not limited to text, images, logos, design, data, and software, is the property of EstateHub or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Privacy & Data Protection</h2>
            <p>
              Your use of EstateHub is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the collection, use, and processing of your personal data as described in our Privacy Policy. We handle all data in accordance with applicable data protection laws, including GDPR where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Third-Party Links and Services</h2>
            <p>
              EstateHub may contain links to third-party websites or services. We are not responsible for the content, privacy practices, or terms of those external sites. Accessing third-party links is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Disclaimers and Limitation of Liability</h2>
            <p>
              EstateHub is provided on an "as is" and "as available" basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p className="mt-2">
              In no event shall EstateHub, its directors, employees, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of — or inability to use — the Platform, even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless EstateHub and its affiliates, officers, agents, and employees from any claims, losses, liabilities, damages, costs, or expenses (including legal fees) arising out of your use of the Platform, your violation of these Terms, or your infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Changes to These Terms</h2>
            <p>
              We may revise these Terms at any time. When we do, we will update the "Last updated" date at the top of this page and, where appropriate, notify registered users by email. Your continued use of EstateHub following the posting of updated Terms constitutes your acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">15. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">16. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <address className="mt-2 not-italic">
              <p><strong>EstateHub</strong></p>
              <p>Email: <a href="mailto:support@estatehub.com" className="text-primary underline">support@estatehub.com</a></p>
              <p>Or use our <a href="/contact" className="text-primary underline">Contact Us</a> form.</p>
            </address>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
