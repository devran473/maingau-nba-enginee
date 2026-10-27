export interface CustomerNBA {
  customer_id: string;
  name: string;
  city: string;
  birth_year: number;
  customer_since: string;
  active_lines: string[];
  clv_eur: number;
  churn_prob: number;
  churn_drivers: string[];
  dunning_level: number;
  has_open_complaint: boolean;
  consents: {
    marketing_email: boolean;
    portal_app: boolean;
    profiling: boolean;
    phone: boolean;
  };
  current_nba: {
    product_id: string;
    product_name: string;
    action_type: 'sales' | 'retention' | 'service' | 'upsell';
    channel: 'email' | 'portal_popup' | 'agent_phone' | 'app_push' | 'none';
    tone: 'Du' | 'Sie';
    tone_confidence: number;
    delta_clv_eur: number;
    reason: string;
    blocked_by_hard_rule?: string;
  };
}

export interface StreamEvent {
  event_id: string;
  timestamp: string;
  customer_id: string;
  event_type: 'gas_meter_deregistered' | 'charge_failed_third_time' | 'consent_withdrawn' | 'complaint_created';
  description: string;
  impact_description: string;
  nba_after_event: CustomerNBA['current_nba'];
  churn_after_event: number;
}

export const INITIAL_CUSTOMERS: CustomerNBA[] = [
  {
    customer_id: "MG-100004",
    name: "Maximilian Weber",
    city: "Darmstadt",
    birth_year: 1997,
    customer_since: "2019-08-23",
    active_lines: ["Strom"],
    clv_eur: 167,
    churn_prob: 0.38,
    churn_drivers: ["Offene Beschwerde", "Mahnstufe 2", "2 Tickets in 12M"],
    dunning_level: 2,
    has_open_complaint: true,
    consents: { marketing_email: true, portal_app: true, profiling: true, phone: false },
    current_nba: {
      product_id: "P-SV-01",
      product_name: "Service-Klärung & Mahnstopp",
      action_type: "service",
      channel: "portal_popup",
      tone: "Sie",
      tone_confidence: 96,
      delta_clv_eur: 120,
      reason: "Mahnstufe 2 & offenes Ticket blockieren Vertrieb. Churn-Prävention durch Klärung vor weiterem Mahnlauf.",
      blocked_by_hard_rule: "Sales geblockt: Dunning Level >= 2 und offene Beschwerde."
    }
  },
  {
    customer_id: "MG-100027",
    name: "Laura Schmidt",
    city: "Frankfurt",
    birth_year: 1993,
    customer_since: "2021-04-12",
    active_lines: ["Strom"],
    clv_eur: 640,
    churn_prob: 0.24,
    churn_drivers: ["Preisgarantie endet in 45 Tagen"],
    dunning_level: 0,
    has_open_complaint: false,
    consents: { marketing_email: true, portal_app: true, profiling: true, phone: false },
    current_nba: {
      product_id: "P-EN-02",
      product_name: "StromGarant 24M",
      action_type: "retention",
      channel: "email",
      tone: "Du",
      tone_confidence: 88,
      delta_clv_eur: 185,
      reason: "Preisgarantie läuft aus. Retention sichert 24 Monate Deckungsbeitrag und senkt Churn um 10%."
    }
  },
  {
    customer_id: "MG-100086",
    name: "Dr. Klaus Hoffmann",
    city: "Köln",
    birth_year: 1968,
    customer_since: "2017-02-15",
    active_lines: ["Gas", "Strom"],
    clv_eur: 1420,
    churn_prob: 0.11,
    churn_drivers: ["Keine"],
    dunning_level: 0,
    has_open_complaint: false,
    consents: { marketing_email: false, portal_app: true, profiling: true, phone: true },
    current_nba: {
      product_id: "P-SH-03",
      product_name: "Smarte Thermostate",
      action_type: "sales",
      channel: "portal_popup",
      tone: "Sie",
      tone_confidence: 99,
      delta_clv_eur: 45,
      reason: "Gaskunde ohne E-Mail-Consent. Ausspielung im Kundenportal zur Effizienzsteigerung."
    }
  },
  {
    customer_id: "MG-100142",
    name: "Sarah Lindemann",
    city: "Mainz",
    birth_year: 1990,
    customer_since: "2023-11-01",
    active_lines: ["Autostrom"],
    clv_eur: 310,
    churn_prob: 0.19,
    churn_drivers: ["1 fehlgeschlagene Ladung"],
    dunning_level: 0,
    has_open_complaint: false,
    consents: { marketing_email: true, portal_app: true, profiling: true, phone: true },
    current_nba: {
      product_id: "P-EN-01",
      product_name: "StromAktiv für Zuhause",
      action_type: "sales",
      channel: "email",
      tone: "Du",
      tone_confidence: 85,
      delta_clv_eur: 114,
      reason: "Reiner Autostrom-Kunde mit hoher Ladeaktivität. Cross-Sell für Haushaltsstrom."
    }
  },
  {
    customer_id: "MG-100215",
    name: "Thomas Becker",
    city: "Offenbach",
    birth_year: 1974,
    customer_since: "2018-06-10",
    active_lines: ["Strom", "Mobilfunk"],
    clv_eur: 1890,
    churn_prob: 0.08,
    churn_drivers: ["Keine (Multi-Product)"],
    dunning_level: 0,
    has_open_complaint: false,
    consents: { marketing_email: true, portal_app: true, profiling: true, phone: false },
    current_nba: {
      product_id: "P-SL-01",
      product_name: "HEMS Starter-Set",
      action_type: "sales",
      channel: "email",
      tone: "Sie",
      tone_confidence: 92,
      delta_clv_eur: 240,
      reason: "Prosumer mit PV-Einspeisung identifiziert. HEMS steigert Kundenbindung und Marge."
    }
  },
  {
    customer_id: "MG-100305",
    name: "Elena Rostova",
    city: "Wiesbaden",
    birth_year: 1988,
    customer_since: "2022-01-20",
    active_lines: ["Strom", "Mobilfunk"],
    clv_eur: 950,
    churn_prob: 0.12,
    churn_drivers: ["Keine"],
    dunning_level: 0,
    has_open_complaint: false,
    consents: { marketing_email: false, portal_app: true, profiling: true, phone: false },
    current_nba: {
      product_id: "P-MO-02",
      product_name: "Mobilfunk Daten-Upgrade",
      action_type: "upsell",
      channel: "portal_popup",
      tone: "Du",
      tone_confidence: 90,
      delta_clv_eur: 78,
      reason: "Datenvolumen 3 Monate in Folge aufgebraucht. E-Mail gesperrt (Opt-out), daher Portal-Hinweis."
    }
  }
];

export const REPLAY_EVENTS: StreamEvent[] = [
  {
    event_id: "EVT-9001",
    timestamp: "2026-10-01 10:14:22",
    customer_id: "MG-100086",
    event_type: "gas_meter_deregistered",
    description: "Gasnetzbetreiber meldet Zählerstilllegung (terminated_meter_deregistration).",
    impact_description: "Kunde wechselt auf Wärmepumpe! Gas-Produkt entfällt. Hoher Strombedarf erwartet.",
    churn_after_event: 0.28,
    nba_after_event: {
      product_id: "P-EN-03",
      product_name: "StromWärme (Wärmepumpen-Tarif)",
      action_type: "sales",
      channel: "portal_popup",
      tone: "Sie",
      tone_confidence: 99,
      delta_clv_eur: 340,
      reason: "Ereignis: Gaszähler abgemeldet. Sofortiger Cross-Sell für vergünstigten Wärmepumpenstrom."
    }
  },
  {
    event_id: "EVT-9002",
    timestamp: "2026-10-01 11:05:00",
    customer_id: "MG-100142",
    event_type: "charge_failed_third_time",
    description: "3. Ladeabbruch innerhalb von 14 Tagen an Roaming-Säule (Fehlercode: RFID_AUTH_TIMEOUT).",
    impact_description: "Akute Churn-Gefahr! Churn-Risiko steigt um +10%. Vertriebsaktionen sofort gesperrt.",
    churn_after_event: 0.29,
    nba_after_event: {
      product_id: "P-SV-01",
      product_name: "Service: Ladekarte prüfen & Ersatzkarte senden",
      action_type: "service",
      channel: "agent_phone",
      tone: "Du",
      tone_confidence: 85,
      delta_clv_eur: 95,
      reason: "Kritischer Ladefehler. Churn-Prävention durch proaktiven Service-Kontakt statt Haushaltsstrom-Verkauf.",
      blocked_by_hard_rule: "Sales geblockt: Häufung von technischen Ladefehlern."
    }
  },
  {
    event_id: "EVT-9003",
    timestamp: "2026-10-01 11:42:15",
    customer_id: "MG-100027",
    event_type: "consent_withdrawn",
    description: "Kunde klickt im Newsletter-Footer auf 'Abmelden' (marketing_email -> withdrawn).",
    impact_description: "Art. 6 DSGVO: E-Mail-Versand augenblicklich blockiert. Kanal wechselt auf In-App / Portal.",
    churn_after_event: 0.24,
    nba_after_event: {
      product_id: "P-EN-02",
      product_name: "StromGarant 24M",
      action_type: "retention",
      channel: "portal_popup",
      tone: "Du",
      tone_confidence: 88,
      delta_clv_eur: 185,
      reason: "E-Mail-Einwilligung widerrufen. Kanal-Fallback auf Portal-Pop-up aktiviert."
    }
  }
];