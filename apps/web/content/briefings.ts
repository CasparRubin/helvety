/** A person named on the source, with the role their own page states. */
export type BriefingPerson = {
  name: string;
  detail: string;
  url: string;
};

/** One comment worth reporting from the Hacker News thread. */
type ThreadNote = {
  commentUrl: string;
  by: string;
  line: string;
  links?: { label: string; url: string }[];
};

/** Platform URLs, present only after a video is posted. */
export type BriefingPlatforms = {
  youtube?: string;
  instagram?: string;
  facebook?: string;
};

/** One published briefing. The spoken lines and this page use the same sentences. */
export type Briefing = {
  slug: string;
  kicker: string;
  subject: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  lines: readonly string[];
  source: { title: string; url: string; hnUrl?: string };
  people?: readonly BriefingPerson[];
  platforms?: BriefingPlatforms;
  threadNotes?: readonly ThreadNote[];
};

export const BRIEFINGS: readonly Briefing[] = [
  {
    slug: "energy-based-reasoners-duke-uiuc-harvard-reports-1-8-million-parameters-99-9-percent-sudoku-extreme-345-times-less-inference-compute",
    kicker: "Models",
    subject: "Energy-based reasoners",
    date: "2026-11-18",
    lines: [
      "Researchers at Duke, the University of Illinois Urbana-Champaign, and Harvard report a model with 1.8 million parameters, the numbers inside it that shape each answer.",
      "They report 99.9 percent on Sudoku-Extreme, a test made of very hard Sudoku puzzles.",
      "The authors say this uses about 345 times less inference compute than the next best. Inference means producing an answer, not training the model.",
      "They describe each step as walking downhill on an energy score, a number that is lower when the puzzle looks more solved, and stopping when the slope goes flat.",
    ],
    source: {
      title: "Energy-Based Reasoners",
      url: "https://energy-based-reasoners.github.io/",
      hnUrl: "https://news.ycombinator.com/item?id=50543989",
    },
    people: [
      {
        name: "William Xingxu Chen",
        detail:
          "The paper lists him first, at Duke University. His site says he is a senior there studying mathematics and computer science, working on generative models and reasoning, advised by Alexi Gladstone and Xiang Cheng.",
        url: "https://wwillchen.github.io/",
      },
      {
        name: "Alexi Gladstone",
        detail:
          "The paper lists him at UIUC. His site says he is a computer science PhD candidate there, advised by Heng Ji and co-advised by Tong Zhang, and that he holds an NSF Graduate Research Fellowship. The paper's acknowledgements say that fellowship supports him.",
        url: "https://alexiglad.github.io/",
      },
      {
        name: "Zeyu Michael Li",
        detail:
          "The paper lists him at Duke University. His site says he is a PhD student in electrical and computer engineering there, advised by Xiang Cheng, working on diffusion and flow-matching models.",
        url: "https://lizeyu090312.github.io/",
      },
      {
        name: "Heng Ji",
        detail:
          "The paper lists her at UIUC. The Coordinated Science Laboratory lists her as a professor of computer science at the University of Illinois Urbana-Champaign. That page says her research is natural language processing.",
        url: "https://csl.illinois.edu/directory/faculty/hengji",
      },
      {
        name: "Yilun Du",
        detail:
          "The paper lists him at Harvard University. The Kempner Institute lists him as an assistant professor of computer science and an institute investigator. It says his work is on generative models for reasoning and decision making, and that he previously worked as a research scientist at Google DeepMind and as a research fellow at OpenAI.",
        url: "https://kempnerinstitute.harvard.edu/people/our-people/yilun-du/",
      },
    ],
    threadNotes: [
      {
        by: "saithound",
        commentUrl: "https://news.ycombinator.com/item?id=50544356",
        line: 'says 385× is a small multiple beside another paper on classical energies, and that "reasoning" here is a generous definition.',
        links: [
          {
            label: "Classical energies paper",
            url: "https://arxiv.org/abs/2611.17309",
          },
        ],
      },
      {
        by: "mocmoc",
        commentUrl: "https://news.ycombinator.com/item?id=50546168",
        line: "writes that energy-based models are hard to train and niche-specific, and that a Sudoku result at this scale does not show they scale.",
      },
      {
        by: "program_whiz",
        commentUrl: "https://news.ycombinator.com/item?id=50545736",
        line: "describes a Sudoku reading of the method: conflicting cells get higher energy and are changed first.",
      },
    ],
  },
];

/** Look up one briefing by its public slug. */
export function getBriefing(slug: string): Briefing | undefined {
  return BRIEFINGS.find((briefing) => briefing.slug === slug);
}
