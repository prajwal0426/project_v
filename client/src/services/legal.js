export const LEGAL_VERSIONS = {
  privacyPolicy: '1.0',
  terms: '1.0'
};

export const LEGAL_DOCUMENTS = {
  privacy: {
    title: 'Privacy Policy',
    version: LEGAL_VERSIONS.privacyPolicy,
    sections: [
      ['Data We Collect', 'VERTEX collects account details, authentication data, project activity, wallet records, rankings, notifications, and security audit information needed to operate the platform.'],
      ['How We Use Data', 'We use this information to provide authentication, projects, rankings, wallet features, fraud prevention, support, compliance, and platform security.'],
      ['Data Sharing', 'We do not sell personal data. We share data only with service providers, payment processors, security vendors, and legal authorities when required.'],
      ['User Rights', 'Users may request access, correction, or deletion of eligible personal data, subject to legal and operational retention requirements.']
    ]
  },
  terms: {
    title: 'Terms & Conditions',
    version: LEGAL_VERSIONS.terms,
    sections: [
      ['Eligibility', 'You must be at least 18 years old and legally able to enter binding agreements to use VERTEX.'],
      ['Platform Rules', 'You agree to provide accurate information, protect your account, submit lawful work, and avoid fraud, abuse, or unauthorized access.'],
      ['Payments and Wallet', 'Coins, wallet balances, rewards, and withdrawals are subject to verification, platform rules, and applicable payment provider requirements.'],
      ['Account Enforcement', 'VERTEX may suspend or restrict accounts that violate these terms, create risk, or fail required verification checks.']
    ]
  }
};
