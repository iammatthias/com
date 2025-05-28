// Utility for automatically linking references in chat responses

interface LinkPattern {
  pattern: RegExp;
  replacement: (match: string, ...groups: string[]) => string;
}

// Common tag patterns that should be linked
const TAG_PATTERNS = [
  "ai",
  "automation",
  "analytics",
  "astro",
  "blockchain",
  "bluesky",
  "baking",
  "cocktails",
  "conversion-optimization",
  "crypto",
  "deployment",
  "development",
  "e-commerce",
  "farcaster",
  "growth-engineering",
  "marketing",
  "nextjs",
  "obsidian",
  "onchain",
  "photography",
  "pizza",
  "recipe",
  "spice",
  "web3",
  "workflow",
];

// Content type patterns
const CONTENT_PATTERNS = ["posts", "recipes", "art", "open-source"];

// Actual content mappings with full slugs (based on real site structure)
const RECIPE_MAPPINGS: Record<string, string> = {
  challah: "1602505860000-challah",
  goulash: "1602522360000-goulash",
  "beef stroganoff": "1602523680000-beef-stroganoff",
  "crab cakes": "1602523740000-crab-cakes",
  "yorkshire pudding": "1602523860000-yorkshire-pudding",
  "saag palak paneer": "1640442840000-saag-palak-paneer",
  eggnog: "1670140800000-eggnog",
  "bermuda hundred": "1709064533452-bermuda-hundred",
  "creamy bell pepper alfredo sauce": "1709406325649-creamy-bell-pepper-alfredo-sauce",
  "pizza dough": "1710031406664-pizza-dough",
  "pizza sauce": "1710031949965-pizza-sauce",
  "pizza margherita": "1710032637430-pizza-margherita",
  "pineapple bourbon honey sour": "1710045021303-pineapple-bourbon-honey-sour",
  harissa: "1710443206146-harissa",
  "caramel apple mille-feuille": "1710563320517-caramel-apple-mille-feuille",
  "fermented hot honey": "1710564234519-fermented-hot-honey",
  halekulani: "1710564673473-halekulani",
  "espresso rum tiki": "1710564975345-espresso-rum-tiki",
  "irish maid": "1710565492602-irish-maid",
  "madison park smash": "1710776965449-madison-park-smash",
  siesta: "1711599203773-siesta",
  "thai curry sweet potato soup": "1713300772377-thai-curry-sweet-potato-soup",
  "vegetarian coconut curry ramen": "1714335695318-vegetarian-coconut-curry-ramen",
  "creamy honey cilantro dressing": "1717101197446-creamy-honey-cilantro-dressing",
  "summer chili two ways": "1717954493179-summer-chili-two-ways",
  "liliko'i rum punch medley": "1726330319079-liliko-i-rum-punch-medley",
  "honey liliko'i foam": "1726330512509-honey-liliko-i-foam",
  "mumbai street style vada pav": "1726417129936-mumbai-street-style-vada-pav",
  pavlova: "1726450168175-pavlova",
  "creme brulee": "1727460674219-creme-brulee",
  "spicy tom kha with char grilled pork loin": "1729456768249-spicy-tom-kha-with-char-grilled-pork-loin",
  "casts cocktails": "1739743574521-casts-cocktails",
  "nyc halal cart style beef lamb rice bowls": "1743442208161-nyc-halal-cart-style-beef-lamb-rice-bowls",
  "small batch croissant loaf": "1743442618201-small-batch-croissant-loaf",
};

const POST_MAPPINGS: Record<string, string> = {
  flatframe: "1563778800000-flatframe",
  sourdough: "1587970800000-sourdough",
  "case study aspiration": "1625156340000-case-study-aspiration",
  aspiration: "1625156340000-case-study-aspiration",
  "obsidian as a cms": "1670659200001-obsidian-as-a-cms",
  "the sovereign feed": "1672682867112-the-sovereign-feed",
  "sovereign feed": "1672682867112-the-sovereign-feed",
  "case study tornado": "1675271943000-case-study-tornado",
  tornado: "1675271943000-case-study-tornado",
  "ai legion on bluesky": "1681369200000-ai-legion-on-bluesky",
  "ai legion": "1681369200000-ai-legion-on-bluesky",
  "mint thyself": "1685948400001-mint-thyself",
  "feels like summer": "1687071600000-feels-like-summer",
  "deploy html on replit": "1691436904927-deploy-html-on-replit",
  "revisiting obsidian as a cms": "1699332127006-revisiting-obsidian-as-a-cms",
  "case study revance opul": "1709280000000-case-study-revance-opul",
  revance: "1709280000000-case-study-revance-opul",
  "revisiting obsidian as a cms again": "1710177704945-revisiting-obsidian-as-a-cms-again",
  "onchain hit counter": "1712329304675-onchain-hit-counter",
  "generate a new private key": "1712432046964-generate-a-new-private-key",
  "starting a spice company": "1720542994688-starting-a-spice-company",
  "case study ice barrel": "1728582380556-case-study-ice-barrel",
  "ice barrel": "1728582380556-case-study-ice-barrel",
  "ai tools that have caught my eye": "1731441554952-ai-tools-that-have-caught-my-eye",
  "shitposting towards a pizza oven": "1731475962422-shitposting-towards-a-pizza-oven",
  "pure internet": "1731955749292-pure-internet",
  "pure internet nfc": "1731984900000-pure-internet-nfc",
  "pure internet bluesky": "1732585567703-pure-internet-bluesky",
  "pure internet feral": "1733357455673-pure-internet-feral",
  test: "1734113731423-test",
  "pure internet office space": "1736536967495-pure-internet-office-space",
  "orbz dot com": "1736537615834-orbz-dot-com",
  "andreibot 3000": "1738693093717-andreibot-3000",
  "who really wants carbon offsets": "1738778326344-who-really-wants-carbon-offsets",
  "scalability buildability": "1739212426700-scalability-buildability",
  "pure internet no html": "1740682611811-pure-internet-no-html",
  "code and cloth": "1743724413087-code-and-cloth",
  "create and use farcaster signers": "1745543922514-create-and-use-farcaster-signers",
  "breaking the ai in parallax": "1746765173152-breaking-the-ai-in-parallax",
  "single origin deployment with bhvr": "1747182886660-single-origin-deployment-with-bhvr",
  bhvr: "1747182886660-single-origin-deployment-with-bhvr",
};

const ART_MAPPINGS: Record<string, string> = {
  epochs: "1709816319000-epochs",
  vsco: "1710822761635-vsco",
  "no stone unturned": "1710823985569-no-stone-unturned",
  "as above": "1710824280787-as-above",
  "broken glass": "1710824453471-broken-glass",
  "office space": "1738179906841-office-space",
  "flower dreams": "1738697966004-flower-dreams",
  "ocean dreams": "1738786576559-ocean-dreams",
};

const OPEN_SOURCE_MAPPINGS: Record<string, string> = {
  "obsidian pinata image uploader": "1744172723728-obsidian-pinata-image-uploader",
  "obsidian ai tagger": "1744172769110-obsidian-ai-tagger",
  "obsidian ai excerpt generator": "1744172798323-obsidian-ai-excerpt-generator",
  "llm fid txt": "1746490719151-llm-fid-txt",
};

export function addLinksToResponse(text: string): string {
  let linkedText = text;

  // Link patterns in order of specificity (most specific first)
  const linkPatterns: LinkPattern[] = [
    // Open source projects (case insensitive)
    {
      pattern: new RegExp(`\\b(${Object.keys(OPEN_SOURCE_MAPPINGS).join("|").replace(/\s+/g, "[\\s-]?")})\\b`, "gi"),
      replacement: (match) => {
        const normalizedMatch = match.toLowerCase().replace(/[\s-]+/g, " ");
        const slug = OPEN_SOURCE_MAPPINGS[normalizedMatch];
        if (slug) {
          return `[${match}](/open-source/${slug})`;
        }
        return match;
      },
    },

    // Specific recipe names (case insensitive, handle variations)
    {
      pattern: new RegExp(`\\b(${Object.keys(RECIPE_MAPPINGS).join("|").replace(/\s+/g, "[\\s-]?")})\\b`, "gi"),
      replacement: (match) => {
        const normalizedMatch = match.toLowerCase().replace(/[\s-]+/g, " ");
        const slug = RECIPE_MAPPINGS[normalizedMatch];
        if (slug) {
          return `[${match}](/recipes/${slug})`;
        }
        return match;
      },
    },

    // Art/photography pieces
    {
      pattern: new RegExp(`\\b(${Object.keys(ART_MAPPINGS).join("|").replace(/\s+/g, "[\\s-]?")})\\b`, "gi"),
      replacement: (match) => {
        const normalizedMatch = match.toLowerCase().replace(/[\s-]+/g, " ");
        const slug = ART_MAPPINGS[normalizedMatch];
        if (slug) {
          return `[${match}](/art/${slug})`;
        }
        return match;
      },
    },

    // Specific post titles or topics (case insensitive)
    {
      pattern: new RegExp(`\\b(${Object.keys(POST_MAPPINGS).join("|").replace(/\s+/g, "[\\s-]?")})\\b`, "gi"),
      replacement: (match) => {
        const normalizedMatch = match.toLowerCase().replace(/[\s-]+/g, " ");
        const slug = POST_MAPPINGS[normalizedMatch];
        if (slug) {
          return `[${match}](/posts/${slug})`;
        }
        return match;
      },
    },

    // Tags (with # prefix or standalone)
    {
      pattern: new RegExp(`\\b(?:#)?(${TAG_PATTERNS.join("|")})\\b`, "gi"),
      replacement: (match, tag) => {
        const cleanTag = tag.toLowerCase();
        const displayText = match.startsWith("#") ? match : tag;
        return `[${displayText}](/tags/${cleanTag})`;
      },
    },

    // Content type references
    {
      pattern: new RegExp(`\\b(${CONTENT_PATTERNS.join("|")})\\b`, "gi"),
      replacement: (match) => {
        const path = match.toLowerCase();
        return `[${match}](/${path})`;
      },
    },

    // Social media handles
    {
      pattern: /\b@matthias(?:jordan)?(?:\.eth)?\b/gi,
      replacement: (match) => {
        return `[${match}](https://warpcast.com/matthias)`;
      },
    },

    // Email
    {
      pattern: /\bmatthias@day---break\.com\b/gi,
      replacement: (match) => {
        return `[${match}](mailto:${match})`;
      },
    },

    // Website/company
    {
      pattern: /\bday---break\b/gi,
      replacement: (match) => {
        return `[${match}](https://day---break.com)`;
      },
    },
  ];

  // Apply each pattern
  for (const { pattern, replacement } of linkPatterns) {
    linkedText = linkedText.replace(pattern, replacement);
  }

  return linkedText;
}

// Helper function to extract and validate links
export function validateLinks(text: string): string[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    links.push(match[2]); // The URL part
  }

  return links;
}
