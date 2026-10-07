import { Link } from "react-router-dom";
import { mailtoHref, siteConfig } from "../../site.config";
import { LegalDoc, Section } from "../components/LegalDoc";

const email = siteConfig.contactEmail;

export function CookiesPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Cookie Policy">
      <Section title="1. Overview">
        <p>
          This Cookie Policy explains how Feath uses cookies and similar technologies (such as browser local
          storage) on <strong>feath.xyz</strong>. It should be read together with our{" "}
          <Link to="/privacy/">Privacy Policy</Link>.
        </p>
      </Section>

      <Section title="2. What cookies are">
        <p>
          Cookies are small text files a website can store in your browser. They are often used to remember your
          preferences or to track you across sites. Similar technologies include local storage, which lets a
          site save data in your browser without sending it back on every request.
        </p>
      </Section>

      <Section title="3. Cookies we use">
        <p>
          <strong>We do not use advertising or analytics cookies, and we do not track you across other
          websites.</strong> We do not run third-party tracking scripts on this site.
        </p>
      </Section>

      <Section title="4. Local storage we use">
        <p>We use your browser&rsquo;s local storage for a single, functional purpose:</p>
        <ul>
          <li>
            <strong>feath-site-theme</strong>: remembers whether you chose the light or dark theme, so the
            site looks the way you left it. It stays on your device and is not sent to us.
          </li>
        </ul>
        <p>
          You can clear it at any time by clearing your browser storage; the site will simply default to the
          light theme.
        </p>
      </Section>

      <Section title="5. Third-party services">
        <p>
          We load fonts through <strong>Google Fonts</strong>. When your browser requests those fonts, Google
          receives your IP address and basic request information. Google Fonts does not set cookies for this
          purpose. Other third parties that host or operate the site (such as our hosting provider) may keep
          standard server logs. See the Privacy Policy for details.
        </p>
      </Section>

      <Section title="6. Managing cookies">
        <p>
          You can control and delete cookies and local storage through your browser settings. Blocking cookies
          will not break this site, because we do not rely on cookies to function. For guidance, see your
          browser&rsquo;s help pages.
        </p>
      </Section>

      <Section title="7. Changes to this policy">
        <p>
          If we begin using cookies for new purposes, we will update this policy and, where required, ask for
          your consent first.
        </p>
      </Section>

      <Section title="8. Contact us">
        <p>
          Questions about this policy? Email <a href={mailtoHref()}>{email}</a> or call{" "}
          {siteConfig.contactPhone}.
        </p>
      </Section>
    </LegalDoc>
  );
}
