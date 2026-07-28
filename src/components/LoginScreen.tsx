import { FormEvent, useState } from "react";
import { loginSubtitle, loginTitle } from "../utils/productMode";

type LoginScreenProps = {
  onSignIn: (email: string, password: string) => Promise<string | null>;
  title?: string;
  subtitle?: string;
};

export function LoginScreen({ onSignIn, title, subtitle }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    const error = await onSignIn(email.trim(), password);
    if (error) {
      setErrorMessage(error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="loginScreen" role="main" aria-label="Sign in">
      <div className="loginScreenInner">
        <header className="loginScreenHeader">
          <h1 className="loginScreenTitle">{title ?? loginTitle()}</h1>
          <p className="loginScreenSubtitle">{subtitle ?? loginSubtitle()}</p>
        </header>
        <form className="loginForm" onSubmit={handleSubmit}>
          <label className="loginLabel" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="loginInput"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label className="loginLabel" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="loginInput"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {errorMessage ? <p className="loginError">{errorMessage}</p> : null}
          <button className="loginButton" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
