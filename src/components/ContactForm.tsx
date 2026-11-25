import { FORM_ERROR, useWixForm } from "../hooks/forms/useWixForm";
import type { FormDto } from "../wix/forms/types";

interface Props {
  formId: string;
  initialForm?: FormDto;
}

export default function ContactForm({ formId, initialForm }: Props) {
  const { form, errors, bind, submit, loading, closed, outcome, step, next, previous } = useWixForm(formId, { initialForm });

  if (!form) {
    return <p role="status">{loading ? "Loading contact form…" : "The contact form is temporarily unavailable."}</p>;
  }
  if (closed) return <p role="status">{form.disabledMessage || "The contact form is currently closed."}</p>;
  if (outcome) return <p className="contact-success" role="status">{outcome.message || "Thanks for getting in touch with CRE Alexa."}</p>;

  const activeStep = form.steps[step]?.id;
  const fields = form.fields.filter((field) => !field.hidden && (!activeStep || field.stepId === activeStep));
  const finalStep = step >= form.steps.length - 1;

  return (
    <form className="contact-form" noValidate onSubmit={async (event) => {
      if (!finalStep) {
        next(event);
        return;
      }
      const result = await submit(event);
      if (result && result.url) {
        const url = new URL(result.url, window.location.href);
        if (url.protocol === "https:" || url.protocol === "http:") window.location.assign(url.href);
      }
    }}>
      {fields.map((field) => {
        const id = `field-${field.target}`;
        const wide = field.control === "textarea";
        const attributes = {
          ...bind(field.target),
          id,
          required: field.required,
          disabled: field.readOnly,
          placeholder: field.placeholder,
          "aria-describedby": [field.description && `${id}-help`, errors[field.target] && `err-${field.target}`].filter(Boolean).join(" ") || undefined,
        };
        return (
          <div className={wide ? "contact-field contact-field-wide" : "contact-field"} key={field.target}>
            <label className={field.showLabel ? undefined : "sr-only"} htmlFor={id}>
              {field.label}{field.required && <span aria-hidden="true"> *</span>}
            </label>
            {wide
              ? <textarea {...attributes} rows={4} />
              : field.control === "select"
                ? <select {...attributes}><option value="">Choose an option</option>{field.choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>
                : <input {...attributes} type={field.control === "email" ? "email" : "text"} />}
            {field.description && <small id={`${id}-help`}>{field.description}</small>}
            {errors[field.target] && <small className="field-error" id={`err-${field.target}`} role="alert">{errors[field.target]}</small>}
          </div>
        );
      })}
      {errors[FORM_ERROR] && <p className="field-error contact-field-wide" role="alert">{errors[FORM_ERROR]}</p>}
      <div className="contact-actions contact-field-wide">
        {step > 0 && <button className="button button-secondary" type="button" onClick={previous}>{form.previousText || "Back"}</button>}
        <button className="button" disabled={loading} type="submit">
          {loading ? "Sending…" : finalStep ? form.submitText || "Send message" : form.nextText || "Continue"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  );
}
