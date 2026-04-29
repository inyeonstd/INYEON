// Mock que simula la respuesta que daría Supabase
// Útil para desarrollar sin tener que poblar la BD primero
export const MOCK_EVENT = {
  id: 'mock-1',
  slug: 'demo-sofia-roberto',
  type: 'wedding',
  status: 'published',
  title: 'Sofía & Roberto',
  subtitle: 'Una unión',
  event_date: '2026-11-25T19:00:00-06:00',
  cover_image_url:
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
  palette: { primary: '#161514', secondary: '#B8593A', accent: '#F2EDE3' },
  sections: [
    {
      type: 'parents',
      order_index: 0,
      content: {
        bride: ['Daniela González Rodríguez', 'Sergio Cavazos Pérez'],
        groom: ['María López Cantú', 'Roberto García Lozano'],
      },
    },
    {
      type: 'ceremony',
      order_index: 1,
      content: {
        number: 'I',
        venue: 'Catedral Metropolitana',
        address: 'Juan Zuazua 1100 Sur, Centro',
        time: '19:00',
        maps_url: 'https://goo.gl/maps/6un56qQJcjfoRFDq9',
      },
    },
    {
      type: 'reception',
      order_index: 2,
      content: {
        number: 'II',
        venue: 'Horno 2 — Parque Fundidora',
        address: 'Av. Fundidora s/n, Fundidora',
        time: '21:00',
        maps_url: 'https://goo.gl/maps/6un56qQJcjfoRFDq9',
      },
    },
    {
      type: 'itinerary',
      order_index: 3,
      content: {
        items: [
          { time: '18:00', label: 'Civil' },
          { time: '19:00', label: 'Misa' },
          { time: '20:00', label: 'Cóctel' },
          { time: '21:00', label: 'Vals' },
          { time: '21:30', label: 'Cena' },
          { time: '22:30', label: 'Fiesta' },
        ],
      },
    },
    {
      type: 'registry',
      order_index: 4,
      content: {
        items: [
          { name: 'Liverpool', code: 'Núm. 51244892', url: '#' },
          { name: 'Amazon', code: 'Lista compartida', url: '#' },
        ],
      },
    },
    {
      type: 'lodging',
      order_index: 5,
      content: {
        name: 'Hilton Monterrey',
        address: 'Av. Fundadores 1000, Valle del Mirador',
        code: 'INYEON26',
      },
    },
  ],
  gallery: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop',
  ],
}
