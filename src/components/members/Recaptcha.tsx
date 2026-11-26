// Google reCAPTCHA v2 checkbox for Wix member sign-up. Wix Member Settings can require a CAPTCHA;
// the answer token travels to register() as captchaTokens.recaptchaToken (see wix/members/auth.ts).
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface Grecaptcha {
  render(container: HTMLElement, params: Record<string, unknown>): number;
  reset(widgetId?: number): void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    __creRecaptchaReady?: () => void;
  }
}

const SCRIPT_ID = "google-recaptcha-api";
let loading: Promise<Grecaptcha> | null = null;

function loadRecaptcha(): Promise<Grecaptcha> {
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    window.__creRecaptchaReady = () => resolve(window.grecaptcha!);
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://www.google.com/recaptcha/api.js?onload=__creRecaptchaReady&render=explicit";
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("The CAPTCHA could not load. Check your connection or ad blocker, then reload."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export interface RecaptchaHandle {
  /** Clear the checkbox; a token is single-use, so reset after every submit that did not succeed. */
  reset(): void;
}

export interface RecaptchaProps {
  siteKey: string;
  /** The answer token, or null when it expires, errors or is reset. */
  onToken: (token: string | null) => void;
  onLoadError?: (message: string) => void;
}

const Recaptcha = forwardRef<RecaptchaHandle, RecaptchaProps>(function Recaptcha({ siteKey, onToken, onLoadError }, ref) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const tokenCallback = useRef(onToken);
  tokenCallback.current = onToken;

  useImperativeHandle(ref, () => ({
    reset() {
      if (widget.current !== null) window.grecaptcha?.reset(widget.current);
      tokenCallback.current(null);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    loadRecaptcha()
      .then((grecaptcha) => {
        if (cancelled || !container.current || widget.current !== null) return;
        widget.current = grecaptcha.render(container.current, {
          sitekey: siteKey,
          callback: (token: string) => tokenCallback.current(token),
          "expired-callback": () => tokenCallback.current(null),
          "error-callback": () => tokenCallback.current(null),
        });
      })
      .catch((error: Error) => onLoadError?.(error.message));
    return () => {
      cancelled = true;
    };
  }, [siteKey, onLoadError]);

  return <div ref={container} className="min-h-[78px]" />;
});

export default Recaptcha;
