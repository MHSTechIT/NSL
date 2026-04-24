import { createContext, useContext, useReducer, useEffect } from 'react';
import { parseUTMParams } from '../utils/utm';

const FunnelContext = createContext(null);

const initialState = {
  lang: 'english',
  navDirection: 'forward',
  sugarLevel: null,
  diabetesDuration: null,
  languageQualified: null,
  fullName: '',
  whatsappNumber: '',
  email: '',
  leadScore: null,
  utm: { utm_source: null, utm_campaign: null, utm_content: null, fbclid: null },
  webinarConfig: {
    next_webinar_at: null,
    backup_webinar_at: null,
    tuesday_whatsapp_link: null,
    friday_whatsapp_link: null,
    kill_switch: false,
  },
  webinarConfigLoading: true,
  webinarConfigError: null,
  whatsappGroupLink: null,
  submittedLeadId: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LANG':
      return { ...state, lang: action.payload };
    case 'SET_NAV_DIRECTION':
      return { ...state, navDirection: action.payload };
    case 'SET_SUGAR_LEVEL':
      return { ...state, sugarLevel: action.payload };
    case 'SET_DURATION':
      return { ...state, diabetesDuration: action.payload };
    case 'SET_LANGUAGE_QUALIFIED':
      return { ...state, languageQualified: action.payload };
    case 'SET_FORM_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_UTM':
      return { ...state, utm: action.payload };
    case 'SET_WEBINAR_CONFIG':
      return { ...state, webinarConfig: action.payload, webinarConfigLoading: false, webinarConfigError: null };
    case 'SET_WEBINAR_CONFIG_ERROR':
      return { ...state, webinarConfigLoading: false, webinarConfigError: action.payload };
    case 'SET_SUBMITTED':
      return {
        ...state,
        submittedLeadId: action.payload.leadId,
        leadScore: action.payload.leadScore,
        whatsappGroupLink: action.payload.whatsappGroupLink,
      };
    case 'RESET':
      return { ...initialState, lang: state.lang, utm: state.utm, webinarConfig: state.webinarConfig, webinarConfigLoading: false };
    default:
      return state;
  }
}

export function FunnelProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: 'SET_UTM', payload: parseUTMParams() });

    fetch('/api/webinar-config')
      .then(r => r.json())
      .then(data => dispatch({ type: 'SET_WEBINAR_CONFIG', payload: data }))
      .catch(err => dispatch({ type: 'SET_WEBINAR_CONFIG_ERROR', payload: err.message }));
  }, []);

  return (
    <FunnelContext.Provider value={{ state, dispatch }}>
      {children}
    </FunnelContext.Provider>
  );
}

export function useFunnel() {
  return useContext(FunnelContext);
}
