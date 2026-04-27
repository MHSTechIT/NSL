const fbq = (...args) => typeof window !== 'undefined' && window.fbq && window.fbq(...args);

export const pixelPageView = () => fbq('track', 'PageView');
export const pixelViewContent = (utmParams) => fbq('track', 'ViewContent', { content_name: 'diabetes_landing_hero', ...utmParams });
export const pixelInitiateQualification = (utmParams) => fbq('trackCustom', 'InitiateQualification', utmParams);
export const pixelSugarLevelSelected = (level) => fbq('trackCustom', 'SugarLevelSelected', { sugar_level: level });
export const pixelDisqualifiedLead = (reason, extra = {}) => fbq('trackCustom', 'Disqualified_Lead', { reason, ...extra });
export const pixelLanguageQualified = () => fbq('trackCustom', 'LanguageQualified');
export const pixelDurationSelected = (duration, score) => fbq('trackCustom', 'DiabetesDurationSelected', { duration, lead_score: score });
export const pixelInitiateRegistration = () => fbq('trackCustom', 'InitiateRegistration');
export const pixelLead = (userData) => fbq('track', 'Lead', userData);
export const pixelCompleteRegistration = (userData) => fbq('track', 'CompleteRegistration', userData);
export const pixelPurchase = (leadScore) => fbq('track', 'Purchase', { value: 1, currency: 'INR', lead_score: leadScore });
export const pixelGroupJoinInitiated = () => fbq('trackCustom', 'GroupJoinInitiated');
export const pixelFormAbandoned = () => fbq('trackCustom', 'FormAbandoned');
export const pixelBackNavigation = () => fbq('trackCustom', 'BackNavigation');
