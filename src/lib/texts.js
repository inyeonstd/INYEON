export const DEFAULT_TEXTS = {
  hero_label: 'Una invitación',
  hero_label_for_guest: 'Para {name}',
  hero_scroll: 'Desplázate',
  countdown_days: 'Días',
  countdown_hours: 'Hrs',
  countdown_minutes: 'Min',
  countdown_seconds: 'Seg',

  parents_label: 'Con la bendición de',
  parents_headline:
    'Con la bendición de Dios y el amor de nuestros padres, tenemos el honor de invitarte a celebrar nuestra unión.',
  parents_bride_label: 'Padres de la novia',
  parents_groom_label: 'Padres del novio',

  events_label: 'Programa',
  events_headline: 'Dos actos.',
  events_kind_ceremony: 'Ceremonia',
  events_kind_reception: 'Recepción',
  events_time_label: 'Hora',
  events_cta: 'Cómo llegar',

  itinerary_label: 'Itinerario',
  itinerary_headline_top: 'La noche, hora',
  itinerary_headline_bottom: 'por hora.',

  registry_label: 'Mesa de regalos',
  registry_headline:
    'Tu presencia es nuestro mejor regalo. Si deseas obsequiarnos algo, aquí dos opciones.',
  registry_cta: 'Ver lista ↗',

  lodging_label: 'Hospedaje',
  lodging_code_label: 'Código de reservación',
  lodging_code_hint:
    'Menciona este código al reservar para acceder a la tarifa especial.',

  dresscode_label: 'Código de vestimenta',
  dresscode_headline: 'Cómo vestir.',
  dresscode_intro:
    'Algunas referencias para que llegues con el look ideal. Da click para inspirarte.',
  dresscode_cta: 'Ver referencia ↗',

  gallery_label: 'Galería',
  gallery_headline: 'Fragmentos.',

  closing_greeting: 'Te esperamos',
  closing_countdown_prefix: 'Faltan',
  closing_countdown_unit: 'días',
  closing_cta: 'Confirmar asistencia',

  footer_brand: 'Inyeon',
  footer_signature: 'Hecha con',
}

export function tx(event, key) {
  return event?.texts?.[key] ?? DEFAULT_TEXTS[key] ?? ''
}

export function fmt(template, vars) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, k) =>
    vars?.[k] != null ? String(vars[k]) : ''
  )
}
