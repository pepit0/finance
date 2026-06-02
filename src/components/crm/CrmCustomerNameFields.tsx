import type { CreditAppNameParts } from "../../utils/creditAppName";

type CrmCustomerNameFieldsProps = {
  idPrefix: string;
  value: CreditAppNameParts;
  onChange: (patch: Partial<CreditAppNameParts>) => void;
};

export function CrmCustomerNameFields({ idPrefix, value, onChange }: CrmCustomerNameFieldsProps) {
  return (
    <>
      <label className="loginLabel" htmlFor={`${idPrefix}-first`}>
        First name
      </label>
      <input
        id={`${idPrefix}-first`}
        className="loginInput"
        value={value.first_name}
        onChange={(e) => onChange({ first_name: e.target.value })}
        required
        autoComplete="given-name"
      />
      <label className="loginLabel" htmlFor={`${idPrefix}-middle`}>
        Middle name <span className="crmOptional">(optional)</span>
      </label>
      <input
        id={`${idPrefix}-middle`}
        className="loginInput"
        value={value.middle_name}
        onChange={(e) => onChange({ middle_name: e.target.value })}
        autoComplete="additional-name"
      />
      <label className="loginLabel" htmlFor={`${idPrefix}-last`}>
        Last name
      </label>
      <input
        id={`${idPrefix}-last`}
        className="loginInput"
        value={value.last_name}
        onChange={(e) => onChange({ last_name: e.target.value })}
        required
        autoComplete="family-name"
      />
    </>
  );
}
