export interface NarrativeEvent {
  level: number;
  trigger: 'enter' | 'first_kill' | 'find_item' | 'boss';
  text: string;
  color: string;
}

export const NARRATIVE_EVENTS: NarrativeEvent[] = [
  // Nivel 1 - Despertar con amnesia
  {
    level: 1,
    trigger: 'enter',
    text: 'Despiertas en la oscuridad... No recuerdas quién eres ni cómo llegaste aquí.',
    color: '#aaaaaa'
  },
  {
    level: 1,
    trigger: 'first_kill',
    text: 'La criatura cae. Fragmentos de memoria... ¿una batalla? ¿una traición?',
    color: '#8888cc'
  },
  {
    level: 1,
    trigger: 'find_item',
    text: 'Encuentras un objeto. Tu mano lo reconoce, pero tu mente no.',
    color: '#88cc88'
  },
  
  // Nivel 2 - Primeros recuerdos
  {
    level: 2,
    trigger: 'enter',
    text: 'Las sombras susurran tu nombre... ¿o es solo el viento?',
    color: '#aaaaaa'
  },
  {
    level: 2,
    trigger: 'first_kill',
    text: 'Recuerdas una espada. Una batalla en un puente. ¿Defendías algo?',
    color: '#8888cc'
  },
  
  // Nivel 3 - Revelaciones
  {
    level: 3,
    trigger: 'enter',
    text: 'Este lugar... lo conoces. Una fortaleza. ¿La tuya?',
    color: '#aaaaaa'
  },
  {
    level: 3,
    trigger: 'first_kill',
    text: '¡Recuerdas! Eras un guardián. Protegías el Sello Oscuro.',
    color: '#cccc44'
  },
  
  // Nivel 4 - La verdad emerge
  {
    level: 4,
    trigger: 'enter',
    text: 'El Sello se rompió. Tú caíste luchando contra la oscuridad.',
    color: '#cc8844'
  },
  {
    level: 4,
    trigger: 'first_kill',
    text: 'Estas criaturas... escaparon del Sello. Debes detenerlas.',
    color: '#cc4444'
  },
  
  // Nivel 5 - Determinación
  {
    level: 5,
    trigger: 'enter',
    text: 'Ahora recuerdas todo. Tu misión. Tu sacrificio. Tu nombre.',
    color: '#ffffff'
  },
  {
    level: 5,
    trigger: 'first_kill',
    text: 'Cada criatura derrotada debilita la oscuridad. Sigue adelante.',
    color: '#44cc44'
  },
  
  // Nivel 6 - El pasado completo
  {
    level: 6,
    trigger: 'enter',
    text: 'El corazón de la fortaleza. Aquí sellaste al Demonio Ancestral.',
    color: '#ffaa44'
  },
  {
    level: 6,
    trigger: 'first_kill',
    text: 'Su poder corrompe todo. Debes llegar al núcleo.',
    color: '#ff8844'
  },
  
  // Nivel 7+ - Preparación final
  {
    level: 7,
    trigger: 'enter',
    text: 'Puedes sentirlo... el Demonio Ancestral está cerca.',
    color: '#ff4444'
  },
  {
    level: 7,
    trigger: 'first_kill',
    text: 'Tu destino se acerca. ¿Podrás sellarlo nuevamente?',
    color: '#ff4444'
  },
];

export function getNarrativeEvent(level: number, trigger: 'enter' | 'first_kill' | 'find_item' | 'boss'): NarrativeEvent | null {
  return NARRATIVE_EVENTS.find(e => e.level === level && e.trigger === trigger) || null;
}
