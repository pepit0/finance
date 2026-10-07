import { Link } from "react-router-dom";
import { mailtoHref, siteConfig } from "../../site.config";
import { LegalDoc, Section } from "../components/LegalDoc";

const email = siteConfig.contactEmail;

export function TermsPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Terms of Service">
      <Section title="1. Agreement to these terms">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to <strong>feath.xyz</strong> and any
          services we provide (&ldquo;Services&rdquo;). By using the site, submitting a form, or engaging us,
          you agree to these Terms. If you do not agree, please do not use the site or Services.
        </p>
      </Section>

      <Section title="2. Who we are">
        <p>
          Feath (also known as &ldquo;Feath AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is based in Canada.
          These Terms apply to your use of the site and, where applicable, the Services described below.
        </p>
      </Section>

      <Section title="3. Our services">
        <p>
          We design and build custom websites, the Feath CRM, integrations, and bespoke tools, and provide
          related consulting. Information on the site (pricing, features, timelines) is provided for general
          information and is not a binding offer.
        </p>
      </Section>

      <Section title="4. Quotes, proposals, and orders">
        <p>
          A project begins when we confirm a written proposal or statement of work and you pay any deposit it
          requires. The proposal sets out the scope, deliverables, timeline, and fees. Anything not described
          in the proposal is out of scope and may require a separate agreement and additional fees.
        </p>
      </Section>

      <Section title="5. Fees, billing, and subscriptions">
        <ul>
          <li>Fees are set out in your proposal and may be one-time (project) or recurring (monthly).</li>
          <li>Invoices are due on receipt unless the proposal says otherwise.</li>
            <li>Recurring fees are billed monthly and continue until cancelled as described below.</li>
          <li>Fees are exclusive of applicable taxes, which will be added where required.</li>
          <li>We may pause or suspend work, hosting, or access if invoices are overdue.</li>
        </ul>
      </Section>

      <Section title="6. Refunds and cancellation">
        <p>
          Deposits and payments for work already performed are non-refundable. Recurring plans can be cancelled
          with 30 days&rsquo; notice and are not pro-rated for partial months. Custom work is commissioned and
          generally non-refundable once delivered, except that we will fix defects covered by the scope or any
          warranty period stated in your proposal. Nothing here limits rights you may have under applicable
          consumer protection law.
        </p>
      </Section>

      <Section title="7. Client responsibilities">
        <ul>
          <li>provide content, access, feedback, and approvals in a timely way;</li>
          <li>ensure any materials you give us are accurate and that you have the rights to use them;</li>
          <li>keep your account credentials secure;</li>
          <li>use the Services and any deliverables lawfully.</li>
        </ul>
      </Section>

      <Section title="8. Your content and intellectual property">
        <p>
          You keep ownership of the content, logos, and data you provide. You grant us a licence to use that
          content to deliver the Services. We own our pre-existing code, tools, libraries, the Feath CRM, and
          our know-how. Ownership of the final website deliverables passes to you on full payment, as described
          in your proposal. Unless you tell us not to, we may showcase completed work in our portfolio and
          marketing.
        </p>
      </Section>

      <Section title="9. Third-party services">
        <p>
          Deliverables may rely on third-party providers such as hosting, domains, APIs, fonts, and CRM
          integrations. Those providers have their own terms and fees, and we are not responsible for their
          availability, changes, or acts.
        </p>
      </Section>

      <Section title="10. Acceptable use">
        <p>
          You agree not to use the site or Services to break the law, infringe others&rsquo; rights, distribute
          malware, attempt to gain unauthorised access, or send spam. This includes any tools we offer for
          sharing links or hosting prototypes: do not upload or share unlawful, infringing, or harmful content.
          We may remove content and suspend access for violations.
        </p>
      </Section>
      <Section title="11. Availability and support">
        <p>
          We aim to keep the site and Services available, but we do not guarantee uninterrupted or error-free
          operation. Scheduled maintenance, third-party outages, and events beyond our control may cause
          downtime. Support is provided as described in your plan or proposal.
        </p>
      </Section>

      <Section title="12. Disclaimers">
        <p>
          To the fullest extent permitted by law, the site and Services are provided &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo;, without warranties of any kind, whether express or implied, including
          fitness for a particular purpose, merchantability, or non-infringement. We do not warrant any
          specific business result, traffic, or revenue.
        </p>
      </Section>

      <Section title="13. Limitation of liability">
        <p>
          To the maximum extent permitted by law, our total liability arising out of or relating to the Services
          is limited to the amount you paid us for the affected Services in the three (3) months before the
          event giving rise to the claim. We are not liable for indirect, incidental, special, or consequential
          damages, or for lost profits, data, or goodwill.
        </p>
      </Section>

      <Section title="14. Indemnity">
        <p>
          You agree to indemnify and hold us harmless from claims, losses, and costs (including reasonable legal
          fees) arising from your content, your use of the Services, or your breach of these Terms.
        </p>
      </Section>

      <Section title="15. Confidentiality">
        <p>
          Each party will keep the other&rsquo;s non-public information confidential and use it only to perform
          under these Terms, except where disclosure is required by law.
        </p>
      </Section>

      <Section title="16. Termination">
        <p>
          Either party may terminate as set out in your proposal or with reasonable written notice. On
          termination you must pay for work performed and expenses incurred up to the termination date. Sections
          that by their nature should survive (including intellectual property, disclaimers, liability, and
          governing law) will survive termination.
        </p>
      </Section>

      <Section title="17. Governing law and disputes">
        <p>
          These Terms are governed by the laws of the Province of Alberta and the federal laws of Canada
          applicable there, without regard to conflict-of-law rules. The courts of Alberta will have exclusive
          jurisdiction, and the parties will first attempt to resolve disputes in good faith.
        </p>
      </Section>

      <Section title="18. Changes to these terms">
        <p>
          We may update these Terms from time to time. We will post the revised version here and update the
          &ldquo;Last updated&rdquo; date. Continued use after changes means you accept the revised Terms.
        </p>
      </Section>

      <Section title="19. Contact us">
        <p>
          Questions about these Terms? Email <a href={mailtoHref()}>{email}</a> or call{" "}
          {siteConfig.contactPhone}. See also our <Link to="/privacy/">Privacy Policy</Link> and{" "}
          <Link to="/cookies/">Cookie Policy</Link>.
        </p>
      </Section>
    </LegalDoc>
  );
}
