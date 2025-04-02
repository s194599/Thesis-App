// Sample module data for development and testing
const mockModules = [
  {
    id: 'module-1',
    title: 'Forløb#3 Dokumentarforløb',
    date: 'ti 27/8',
    description: 'Vi fortsætter arbejdet med Ørneflugt. Se nedenfor, hvilken gruppe du er i. Alle skal læse side 2 øverst om "historisk læsning" og om "queer-læsning" s. 4.',
    activities: [
      {
        id: 'activity-1-1',
        title: 'Planet over profit - Youtube',
        description: 'https://www.youtube.com/watch?v=wXynD08k60g&ab_channel=PlanetOverProfit',
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=wXynD08k60g',
        completed: true
      },
      {
        id: 'activity-1-2',
        title: 'Hvad er lyrik',
        description: 'Word dokument om lyriske virkemidler',
        type: 'word',
        url: null,
        completed: false
      },
      {
        id: 'activity-1-3',
        title: 'Ode til døden',
        type: 'pdf',
        url: '/documents/ode-til-doden.pdf',
        completed: true
      }
    ]
  },
  {
    id: 'module-2',
    title: 'Skriveforløb - Modul 2',
    date: 'ti 20/8',
    subtitle: 'Skrivemodul 2',
    description: 'I dette forløb skal vi arbejde med forskellige skriveteknikker.',
    activities: [
      {
        id: 'activity-2-1',
        title: 'Kreativ skrivning intro',
        type: 'pdf',
        url: '/documents/kreativ-skrivning.pdf',
        completed: true
      },
      {
        id: 'activity-2-2',
        title: 'Skriveopgave #1',
        description: 'Personkarakteristik - aflevering',
        type: 'word',
        url: null,
        completed: true
      }
    ]
  },
  {
    id: 'module-3',
    title: 'Analysemetoder - Modul 3',
    date: 'fr 23/8',
    subtitle: 'Skrivemodul 2',
    description: 'Gennemgang af forskellige analysemetoder.',
    activities: [
      {
        id: 'activity-3-1',
        title: 'Litterær analyse metode',
        type: 'pdf',
        url: '/documents/litteraer-analyse.pdf',
        completed: true
      },
      {
        id: 'activity-3-2',
        title: 'Eksempel på analyse',
        type: 'word',
        url: null,
        completed: true
      }
    ]
  },
  {
    id: 'module-4',
    title: 'Moderne litteratur',
    date: 'ma 26/8',
    description: 'Gennemgang af moderne litterære strømninger.',
    activities: [
      {
        id: 'activity-4-1',
        title: 'Introduktion til postmodernisme',
        type: 'pdf',
        url: '/documents/postmodernisme.pdf',
        completed: false
      },
      {
        id: 'activity-4-2',
        title: 'Eksempler på postmoderne litteratur',
        type: 'word',
        url: null,
        completed: false
      }
    ]
  },
  {
    id: 'module-5',
    title: 'Medieanalyse: Film og TV',
    date: 'to 29/8',
    description: 'Vi skal arbejde med filmanalyse og medieforståelse.',
    activities: [
      {
        id: 'activity-5-1',
        title: 'Filmanalyse - grundbegreber',
        type: 'pdf',
        url: '/documents/filmanalyse.pdf',
        completed: false
      },
      {
        id: 'activity-5-2',
        title: 'Film Techniques & Elements',
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=9Hz47wv3aJw',
        completed: false
      },
      {
        id: 'activity-5-3',
        title: 'Analysemodel - skema',
        type: 'word',
        url: null,
        completed: false
      }
    ]
  },
  {
    id: 'module-6',
    title: 'Fortælleteknik',
    date: 'fr 30/8',
    description: 'Gennemgang af forskellige fortælleteknikker i litteratur og film.',
    activities: [
      {
        id: 'activity-6-1',
        title: 'Fortælleteknik og synsvinkler',
        type: 'pdf',
        url: '/documents/fortaelleteknik.pdf',
        completed: false
      },
      {
        id: 'activity-6-2',
        title: 'Øvelser i synsvinkler',
        type: 'word',
        url: null,
        completed: false
      }
    ]
  },
  {
    id: 'module-7',
    title: 'Essayskrivning',
    date: 'ti 02/09',
    description: 'Fokus på essaygenren og dens kendetegn.',
    activities: [
      {
        id: 'activity-7-1',
        title: 'Essayets kendetegn',
        type: 'pdf',
        url: '/documents/essay-kendetegn.pdf',
        completed: false
      },
      {
        id: 'activity-7-2',
        title: 'Eksempel på essay',
        type: 'pdf',
        url: '/documents/essay-eksempel.pdf',
        completed: false
      },
      {
        id: 'activity-7-3',
        title: 'Essayskrivning - opgave',
        type: 'word',
        url: null,
        completed: false
      }
    ]
  },
  {
    id: 'module-8',
    title: 'Mundtlig formidling',
    date: 'fr 06/09',
    description: 'Fokus på mundtlig fremstilling og præsentationsteknik.',
    activities: [
      {
        id: 'activity-8-1',
        title: 'Retorikkens grundbegreber',
        type: 'pdf',
        url: '/documents/retorik.pdf',
        completed: false
      },
      {
        id: 'activity-8-2',
        title: 'Præsentationsteknik - tips',
        type: 'word',
        url: null,
        completed: false
      },
      {
        id: 'activity-8-3',
        title: 'TED Talk: How to speak so that people want to listen',
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=eIho2S0ZahI',
        completed: false
      }
    ]
  },
  {
    id: 'module-9',
    title: 'Afsluttende projekt',
    date: 'to 12/09',
    description: 'Introduktion til afsluttende projekt og forventninger.',
    activities: [
      {
        id: 'activity-9-1',
        title: 'Projektbeskrivelse',
        type: 'pdf',
        url: '/documents/projekt-beskrivelse.pdf',
        completed: false
      },
      {
        id: 'activity-9-2',
        title: 'Vurderingskriterier',
        type: 'word',
        url: null,
        completed: false
      },
      {
        id: 'activity-9-3',
        title: 'Afleveringsguide',
        type: 'pdf',
        url: '/documents/afleverings-guide.pdf',
        completed: false
      }
    ]
  }
];

export default mockModules; 