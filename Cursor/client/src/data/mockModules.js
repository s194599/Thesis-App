// Sample module data for development and testing
const mockModules = [
  {
    id: "module1",
    title: "Kapitel 1: Litteratur i romantikken",
    subtitle: "Litteraturhistorie",
    date: "Uge 1-2",
    description: "Introduktion til romantikkens litteratur og de vigtigste forfattere fra perioden.",
    activities: [
      {
        id: "act1_1",
        title: "Planet over profit - Youtube",
        type: "youtube",
        url: "https://www.youtube.com/watch?v=WxynDU8k60g&ab_channel=PlanetOverProfit",
        completed: true
      },
      {
        id: "act1_2",
        title: "Hvad er lyrik",
        type: "word",
        url: "/api/uploads/lyrik_guide.docx",
        completed: false
      },
      {
        id: "act1_3",
        title: "Ode til døden",
        type: "pdf",
        url: "http://localhost:5001/direct-file/special_test.pdf",
        completed: false,
        isNew: true
      }
    ]
  },
  {
    id: "module2",
    title: "Kapitel 2: Sproganalyse",
    subtitle: "Sproglig analyse",
    date: "Uge 3-4",
    description: "Metoder til analyse af sprog i litterære tekster.",
    activities: [
      {
        id: "act2_1",
        title: "Introduktion til sproganalyse",
        type: "pdf",
        url: "/api/uploads/sproganalyse_intro.pdf",
        completed: false
      },
      {
        id: "act2_2",
        title: "Øvelse 1: Find sproglige virkemidler",
        type: "word",
        url: "/api/uploads/oevelse1.docx",
        completed: false
      },
      {
        id: "act2_3",
        title: "Quiz om sproglige virkemidler",
        type: "quiz",
        url: "/take-quiz/quiz123",
        completed: false
      }
    ]
  },
  {
    id: "module3",
    title: "Kapitel 3: Medieanalyse",
    subtitle: "Digitale medier",
    date: "Uge 5-6",
    description: "Analyse af forskellige medietyper i moderne kommunikation.",
    activities: [
      {
        id: "act3_1",
        title: "Sociale mediers indflydelse",
        type: "youtube",
        url: "https://www.youtube.com/watch?v=example",
        completed: false
      },
      {
        id: "act3_2",
        title: "Medieanalyse metoder",
        type: "pdf",
        url: "/api/uploads/medieanalyse.pdf",
        completed: false
      }
    ]
  }
];

export default mockModules; 