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
}
