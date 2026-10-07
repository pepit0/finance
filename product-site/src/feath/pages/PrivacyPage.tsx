import { Link } from "react-router-dom";
import { mailtoHref, siteConfig } from "../../site.config";
import { LegalDoc, Section } from "../components/LegalDoc";

const email = siteConfig.contactEmail;

export function PrivacyPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Privacy Policy">
      <Section title="1. Who we are">
        <p>
          Feath (also known as &ldquo;Feath AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) builds custom
          websites, the Feath CRM, and related business tools. We are based in Canada. This policy explains
          what personal information we collect through <strong>feath.xyz</strong>, why we collect it, and the
          choices you have.
        </p>
        <p>
          Questions or requests? Email us at <a href={mailtoHref()}>{email}</a> or call{" "}
          {siteConfig.contactPhone}.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <p>
          <strong>Information you give us.</strong> When you book a consultation or contact us, we collect the
          details you enter, which may include:
        </p>
        <ul>
          <li>your name, email address, phone number, and company name;</li>
          <li>the service you are interested in and any message or project details you share;</li>
          <li>the consultation date and time you select.</li>
        </ul>
        <p>
          <strong>Information collected automatically.</strong> Like most websites, our hosting provider logs
          basic technical data when you visit, such as your IP address, browser and device type, the pages you
          view, and timestamps. This is used to keep the site secure and working.
        </p>
        <p>
          <strong>Information stored on your device.</strong> We save your light/dark theme preference in your
          browser&rsquo;s local storage. See our <Link to="/cookies/">Cookie Policy</Link> for details.
        </p>
        <p>We do not collect sensitive personal information, and we do not sell your personal information.</p>
      </Section>

      <Section title="3. How we use your information">
        <ul>
          <li>respond to your enquiry and arrange the consultation you requested;</li>
          <li>prepare quotes and proposals, and provide our services;</li>
          <li>operate, secure, and improve the site;</li>
          <li>send you information you asked for and follow up on your enquiry;</li>
          <li>meet legal, tax, and accounting obligations.</li>
        </ul>
        <p>
          We process your information on the basis of your consent (when you submit a form), our legitimate
          interest in running and growing our business, and to perform a contract with you.
        </p>
      </Section>

      <Section title="4. How we share information">
        <p>
          We share personal information only with service providers that help us run the site and our business,
          and only as needed:
        </p>
        <ul>
          <li>
            <strong>Formspree</strong>: processes and forwards contact/booking form submissions to our
            email;
          </li>
          <li>
            <strong>Vercel</strong>: hosts this website and keeps access logs;
          </li>
          <li>
            <strong>Google Fonts</strong>: serves the typefaces used on the site;
          </li>
          <li>
            <strong>Email and cloud providers</strong>: used to receive and store your messages.
          </li>
        </ul>
        <p>
          We may also disclose information if required by law, or to protect our rights and the safety of
          others. We never sell your personal information.
        </p>
      </Section>

      <Section title="5. International transfers">
        <p>
          Some of our service providers may store or process data in the United States or other countries
          outside Canada. Where required, we rely on appropriate safeguards for these transfers.
        </p>
      </Section>

      <Section title="6. How long we keep information">
        <p>
          We keep enquiry and booking details for as long as needed to respond and to maintain business records,
          then delete or anonymise them. You can ask us to delete your information sooner (see your rights
          below).
        </p>
      </Section>
      <Section title="7. Security">
        <p>
          We use reasonable technical and organisational measures to protect your information, including
          encrypted (HTTPS) connections. No method of transmission or storage is completely secure, so we
          cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>access the personal information we hold about you;</li>
          <li>ask us to correct or delete it;</li>
          <li>withdraw consent or object to certain processing;</li>
          <li>request a portable copy of your information;</li>
          <li>opt out of marketing communications at any time.</li>
        </ul>
        <p>
          To make a request, email <a href={mailtoHref()}>{email}</a>. We may need to verify your identity. If
          you are in Canada, we handle requests in line with PIPEDA and applicable provincial law; in the
          EEA/UK we follow the GDPR/UK GDPR; and California residents have rights under the CCPA/CPRA, including
          the right not to be discriminated against for exercising them.
        </p>
      </Section>

      <Section title="9. Children's privacy">
        <p>
          Our site and services are intended for businesses and adults. We do not knowingly collect personal
          information from children under 13 (or the minimum age in your region). If you believe a child has
          provided us information, contact us and we will delete it.
        </p>
      </Section>

      <Section title="10. Third-party links">
        <p>
          Our site may link to other websites we do not control. This policy does not apply to them. Please
          review their own privacy policies.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          We may update this policy from time to time. We will post the new version here and update the
          &ldquo;Last updated&rdquo; date. Material changes may also be communicated where appropriate.
        </p>
      </Section>

      <Section title="12. Contact us">
        <p>Feath</p>
        <p>
          Email: <a href={mailtoHref()}>{email}</a>
        </p>
        <p>Phone: {siteConfig.contactPhone}</p>
      </Section>
    </LegalDoc>
  );
}
