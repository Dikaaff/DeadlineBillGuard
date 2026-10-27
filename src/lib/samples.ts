export interface SampleEmail {
  id: string;
  label: string;
  from: string;
  subject: string;
  text: string;
}

export const SAMPLE_EMAILS: SampleEmail[] = [
  {
    id: "electric",
    label: "Electric bill",
    from: "billing@pge.com",
    subject: "Your PG&E statement is ready",
    text: `Hi Raka,

Your Pacific Gas & Electric statement for the period Sep 20 - Oct 19 is ready.

Account number: 4412-8891
Amount due: $142.86
Payment due date: November 6, 2026

Pay by the due date to avoid a late fee of $12.00. Autopay is not enabled on this account.

Thank you,
PG&E Customer Service`,
  },
  {
    id: "gym",
    label: "Recurring membership",
    from: "no-reply@planetfitness.com",
    subject: "Your Planet Fitness membership renews on Nov 2",
    text: `Your Planet Fitness membership will renew on November 2, 2026.

Plan: Classic $24.99/month
Next charge: $24.99
Billing cycle: monthly

You have not checked in to a club in 47 days. Manage your membership in the app.`,
  },
  {
    id: "promo",
    label: "Not a bill",
    from: "deals@shopmail.com",
    subject: "48 hours only: 30% off everything",
    text: `Our biggest sale of the season is here. Save 30% on every order this weekend.

Use code SAVE30 at checkout. Shipping is free on orders over $75. Sale ends Sunday.`,
  },
];
