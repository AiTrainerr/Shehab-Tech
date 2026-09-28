export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

export interface Dictionary {
  common: {
    siteName: string;
    tagline: string;
    login: string;
    register: string;
    logout: string;
    dashboard: string;
    projects: string;
    achievements: string;
    home: string;
    about: string;
    contact: string;
    language: string;
    switchLanguage: string;
    arabic: string;
    english: string;
    loading: string;
    save: string;
    cancel: string;
    error: string;
    success: string;
  };
  nav: {
    adminDashboard: string;
    freelancerDashboard: string;
    companyProfile: string;
    browseTasks: string;
    joinExpert: string;
  };
  status: {
    pending: string;
    working: string;
    underReview: string;
    finalReview: string;
    approved: string;
    paid: string;
    rejected: string;
    completed: string;
    cancelled: string;
  };
  home: {
    badge: string;
    titlePart1: string;
    titlePart2: string;
    subtitle: string;
    ctaJoin: string;
    ctaBrowse: string;
    quickSwitch: string;
    trustPillars: {
      qc: string;
      security: string;
      languages: string;
    };
    stats: {
      experts: string;
      languages: string;
      projects: string;
      qcStages: string;
    };
    services: {
      sectionTitle: string;
      sectionSubtitle: string;
      audioTitle: string;
      audioDesc: string;
      transcriptionTitle: string;
      transcriptionDesc: string;
      annotationTitle: string;
      annotationDesc: string;
      customDataTitle: string;
      customDataDesc: string;
    };
    steps: {
      sectionTitle: string;
      sectionSubtitle: string;
      step1Title: string;
      step1Desc: string;
      step2Title: string;
      step2Desc: string;
      step3Title: string;
      step3Desc: string;
    };
    quality: {
      sectionTitle: string;
      sectionSubtitle: string;
      qcTitle: string;
      qcDesc: string;
      securityTitle: string;
      securityDesc: string;
      infrastructureTitle: string;
      infrastructureDesc: string;
    };
    contact: {
      sectionTitle: string;
      sectionSubtitle: string;
      directHeading: string;
      founderRole: string;
      emailLabel: string;
      phoneLabel: string;
      wechatLabel: string;
      joinAsContributor: string;
      requestCustomData: string;
    };
  };
}
