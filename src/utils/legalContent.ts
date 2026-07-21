// Legal / policy content surfaced from the app drawer (Sidebar).
//
// These are plain-language summaries so the links are functional end-to-end.
// The REAUX Labs team should replace the `sections` copy below with the
// authoritative, legally-reviewed text (or point the screen at a backend /
// CMS source) before release. Slugs are used as the route param.

export interface LegalSection {
  heading?: string;
  body: string;
}

export interface LegalDoc {
  slug: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    updated: 'This is a summary. Contact REAUX Labs support for the full policy.',
    intro:
      'REAUX Labs respects your privacy. This summary explains what we collect and how we use it.',
    sections: [
      { heading: 'Information we collect', body: 'Account details you provide (name, email, phone), fitness data you record (BMI, plans you follow), and basic usage information needed to run the app.' },
      { heading: 'How we use it', body: 'To provide the community, marketplace, diet and cycle content, process orders, and improve the experience. We do not sell your personal data.' },
      { heading: 'Sharing', body: 'We share data only with service providers that help operate the app (e.g. payments, hosting) and where required by law.' },
      { heading: 'Your choices', body: 'You can edit your profile, request account deletion, and control notification permissions from your device settings.' },
      { heading: 'Contact', body: 'For any privacy request, reach out to REAUX Labs support through the Contact option in your profile.' },
    ],
  },
  'terms-and-conditions': {
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    updated: 'This is a summary. Contact REAUX Labs support for the full terms.',
    intro: 'By using REAUX Labs you agree to these terms.',
    sections: [
      { heading: 'Your account', body: 'You are responsible for keeping your login secure and for activity on your account. You must provide accurate information.' },
      { heading: 'Acceptable use', body: 'Do not misuse the community, upload unlawful content, or attempt to disrupt the service. Admin/coach content is provided for information only.' },
      { heading: 'Health disclaimer', body: 'Diet plans, cycle protocols, and fitness content are educational and are not medical advice. Consult a qualified professional before starting any program.' },
      { heading: 'Purchases', body: 'Marketplace orders are subject to availability and the pricing shown at checkout, in INR (₹).' },
      { heading: 'Changes', body: 'We may update these terms; continued use means you accept the updated terms.' },
    ],
  },
  'cancellation-and-refund': {
    slug: 'cancellation-and-refund',
    title: 'Cancellation and Refund',
    updated: 'This is a summary. Contact REAUX Labs support for the full policy.',
    intro: 'This summary explains cancellations and refunds for marketplace orders.',
    sections: [
      { heading: 'Order cancellation', body: 'You may request cancellation of an order before it is marked as shipped. Once shipped, cancellation may not be possible.' },
      { heading: 'Refunds', body: 'Approved refunds are issued to the original payment method. Processing times depend on your bank or payment provider.' },
      { heading: 'Damaged or incorrect items', body: 'If you receive a damaged or incorrect item, contact support within a reasonable time with your order number and photos.' },
      { heading: 'Contact', body: 'To request a cancellation or refund, use the Contact option in your profile with your order details.' },
    ],
  },
  'user-data-policy': {
    slug: 'user-data-policy',
    title: 'User Data Policy',
    updated: 'This is a summary. Contact REAUX Labs support for the full policy.',
    intro: 'How your data is stored, retained, and removed.',
    sections: [
      { heading: 'Storage & security', body: 'Your data is stored on secured servers and protected with industry-standard measures. Access is limited to what is needed to operate the service.' },
      { heading: 'Retention', body: 'We keep your data while your account is active and as needed to meet legal and operational requirements.' },
      { heading: 'Deletion', body: 'You can request deletion of your account and associated personal data through support. Some records may be retained where required by law.' },
      { heading: 'Contact', body: 'For data access or deletion requests, reach REAUX Labs support via the Contact option in your profile.' },
    ],
  },
};

export const LEGAL_MENU: { slug: string; title: string }[] = [
  { slug: 'privacy-policy', title: 'Privacy Policy' },
  { slug: 'terms-and-conditions', title: 'Terms and Conditions' },
  { slug: 'cancellation-and-refund', title: 'Cancellation and Refund' },
  { slug: 'user-data-policy', title: 'User Data Policy' },
];
