"use client";

import { useState } from "react";
import Airtable, { FieldSet } from "airtable";
import { v4 as uuidv4 } from "uuid";

import styles from "./styles.module.css";
import Link from "next/link";

const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE as string;
const airtableApiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY as string;

const airtable = new Airtable({ apiKey: airtableApiKey }).base(baseId);

type ContactFormProps = {};

export default function ContactForm({}: ContactFormProps) {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    optIn: false,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { name, email, message, optIn } = formData;

      // Find existing contact by email
      const contacts = await airtable("Contacts")
        .select({ filterByFormula: `Email = "${email}"` })
        .all();

      let contact: Airtable.Records<FieldSet> | undefined;

      if (contacts.length > 0) {
        // Update existing contact
        contact = await airtable("Contacts").update([
          {
            id: contacts[0].id,
            fields: { Name: name, Email: email, OptIn: optIn },
          },
        ]);
      } else {
        // Create a new contact with UUID
        const newUUID = uuidv4();
        contact = await airtable("Contacts").create([
          { fields: { UUID: newUUID, Name: name, Email: email, OptIn: optIn } },
        ]);
      }

      // Create a message with UUID
      const messageUUID = uuidv4();
      const messages = await airtable("Messages").create([
        {
          fields: {
            UUID: messageUUID,
            Name: name,
            Email: email,
            Message: message,
          },
        },
      ]);

      // Link message to contact
      const existingMessages =
        ((contact as Airtable.Records<FieldSet>)[0].fields[
          "Messages"
        ] as string[]) || [];
      await airtable("Contacts").update([
        {
          id: (contact as Airtable.Records<FieldSet>)[0].id,
          fields: {
            Messages: [...existingMessages, messages[0].id],
          },
        },
      ]);

      setStatus("Thanks for your message!");
      setFormData({ name: "", email: "", message: "", optIn: false }); // Clear form data
      setSubmitted(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setStatus(`An error occurred: ${error.message}`);
      } else {
        setStatus(`An error occurred.`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <form
        method='post'
        onSubmit={handleSubmit}
        className={styles.contact__form}>
        {submitted ? (
          <p>Thank you! We'll be in touch.</p>
        ) : (
          <>
            <div>
              <label htmlFor='name'>Name</label>
              <input
                id='name'
                name='name'
                type='text'
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="What's your name?"
              />
            </div>
            <div>
              <label htmlFor='email'>Email</label>
              <input
                id='email'
                name='email'
                type='email'
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="What's your email?"
              />
            </div>
            <div>
              <label htmlFor='message'>Message</label>
              <textarea
                id='message'
                name='message'
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="What's up?"></textarea>
            </div>
            <div className={styles.contact__form__optin}>
              <input
                id='optin'
                name='optin'
                type='checkbox'
                checked={formData.optIn}
                onChange={(e) =>
                  setFormData({ ...formData, optIn: e.target.checked })
                }
              />
              <label htmlFor='optin'>
                By submitting this form you agree to receive the occasional
                email from us. <Link href='/privacy'>Learn More</Link>.
              </label>
            </div>
            <button type='submit' disabled={submitting}>
              {submitting ? "Submitting..." : "Send"}
            </button>
          </>
        )}
      </form>
    </>
  );
}
