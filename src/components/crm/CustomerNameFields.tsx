type CustomerNameFieldsProps = {
  idPrefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onMiddleNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
};

export function CustomerNameFields({
  idPrefix,
  firstName,
  middleName,
  lastName,
  onFirstNameChange,
  onMiddleNameChange,
  onLastNameChange
}: CustomerNameFieldsProps) {
  return (
    <>
      <label className="loginLabel" htmlFor={`${idPrefix}-first`}>
        First name
      </label>
      <input
        id={`${idPrefix}-first`}
        className="loginInput"
        value={firstName}
        onChange={(e) => onFirstNameChange(e.target.value)}
        required
        autoComplete="given-name"
        placeholder="As on driver's licence"
      />
      <label className="loginLabel" htmlFor={`${idPrefix}-middle`}>
        Middle name <span className="crmOptional">(if applicable)</span>
      </label>
      <input
        id={`${idPrefix}-middle`}
        className="loginInput"
        value={middleName}
        onChange={(e) => onMiddleNameChange(e.target.value)}
        autoComplete="additional-name"
      />
      <label className="loginLabel" htmlFor={`${idPrefix}-last`}>
        Last name
      </label>
      <input
        id={`${idPrefix}-last`}
        className="loginInput"
        value={lastName}
        onChange={(e) => onLastNameChange(e.target.value)}
        required
        autoComplete="family-name"
        placeholder="As on driver's licence"
      />
    </>
  );
}
