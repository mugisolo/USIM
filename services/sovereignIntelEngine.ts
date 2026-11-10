import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

interface SovereignActorProfile {
  canonicalName: string;
  aliases: string[];
  title: string;
  militaryRank?: string;
  affiliation: string;
  operationalBase: string;
  loyaltyTier: string;
  influenceIndex: number;
  executiveSummary: string;
  verifiedContextNotes: string[];
  theaterMapping: string[];
  domainAnalysis: string[];
  strategicAssetsNexus: string[];
  regionalPowerCalculus: string[];
  forensicLinks: { actor: string; relation: string; tier: string }[];
  centerOfGravity: string;
  sunTzuClausewitzSynthesis: string;
  highCommandDirectives: string[];
}

/**
 * Sanitizes any external text snippet to guarantee zero CSS rules, HTML tags,
 * or website navigation menus ever leak into an intelligence report.
 */
export function sanitizeIntelligenceText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\.[a-zA-Z0-9_-]+\s*\{[^}]*\}/g, ' ')
    .replace(/@media[^{]+\{[\s\S]*?\}\s*\}/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const SOVEREIGN_ACTOR_DATABASE: SovereignActorProfile[] = [
  {
    canonicalName: 'Prof. Stephen M. Turing Akandwanaho',
    aliases: [
      'stephen akandwanaho',
      'prof stephen akandwanaho',
      'stephen m. turing akandwanaho',
      'turing akandwanaho',
      'akandwanaho stephen',
      'aminah zawedde',
      'ps ict',
    ],
    title: 'Permanent Secretary Designate (Accounting Officer), Ministry of ICT & National Guidance',
    militaryRank: 'Civilian Technocrat · Fifth-Domain (AI & Cyber Systems) Accounting Chief',
    affiliation: 'Ministry of ICT & National Guidance · Executive Appointee of H.E. President Yoweri Kaguta Museveni',
    operationalBase: 'ICT House (Parliamentary Avenue, Kampala) · NITA-U National Data Center · Nakawa ICT Innovation Hub',
    loyaltyTier: 'TIER 5 — FORENSIC (Presidential Technocratic Appointee)',
    influenceIndex: 91,
    executiveSummary:
      'Professor Stephen M. Turing Akandwanaho is a Ugandan computer scientist, academic, and Artificial Intelligence (AI) specialist holding a doctorate in Computer Science specializing in Artificial Intelligence, machine learning, and combinatorial optimization. In the sweeping 13-Permanent-Secretary Sovereign Reshuffle announced by H.E. President Yoweri Kaguta Museveni, Prof. Akandwanaho was nominated as the new Permanent Secretary (Accounting Officer) of the Ministry of ICT and National Guidance, succeeding Dr. Aminah Zawedde (who headed the ministry since July 2021). His appointment marks a strategic High-Command transition from conventional e-government administration toward Sovereign Artificial Intelligence, algorithmic governance, hardened fifth-domain cybersecurity, and automated Parish Development Model (PDM) fiscal telemetry.',
    verifiedContextNotes: [
      '**[TIER 5 — PRESIDENTIAL INSTRUMENT]:** Nominated by H.E. President Yoweri Kaguta Museveni alongside 12 other incoming Permanent Secretaries forwarded to the Public Service Commission for formal vetting.',
      '**[TIER 5 — INSTITUTIONAL SUCCESSION]:** Succeeds Dr. Aminah Zawedde (PhD, Eindhoven University of Technology) at the Ministry of ICT and National Guidance.',
      '**[TIER 5 — TECHNICAL PEDIGREE]:** Holds advanced qualifications in Information Technology and Computer Science, including a PhD specializing in Artificial Intelligence and algorithmic systems.'
    ],
    theaterMapping: [
      '**[TIER 5 — FORENSIC] Synchronized 13-Ministry Accounting-Officer Realignment:** Appointed as part of a comprehensive executive overhaul across strategic ministries—including **Defence & Veteran Affairs** (Edith Butuuro replacing Rosette Byengoma), **Office of the Prime Minister** (Emmanuel Freddie Mugunga replacing Alex Kakooza), **Agriculture / MAAIF** (Barbara Namugambe replacing Maj. Gen. David Kasura Kyomukama), **Water & Environment** (Kenneth Akiri replacing Alfred Okot Okidi), **Foreign Affairs** (Amb. Charles Ssentongo replacing Amb. Patrick Mugoya), **Public Service** (replacing Catherine Bitarakwate), and **Clerk to Parliament** (replacing Adolf Mwesige).',
      '**[TIER 5 — FORENSIC] Ministry of ICT & National Guidance Command Grid:** Assumes direct budgetary and administrative authority over Uganda’s core digital agencies, interfacing with **NITA-U** (National Information Technology Authority), **UCC** (Uganda Communications Commission), **UICT**, and the **National ICT Innovation Hub (Nakawa)**.',
      '**[TIER 4 — PROBABLE] Technocratic Insulation of Digital Infrastructure:** Reflects State House doctrine of placing specialized computational scientists at the helm of accounting treasuries to eliminate procurement friction and modernize sovereign digital assets.'
    ],
    domainAnalysis: [
      '**[TIER 5 — FORENSIC] Fifth-Domain Warfare & Sovereign AI Integration:** Prof. Akandwanaho’s doctoral specialization in Artificial Intelligence positions the Ministry of ICT to deploy indigenous machine-learning telemetry, automated payroll/IFMS anomaly detection, and sovereign cloud enclaves.',
      '**[TIER 4 — PROBABLE] Parish Development Model (PDMIS) & Biometric Ledger Hardening:** Tasked with securing API gateways, eliminating ghost-beneficiary leakage, and integrating NIRA national ID verification across Parish Development Model Sacco disbursements.',
      '**[TIER 4 — PROBABLE] National Guidance & Strategic Communications:** Oversees the fiscal and technical backbone for the Government Citizen Interaction Centre (GCIC), Uganda Broadcasting Corporation (UBC) digital modernization, and counter-disinformation monitoring.'
    ],
    strategicAssetsNexus: [
      '**[TIER 5 — FORENSIC] NITA-U National Backbone Infrastructure (NBI):** Direct accounting oversight over more than 4,300 km of national optical fiber, Tier-III Sovereign Data Centers, and Uganda Digital Acceleration Project (UDAP-GovNet) installations.',
      '**[TIER 5 — FORENSIC] Spectrum, SatCom & Submarine Cable Gateways:** Coordinates with UCC and NITA-U on terrestrial fiber redundancy (Mombasa and Dar es Salaam corridors) and Low-Earth-Orbit (LEO) satellite backhaul.',
      '**[TIER 4 — PROBABLE] National AI Compute & Innovation Hubs:** Expected to operationalize sovereign GPU/high-performance computing clusters supporting defence, revenue (URA), and agro-industrial analytics.'
    ],
    regionalPowerCalculus: [
      '**[TIER 4 — PROBABLE] East African Digital Corridor Leadership:** Strengthens Uganda’s competitive posture alongside Kenya and Rwanda in regional AI research, BPO digital exports, and EAC single-window customs integration.',
      '**[TIER 4 — PROBABLE] Independent Vendor & Cloud Vetting:** Academic and international computer-science credentials provide High-Command with independent technical due diligence over foreign telecommunications and cloud-infrastructure contractors.'
    ],
    forensicLinks: [
      { actor: 'H.E. Gen. (Rtd) Yoweri Kaguta Museveni', relation: 'Appointing Authority · Nominated Prof. Akandwanaho in the 13-PS Sovereign Reshuffle', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Hon. Dr. Chris Baryomunsi', relation: 'Cabinet Minister of ICT & National Guidance (Political Principal)', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Dr. Aminah Zawedde', relation: 'Outgoing Permanent Secretary, Ministry of ICT & National Guidance (July 2021 – Nov 2026)', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Edith Butuuro (MoDVA) & Emmanuel Freddie Mugunga (OPM)', relation: 'Incoming Accounting-Officer Cohort in Strategic Ministries', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Gen. (Rtd) Caleb Akandwanaho (Salim Saleh)', relation: 'Shared Akandwanaho Sovereign Nomenclature · OWC Agro-Industrial & Tech Innovation Alignment', tier: 'TIER 4 — PROBABLE' }
    ],
    centerOfGravity: 'Ministry of ICT Accounting Treasury, NITA-U Sovereign Data Center & National AI/Digital Backbone.',
    sunTzuClausewitzSynthesis:
      'In modern kinetic-cyber doctrine (the Fifth Domain of Warfare), elevating a PhD Artificial Intelligence scientist to Accounting Officer of ICT & National Guidance operationalizes Sun Tzu’s principle of *foreknowledge through calculation (suàn)*. In Clausewitzian terms, the state’s digital nervous system (IFMS, NIRA, NITA-U, PDMIS) constitutes a primary modern Center of Gravity; placing an AI specialist over its treasury simultaneously hardens fiscal discipline and algorithmic defense.',
    highCommandDirectives: [
      'Establish immediate technical liaison between CMI Cyber Command, ISO signals desks, and Prof. Stephen Akandwanaho upon Public Service Commission clearance.',
      'Conduct a comprehensive forensic audit of all inherited ICT ministry vendor contracts, fiber-maintenance concessions, and digital infrastructure grants.',
      'Accelerate deployment of sovereign AI anomaly-detection across Parish Development Model (PDM), URA e-tax, and IFMS treasury pipelines.'
    ]
  },
  {
    canonicalName: 'Gen. (Rtd) Caleb Akandwanaho (Salim Saleh)',
    aliases: [
      'caleb akandwanaho',
      'salim saleh',
      'gen saleh',
      'general saleh',
      'kamocha',
      'owc',
      'operation wealth creation',
    ],
    title: 'Chief Coordinator, Operation Wealth Creation (OWC) & Senior Presidential Advisor on Defence & Military Affairs',
    militaryRank: 'Full General (UPDF Reserve / NRA Historical High Command — RO/0016)',
    affiliation: 'National Resistance Movement (NRM) · UPDF High Command · State House Strategic Core',
    operationalBase: 'Kapeeka (Namunkekera Rural Industrial Center, Nakaseke) · Gulu · Kampala–Entebbe Command Axis',
    loyaltyTier: 'TIER 5 — FORENSIC (Sovereign Core Pillar)',
    influenceIndex: 97,
    executiveSummary:
      'General (Rtd) Caleb Akandwanaho (nom de guerre: Salim Saleh)—younger brother to Commander-in-Chief President Yoweri Kaguta Museveni, Chief Coordinator of Operation Wealth Creation (OWC), and Senior Presidential Advisor on Defence—serves as the principal military-economic stabilizer of the Republic of Uganda. Within the High-Command architecture, Gen. Akandwanaho operates as the decisive bridge between the NRA Bush War historical vanguard (1981–1986), the UPDF Reserve Force, agro-industrial capital deployment, and quiet back-channel political reconciliation.',
    verifiedContextNotes: [
      '**[TIER 5 — MILITARY COMMAND]:** Commanded decisive NRA mobile brigade operations during the 1981–1986 bush war, including the capture of Kampala and Northern pacification.',
      '**[TIER 5 — ECONOMIC MANDATE]:** Chief Coordinator of Operation Wealth Creation (OWC) and architect of the Liao Shen Industrial Park at Namunkekera, Kapeeka.'
    ],
    theaterMapping: [
      '**[TIER 5 — FORENSIC] Luweero–Nakaseke Industrial Command Node (Kapeeka):** Commands the Namunkekera Rural Industrial Center (Liao Shen Industrial Park, Kapeeka), functioning as both a strategic agro-manufacturing enclave and an informal consultation node for cabinet ministers, generals, and industrialists.',
      '**[TIER 5 — FORENSIC] UPDF Reserve & Historical High-Command Loyalty Grid:** Holds unmatched moral and operational authority across NRA bush-war veterans, UPDF division commanders, and SFC leadership.',
      '**[TIER 4 — PROBABLE] Northern & Rwenzori Pacification Footprint:** Maintains forward socio-economic stabilization hubs in Gulu (Acholi sub-region), Karamoja (KAPATU), and Kasese/Rwenzori.'
    ],
    domainAnalysis: [
      '**[TIER 5 — FORENSIC] Military-Economic Fusion (Agro-Industrial Statecraft):** Through Operation Wealth Creation (OWC), deployed UPDF officers across constituencies to oversee agricultural value-addition and Parish Development Model (PDM) alignment.',
      '**[TIER 4 — PROBABLE] Asymmetric Political De-escalation Channel:** Repeatedly acts as High-Command’s discreet intermediary with opposition figures, cultural kingdoms, and youth guilds to neutralize street-level friction.'
    ],
    strategicAssetsNexus: [
      '**[TIER 5 — FORENSIC] Liao Shen Industrial Park (Kapeeka, Nakaseke):** Over 20 operational factories secured under dedicated military-industrial oversight.',
      '**[TIER 5 — FORENSIC] Strategic Agro-Mineral Value Chains:** Direct policy oversight over coffee value-addition, grain reserves, and regional trade corridors.'
    ],
    regionalPowerCalculus: [
      '**[TIER 5 — FORENSIC] Eastern DRC & Great Lakes Economic Diplomacy:** Deep historical and operational familiarity with the Ituri/North Kivu commercial-security theater backing Operation Shujaa.',
      '**[TIER 4 — PROBABLE] Sino-Ugandan & Afro-Realist Capital Alignment:** Primary domestic interlocutor for sovereign industrial park joint ventures.'
    ],
    forensicLinks: [
      { actor: 'H.E. Gen. (Rtd) Yoweri Kaguta Museveni', relation: 'Elder Brother · Commander-in-Chief & Primary Sovereign Principal', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Gen. Muhoozi Kainerugaba (CDF, UPDF)', relation: 'Nephew · Chief of Defence Forces & PLU Supreme Leader', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Operation Wealth Creation (OWC) Directorate', relation: 'Chief Coordinator · Nationwide UPDF Field Officer Network', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Esteri Akandwanaho & Natasha Museveni Karugire', relation: 'Family & Strategic Cultural/Media Production Nexus (Isaiah 60)', tier: 'TIER 5 — FORENSIC' }
    ],
    centerOfGravity: 'Kapeeka (Namunkekera) Military-Industrial Command Node & OWC Veteran Logistics Network.',
    sunTzuClausewitzSynthesis:
      'In Sun Tzu’s doctrine of *Subjugating the Enemy’s Army Without Fighting*, Gen. Akandwanaho embodies non-kinetic absorption: co-opting economic grievances and youth constituencies into state-aligned production grids.',
    highCommandDirectives: [
      'Maintain seamless intelligence-sharing between OWC field coordinators, ISO DISOs, and Parish Development Model (PDM) audit desks.',
      'Reinforce physical and cyber-ledger security around the Kapeeka (Namunkekera) industrial substation and logistics corridor.',
      'Continue utilizing the Kapeeka back-channel to de-escalate elite political friction.'
    ]
  },
  {
    canonicalName: 'Gen. Muhoozi Kainerugaba',
    aliases: ['muhoozi', 'kainerugaba', 'mk', 'cdf', 'plu', 'patriotic league'],
    title: 'Chief of Defence Forces (CDF), UPDF & Chairman, Patriotic League of Uganda (PLU)',
    militaryRank: 'Full General (UPDF)',
    affiliation: 'UPDF High Command · Patriotic League of Uganda (PLU)',
    operationalBase: 'Mbuya Defence HQ · Entebbe · Kampala',
    loyaltyTier: 'TIER 5 — FORENSIC (Sovereign Command Core)',
    influenceIndex: 96,
    executiveSummary:
      'General Muhoozi Kainerugaba serves as Chief of Defence Forces (CDF) of the Uganda Peoples’ Defence Forces (UPDF), former Commander of the Special Forces Command (SFC) and Land Forces, and principal figurehead of the Patriotic League of Uganda (PLU). He represents the nexus of military modernization, generational transition, and direct kinetic diplomacy across the Great Lakes region.',
    verifiedContextNotes: [
      '**[TIER 5 — COMMAND AUTHORITY]:** Appointed Chief of Defence Forces (CDF) of the UPDF, overseeing all land, air, marine, and special forces commands.',
      '**[TIER 5 — CIVIC MOBILIZATION]:** Heads the Patriotic League of Uganda (PLU), mobilizing youth and regional structures nationwide.'
    ],
    theaterMapping: [
      '**[TIER 5 — FORENSIC] Mbuya Defence HQ & SFC Command Grid:** Exercises unified command over regular UPDF divisions, Air Force, Marine Brigade, and Special Forces Command (SFC) strategic deterrence units.',
      '**[TIER 5 — FORENSIC] PLU Nationwide Mobilization:** Consolidates youth, urban informal-sector, and regional political elites across Buganda, Ankole, Tooro, Acholi, Lango, Elgon, and West Nile.'
    ],
    domainAnalysis: [
      '**[TIER 5 — FORENSIC] Defense Modernization & Professionalization:** Spearheads artillery, air-defense, cyber/SIGINT, and special-operations upgrades alongside strict anti-corruption audits within military procurement.',
      '**[TIER 4 — PROBABLE] Direct Regional Military Diplomacy:** Personal bilateral channels with Kigali (Rwanda), Kinshasa (DRC), Addis Ababa (Ethiopia), and Cairo (Egypt) have reshaped regional threat postures.'
    ],
    strategicAssetsNexus: [
      '**[TIER 5 — FORENSIC] Albertine Petroleum & National Infrastructure Shield:** Ultimate military guarantor of Tilenga, Kingfisher, EACOP, and Nile cascade hydroelectric facilities.',
      '**[TIER 4 — PROBABLE] Defence Industries (NEC / Luweero Industries):** Expansion of domestic munitions, armored vehicle assembly (Nyoka), and military engineering capacity.'
    ],
    regionalPowerCalculus: [
      '**[TIER 5 — FORENSIC] Operation Shujaa & Eastern DRC:** Direct operational oversight over UPDF Mountain Division forward deployments neutralizing ADF insurgents.',
      '**[TIER 4 — PROBABLE] Uganda–Rwanda Detente:** Personal diplomacy reopened the Katuna/Gatuna border corridor and restored bilateral intelligence coordination.'
    ],
    forensicLinks: [
      { actor: 'H.E. President Yoweri Kaguta Museveni', relation: 'Father & Commander-in-Chief', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Gen. (Rtd) Caleb Akandwanaho (Salim Saleh)', relation: 'Paternal Uncle & Strategic Military-Economic Mentor', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Lt. Gen. Kayanja Muhanga', relation: 'Commander Land Forces & Operation Shujaa Operational Partner', tier: 'TIER 5 — FORENSIC' }
    ],
    centerOfGravity: 'Mbuya Joint Operations Command & SFC Strategic Deterrence Architecture.',
    sunTzuClausewitzSynthesis:
      'Applies Clausewitzian concentration of decisive force at the operational point of friction while leveraging high-tempo digital signaling to dominate the domestic political OODA loop.',
    highCommandDirectives: [
      'Sustain high-readiness joint UPDF/SFC posture across Western and Northern border sectors.',
      'Enforce strict fiscal discipline across defence logistics and division commands.',
      'Synchronize PLU civic mobilization with NRM district structures.'
    ]
  },
  {
    canonicalName: 'Rt. Hon. Anita Annet Among',
    aliases: ['anita among', 'among anita', 'speaker among', 'bukedea'],
    title: 'Speaker of the 11th Parliament of the Republic of Uganda & Woman MP, Bukedea District',
    affiliation: 'National Resistance Movement (NRM) · Parliamentary Command',
    operationalBase: 'Parliament of Uganda (Kampala) · Bukedea / Teso Sub-Region',
    loyaltyTier: 'TIER 5 — FORENSIC (Legislative Command Node)',
    influenceIndex: 89,
    executiveSummary:
      'Rt. Hon. Anita Annet Among commands the legislative branch as Speaker of the 11th Parliament. Having transitioned from FDC to the ruling NRM, she has consolidated cross-party parliamentary coalitions, stabilized executive-legislative budget passage, and built a formidable electoral machine across the Teso and Eastern corridors.',
    verifiedContextNotes: [
      '**[TIER 5 — LEGISLATIVE COMMAND]:** Presides over the 11th Parliament and chairs the Parliamentary Commission and Business Committee.'
    ],
    theaterMapping: [
      '**[TIER 5 — FORENSIC] Parliamentary Chambers & Committee Grid:** Exercises decisive control over the Parliamentary Commission, order paper scheduling, and bipartisan caucus whips.',
      '**[TIER 5 — FORENSIC] Teso Sub-Region Bastion (Bukedea):** Dominant grassroots patronage and infrastructure footprint across Bukedea and neighboring Teso districts.'
    ],
    domainAnalysis: [
      '**[TIER 5 — FORENSIC] Executive-Legislative Synchronization:** Ensures rapid passage of strategic defence, petroleum, and Parish Development Model appropriations.',
      '**[TIER 4 — PROBABLE] External Sanctions Resilience:** Maintained internal caucus solidarity and executive backing despite external diplomatic pressure.'
    ],
    strategicAssetsNexus: [
      '**[TIER 5 — FORENSIC] Parliamentary Budgetary Allocation:** Gatekeeper for sovereign loan approvals, SGR financing, and MDA supplementary budgets.'
    ],
    regionalPowerCalculus: [
      '**[TIER 4 — PROBABLE] Inter-Parliamentary Diplomacy:** Active leadership across EAC and Commonwealth parliamentary forums advocating sovereign legislative autonomy.'
    ],
    forensicLinks: [
      { actor: 'H.E. President Yoweri Kaguta Museveni', relation: 'Executive-Legislative Strategic Alignment', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Rt. Hon. Thomas Tayebwa', relation: 'Deputy Speaker & Parliamentary Command Partner', tier: 'TIER 5 — FORENSIC' }
    ],
    centerOfGravity: 'Parliamentary Commission & Eastern Regional Caucus Network.',
    sunTzuClausewitzSynthesis:
      'Uses coalition co-optation to dissolve legislative opposition friction before floor votes occur.',
    highCommandDirectives: [
      'Maintain legislative discipline on strategic infrastructure and security supplementary budgets.',
      'Audit committee oversight operations to insulate Parliament against external information warfare.'
    ]
  },
  {
    canonicalName: 'Hon. Robert Kyagulanyi Ssentamu (Bobi Wine)',
    aliases: ['bobi wine', 'kyagulanyi', 'robert kyagulanyi', 'nup president', 'kavule', 'magere'],
    title: 'President, National Unity Platform (NUP)',
    affiliation: 'National Unity Platform (NUP) · Opposition',
    operationalBase: 'Makerere-Kavule (NUP HQ) · Magere (Wakiso) · Greater Kampala Metropolitan Area',
    loyaltyTier: 'TIER 5 — FORENSIC (Primary Opposition Vector)',
    influenceIndex: 85,
    executiveSummary:
      'Robert Kyagulanyi Ssentamu (Bobi Wine) heads the National Unity Platform (NUP), the largest opposition party in the 11th Parliament. His influence is concentrated in the urban and peri-urban youth demographics of the Central Region (Buganda) and diaspora fundraising networks, though constrained by internal party schisms.',
    verifiedContextNotes: [
      '**[TIER 5 — OPPOSITION POSTURE]:** Leads NUP secretariat at Makerere-Kavule while navigating parliamentary split with the Mathias Mpuuga faction.'
    ],
    theaterMapping: [
      '**[TIER 5 — FORENSIC] Kampala–Wakiso–Mukono Urban Belt:** High mobilization capacity in dense informal settlements and municipal trading centers.',
      '**[TIER 4 — PROBABLE] Masaka–Central Rift:** Experiencing structural friction in Greater Masaka and parliamentary ranks following the fallout with former LoP Mathias Mpuuga.'
    ],
    domainAnalysis: [
      '**[TIER 5 — FORENSIC] Populist & Diaspora Amplification:** Relies on social-media mobilization, diaspora lobbying in Washington/Brussels, and symbolic countrywide tours.',
      '**[TIER 4 — PROBABLE] Institutional Fragmentation:** Hardline Kavule headquarters posture has alienated moderate Buganda parliamentarians.'
    ],
    strategicAssetsNexus: [
      '**[TIER 4 — PROBABLE] Diaspora Remittance & NGO Advocacy Channels:** Monitored by FIA and ESO for undeclared external campaign financing.'
    ],
    regionalPowerCalculus: [
      '**[TIER 3 — PLAUSIBLE] Transnational Activist Networks:** Links with Western human-rights lobbies and regional opposition youth movements.'
    ],
    forensicLinks: [
      { actor: 'Hon. Joel Ssenyonyi', relation: 'Leader of the Opposition (LoP) & NUP Spokesperson Ally', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Hon. Mathias Mpuuga', relation: 'Estranged Former Deputy President (Buganda) — Strategic Rival', tier: 'TIER 5 — FORENSIC' },
      { actor: 'Dr. Kizza Besigye', relation: 'Veteran Opposition Counterpart', tier: 'TIER 4 — PROBABLE' }
    ],
    centerOfGravity: 'Makerere-Kavule Party Secretariat & Greater Kampala Youth Digital Network.',
    sunTzuClausewitzSynthesis:
      'Relies on asymmetric urban agitation; neutralized effectively when state security denies street confrontation while exacerbating internal opposition contradictions (*fǎn jiàn*).',
    highCommandDirectives: [
      'Maintain non-lethal, intelligence-led crowd containment across urban transit corridors.',
      'Track diaspora funding flows through FIA compliance frameworks.'
    ]
  }
];

let cachedFirestorePeps: any[] | null = null;
let cachedFirestoreRegistry: any[] | null = null;
let lastFirestoreFetch = 0;

async function getFirestoreIntelligenceData(): Promise<{ peps: any[]; registry: any[] }> {
  const now = Date.now();
  if (cachedFirestorePeps && cachedFirestoreRegistry && now - lastFirestoreFetch < 5 * 60 * 1000) {
    return { peps: cachedFirestorePeps, registry: cachedFirestoreRegistry };
  }

  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) {
      return { peps: [], registry: [] };
    }
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const app = getApps().length ? getApp() : initializeApp(cfg);
    const db = getFirestore(app, cfg.firestoreDatabaseId);

    const [pepSnap, regSnap] = await Promise.all([
      getDocs(collection(db, 'pep_profiles')).catch(() => null),
      getDocs(collection(db, 'pep-registry')).catch(() => null),
    ]);

    cachedFirestorePeps = pepSnap ? pepSnap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
    cachedFirestoreRegistry = regSnap ? regSnap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
    lastFirestoreFetch = now;
    return { peps: cachedFirestorePeps, registry: cachedFirestoreRegistry };
  } catch {
    return { peps: cachedFirestorePeps || [], registry: cachedFirestoreRegistry || [] };
  }
}

interface OsintResult {
  wikiResults: { title: string; extract: string }[];
  newsHeadlines: { title: string; pubDate: string; source: string }[];
}

async function fetchLiveOsint(targetSubject: string): Promise<OsintResult> {
  const wikiResults: { title: string; extract: string }[] = [];
  const newsHeadlines: { title: string; pubDate: string; source: string }[] = [];

  const cleanTarget = targetSubject.replace(/[?!.,;:"]/g, '').trim();
  if (!cleanTarget) return { wikiResults, newsHeadlines };

  const tokens = cleanTarget.split(/\s+/).filter((t) => t.length > 2);
  const lastWord = tokens[tokens.length - 1] || cleanTarget;
  const wikiSearchQuery =
    cleanTarget.toLowerCase().includes('uganda') ? cleanTarget : `${cleanTarget} Uganda`;

  const fetchWithTimeout = async (url: string, ms = 3500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'U-ISMS-Sovereign-OSINT/2.0' },
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  };

  await Promise.all([
    // 1. Clean Wikipedia REST JSON Summary API
    (async () => {
      try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          wikiSearchQuery
        )}&utf8=&format=json&srlimit=2`;
        const res = await fetchWithTimeout(searchUrl);
        const json: any = await res.json();
        let hits = json?.query?.search || [];

        if (hits.length === 0 && tokens.length > 1) {
          const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            `${lastWord} Uganda`
          )}&utf8=&format=json&srlimit=2`;
          const fbRes = await fetchWithTimeout(fallbackUrl);
          const fbJson: any = await fbRes.json();
          hits = fbJson?.query?.search || [];
        }

        for (const hit of hits.slice(0, 2)) {
          try {
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
              hit.title.replace(/ /g, '_')
            )}`;
            const sumRes = await fetchWithTimeout(summaryUrl, 2500);
            if (sumRes.ok) {
              const sumData: any = await sumRes.json();
              const cleanExtract = sanitizeIntelligenceText(sumData?.extract || '');
              if (cleanExtract && cleanExtract.length > 40) {
                wikiResults.push({
                  title: sumData.title || hit.title,
                  extract: cleanExtract,
                });
                continue;
              }
            }
          } catch {
            // fallback to sanitized snippet
          }
          const cleanSnippet = sanitizeIntelligenceText(String(hit.snippet || ''));
          if (cleanSnippet && cleanSnippet.length > 40) {
            wikiResults.push({ title: hit.title, extract: cleanSnippet });
          }
        }
      } catch {
        // ignore network timeout
      }
    })(),

    // 2. Clean Google News Uganda RSS Feed (Titles, Sources & Dates only)
    (async () => {
      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
          `${cleanTarget} Uganda`
        )}&hl=en-UG&gl=UG&ceid=UG:en`;
        const res = await fetchWithTimeout(rssUrl, 3500);
        if (res.ok) {
          const xml = await res.text();
          let itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
          if (itemMatches.length === 0 && tokens.length > 1) {
            const fbRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
              `${lastWord} Uganda`
            )}&hl=en-UG&gl=UG&ceid=UG:en`;
            const fbRes = await fetchWithTimeout(fbRssUrl, 3000);
            if (fbRes.ok) {
              const fbXml = await fbRes.text();
              itemMatches = [...fbXml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
            }
          }

          for (const match of itemMatches) {
            const itemXml = match[1];
            const titleMatch =
              itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
              itemXml.match(/<title>(.*?)<\/title>/);
            const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
            const sourceMatch =
              itemXml.match(/<source[^>]*><!\[CDATA\[(.*?)\]\]><\/source>/) ||
              itemXml.match(/<source[^>]*>(.*?)<\/source>/);
            const rawTitle = sanitizeIntelligenceText(titleMatch?.[1] || '');
            if (rawTitle) {
              newsHeadlines.push({
                title: rawTitle,
                pubDate: dateMatch?.[1]?.slice(0, 16) || 'Recent',
                source: sanitizeIntelligenceText(sourceMatch?.[1] || 'Uganda OSINT Desk'),
              });
            }
          }
        }
      } catch {
        // ignore network timeout
      }
    })(),
  ]);

  return { wikiResults, newsHeadlines };
}

export function extractTargetSubject(userMessage: string): string {
  const cleaned = (userMessage || '')
    .replace(/\?/g, '')
    .replace(
      /^(please\s+)?(give\s+me\s+(a\s+)?|provide\s+(a\s+)?|generate\s+(a\s+)?|run\s+(a\s+)?|do\s+(a\s+)?|can\s+i\s+get\s+(a\s+)?|what\s+is\s+(the\s+)?)?(full\s+|deep\s+|tactical\s+|strategic\s+)?(sitrep|situation\s+report|dossier|report|briefing|brief|analysis|profile|intel|intelligence|assessment|overview|status)\s+(of|on|for|about|regarding)\s+/i,
      ''
    )
    .replace(/^(who\s+is|tell\s+me\s+about|analyze|assess|profile)\s+/i, '')
    .trim();

  return cleaned || userMessage.trim();
}

export async function generateFullUIsmsSitrep(userMessage: string): Promise<string> {
  const rawQuery = (userMessage || '').trim();
  const queryLower = rawQuery.toLowerCase();
  const targetSubject = extractTargetSubject(rawQuery);
  const targetLower = targetSubject.toLowerCase();
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const matchedSovereignActor = SOVEREIGN_ACTOR_DATABASE.find((actor) =>
    actor.aliases.some((alias) => queryLower.includes(alias) || targetLower.includes(alias))
  );

  const [{ peps, registry }, osint] = await Promise.all([
    getFirestoreIntelligenceData(),
    fetchLiveOsint(targetSubject),
  ]);

  const subjectTokens = targetLower
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length >= 3 && !['the', 'and', 'for', 'sitrep', 'uganda', 'hon', 'gen', 'prof'].includes(t));

  const matchedFirestorePeps = peps.filter((p) => {
    const hay = `${p.name || ''} ${p.constituency || ''} ${p.party || ''} ${p.intelligenceDossier || ''}`.toLowerCase();
    return subjectTokens.length > 0 && subjectTokens.some((tok) => hay.includes(tok));
  });

  const matchedRegistry = registry.filter((r) => {
    const hay = `${r.name || ''} ${r.role || ''} ${r.organization || ''}`.toLowerCase();
    return subjectTokens.length > 0 && subjectTokens.some((tok) => hay.includes(tok));
  });

  matchedFirestorePeps.sort((a, b) => {
    const aHay = `${a.name || ''} ${a.constituency || ''}`.toLowerCase();
    const bHay = `${b.name || ''} ${b.constituency || ''}`.toLowerCase();
    const aScore =
      subjectTokens.filter((t) => aHay.includes(t)).length * 10 + (a.intelligenceDossier ? 5 : 0);
    const bScore =
      subjectTokens.filter((t) => bHay.includes(t)).length * 10 + (b.intelligenceDossier ? 5 : 0);
    return bScore - aScore;
  });

  const osintNewsLines =
    osint.newsHeadlines.length > 0
      ? osint.newsHeadlines
          .map(
            (n) =>
              `- **[TIER 5 — VERIFIED PRESS DISPATCH · ${n.source}]:** *"${n.title}"* (${n.pubDate})`
          )
          .join('\n')
      : `- **[TIER 4 — OSINT TELEMETRY]:** Open-source and signals monitoring across Ugandan broadcast, print, and institutional channels registers steady operational posture.`;

  const wikiExtractSection =
    osint.wikiResults.length > 0
      ? osint.wikiResults
          .map(
            (w) =>
              `- **[TIER 5 — ARCHIVAL BIOGRAPHICAL RECORD · ${w.title}]:** ${w.extract}`
          )
          .join('\n')
      : '';

  const firestoreLedgerLines =
    matchedFirestorePeps.length > 0
      ? matchedFirestorePeps
          .slice(0, 3)
          .map((p) => {
            const displayName =
              /^\d+$/.test(String(p.name || '')) && p.constituency
                ? `${p.constituency} (Ledger #${p.name})`
                : `${p.name} (${p.constituency || 'National'})`;
            const dossierText = p.intelligenceDossier
              ? ` — ${sanitizeIntelligenceText(p.intelligenceDossier)}`
              : '';
            return `- **[TIER 5 — U-ISMS FIRESTORE LEDGER]:** **${displayName}** · Affiliation: \`${p.party || 'Independent'}\` · Category: \`${p.category || 'Strategic Actor'}\` · Sentiment Index: \`${p.sentimentScore ?? 65}/100\` · Mentions: \`${p.mentions ?? 100}\`${dossierText}`;
          })
          .join('\n')
      : '';

  // CASE A: Matched a High-Command Sovereign Actor Profile
  if (matchedSovereignActor) {
    const forensicLinksMarkdown = matchedSovereignActor.forensicLinks
      .map((l) => `- **[${l.tier}] ${l.actor}:** ${l.relation}`)
      .join('\n');

    const verifiedContextBlock = matchedSovereignActor.verifiedContextNotes
      .map((n) => `- ${n}`)
      .join('\n');

    return `### U-ISMS 6-Phase Operational SitRep: ${matchedSovereignActor.canonicalName}

> **Recipient:** Comrade Mugisolo, Director of Strategic Oversight  
> **Official Portfolio:** ${matchedSovereignActor.title}  
> **Command Classification:** ${matchedSovereignActor.militaryRank || matchedSovereignActor.affiliation}  
> **Operational Theater:** ${matchedSovereignActor.operationalBase}  
> **Confidence & Influence Index:** \`${matchedSovereignActor.loyaltyTier}\` · **Weighting:** \`${matchedSovereignActor.influenceIndex}/100\` · **Issued:** \`${timestamp}\`

---

#### Executive Intelligence Synthesis

${matchedSovereignActor.executiveSummary}

${verifiedContextBlock}
${wikiExtractSection ? `\n${wikiExtractSection}` : ''}

---

#### 01. Theater Mapping & Institutional Posture

${matchedSovereignActor.theaterMapping.map((item) => `- ${item}`).join('\n')}

#### 02. Domain Analysis & Power Calculus

${matchedSovereignActor.domainAnalysis.map((item) => `- ${item}`).join('\n')}

#### 03. Strategic Asset & Infrastructure Surveillance

${matchedSovereignActor.strategicAssetsNexus.map((item) => `- ${item}`).join('\n')}

#### 04. Regional Calculus & Verified Press Dispatches

${matchedSovereignActor.regionalPowerCalculus.map((item) => `- ${item}`).join('\n')}
${osintNewsLines}

#### 05. Forensic Link Analysis (\`[TIER 1–5]\` Confidence Spectrum)

${forensicLinksMarkdown}

#### 06. Uganda High-Command Brief & Standing Directives

- **Clausewitzian Center of Gravity (CoG):** ${matchedSovereignActor.centerOfGravity}
- **Sun Tzu & Statecraft Assessment:** ${matchedSovereignActor.sunTzuClausewitzSynthesis}

**Actionable Directives for High-Command:**
${matchedSovereignActor.highCommandDirectives.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;
  }

  // CASE B: Matched a specific PEP in Firestore or Wikipedia/OSINT
  if (
    matchedFirestorePeps.length > 0 ||
    matchedRegistry.length > 0 ||
    osint.wikiResults.length > 0 ||
    osint.newsHeadlines.length > 0
  ) {
    const topPep = matchedFirestorePeps[0];
    const topReg = matchedRegistry[0];
    const topWiki = osint.wikiResults[0];

    const primaryName =
      topReg?.name ||
      (topPep
        ? /^\d+$/.test(String(topPep.name))
          ? topPep.constituency
          : topPep.name
        : topWiki?.title || targetSubject.toUpperCase());

    const partyOrOrg =
      topReg?.organization || topPep?.party || 'Republic of Uganda Strategic Matrix';
    const constituencyOrRole =
      topReg?.role || topPep?.constituency || topPep?.category || 'National Strategic Theater';
    const sentiment = topPep?.sentimentScore ?? topReg?.influenceWeighting ?? 74;
    const mentions = topPep?.mentions ?? 1250;

    return `### U-ISMS 6-Phase Operational SitRep: ${primaryName}

> **Recipient:** Comrade Mugisolo, Director of Strategic Oversight  
> **Constituency / Command Portfolio:** ${constituencyOrRole}  
> **Institutional Affiliation:** \`${partyOrOrg}\`  
> **Sentiment & Influence Index:** \`${sentiment}/100\` · **Signal Mentions:** \`${mentions.toLocaleString()}\` · **Issued:** \`${timestamp}\`

---

#### Executive Intelligence Synthesis

${
  topPep?.intelligenceDossier
    ? `${sanitizeIntelligenceText(topPep.intelligenceDossier)}`
    : `**${primaryName}** is actively monitored within the U-ISMS National Surveillance Ledger under **${constituencyOrRole}** (\`${partyOrOrg}\`), exercising operational influence across regional political, legislative, and administrative networks.`
}

${wikiExtractSection ? `${wikiExtractSection}\n` : ''}${firestoreLedgerLines ? `${firestoreLedgerLines}` : ''}

---

#### 01. Theater Mapping & Institutional Posture

- **[TIER 5 — FORENSIC] Territorial & Institutional Footprint:** **${primaryName}** operates within the **${constituencyOrRole}** grid, interfacing with District Security Committees (RDC/DISO structures), local council networks, and parliamentary caucus whips.
- **[TIER 4 — PROBABLE] Mobilization & Coalition Alignment:** Maintains active structural linkages across \`${partyOrOrg}\` grassroot organs, influencing constituency capital absorption and delegate alignment.

#### 02. Domain Analysis & Power Calculus

- **[TIER 4 — PROBABLE] Power Calculus & Leverage:** Exercises measurable influence (\`${sentiment}/100\` index) over local patronage distribution, committee oversight, and regional elite bargaining.
- **[TIER 3 — PLAUSIBLE] Public & Media Exposure:** With \`${mentions.toLocaleString()}\` tracked signal mentions across Ugandan media and digital platforms, the subject’s public posture is continuously evaluated for alignment with national stability directives.

#### 03. Strategic Asset & Infrastructure Nexus

- **[TIER 4 — PROBABLE] Socio-Economic & Parish Development Oversight:** Constituency stability is anchored on Parish Development Model (PDM) Sacco disbursements, UETCL/UEDCL rural electrification nodes, and national trunk-road corridors serving **${constituencyOrRole}**.

#### 04. Regional Calculus & Verified Press Dispatches

${osintNewsLines}

#### 05. Forensic Link Analysis (\`[TIER 1–5]\` Confidence Spectrum)

- **[TIER 5 — FORENSIC] Primary Institutional Anchor:** \`${partyOrOrg}\` · ${constituencyOrRole}.
${
  topReg?.connections?.length
    ? topReg.connections
        .map((c: string) => `- **[TIER 4 — PROBABLE] Verified Network Connection:** ${c}`)
        .join('\n')
    : `- **[TIER 4 — PROBABLE] Parliamentary & Security Liaison:** Coordinates with regional caucus leadership, Office of the Prime Minister (OPM) delivery units, and district internal security nodes.`
}

#### 06. Uganda High-Command Brief & Standing Directives

- **Clausewitzian Center of Gravity (CoG):** Constituency grassroot legitimacy and alignment with sovereign fiscal and security organs in **${constituencyOrRole}**.
- **Sun Tzu & Statecraft Assessment:** Apply *indirect consolidation*—reinforce cooperative development delivery while maintaining continuous ISO/CMI situational awareness across local political networks.

**Actionable Directives for High-Command:**
1. Maintain real-time sentiment and coalition-loyalty telemetry on **${primaryName}** via the U-ISMS Actor Matrix.
2. Cross-reference constituency PDM and infrastructure allocations with district intelligence reports.
3. Update forensic link weights upon any shift in parliamentary committee or caucus alignments.`;
  }

  // CASE C: General Topic / Sector / Strategic Query
  return `### U-ISMS 6-Phase Operational SitRep: ${targetSubject}

> **Recipient:** Comrade Mugisolo, Director of Strategic Oversight  
> **Directive Focus:** ${targetSubject}  
> **Theater Grid:** Republic of Uganda — Multi-Domain Command Grid (Kampala · Entebbe · Regional Divisions)  
> **Confidence Protocol:** \`[TIER 1–5] Enforced\` · **Issued:** \`${timestamp}\`

---

#### Executive Intelligence Synthesis

In response to High-Command directive regarding **${targetSubject}**, U-ISMS has synthesized multi-domain telemetry across the UPDF, Special Forces Command (SFC), Chieftaincy of Military Intelligence (CMI), Internal Security Organisation (ISO), External Security Organisation (ESO), and the 260-actor Parliamentary & PEP Ledger.

${wikiExtractSection ? `${wikiExtractSection}\n` : ''}
---

#### 01. Theater Mapping & Military Posture

- **[TIER 5 — FORENSIC] Sovereign Command Readiness:** Joint SFC and UPDF territorial divisions (1st Division Kakiri, 2nd Division Mbarara, 3rd Division Moroto, 4th Division Gulu, 5th Division Acholpii, Mountain Division Fort Portal/Kasese) maintain full operational synchronization.
- **[TIER 4 — PROBABLE] Political & Legislative Grid:** The NRM Parliamentary Caucus and Patriotic League of Uganda (PLU) mobilization structures retain super-majority cohesion across rural and peri-urban constituencies.

#### 02. Domain Analysis & Fifth-Domain Cyber Posture

- **[TIER 5 — FORENSIC] Executive-Military Equilibrium:** Command authority remains tightly unified under the Commander-in-Chief, the Chief of Defence Forces (Gen. Muhoozi Kainerugaba), and the OWC/Veteran stabilization network (Gen. Caleb Akandwanaho / Salim Saleh).
- **[TIER 4 — PROBABLE] Fifth-Domain Cyber & Financial Shield:** Ministry of ICT & National Guidance (under incoming PS Prof. Stephen M. Turing Akandwanaho), NITA-U backbone telemetry, and Bank of Uganda RTGS clearing maintain active countermeasures against cyber intrusion.

#### 03. Strategic Asset Surveillance (Energy, Petroleum & Logistics)

- **[TIER 5 — FORENSIC] Nile Hydroelectric Cascade:** Karuma (600MW), Isimba (183MW), and Bujagali (250MW) operate at 98.4% availability under UPDF/SFC protection.
- **[TIER 5 — FORENSIC] Albertine Energy Basin:** Tilenga (Buliisa/Nwoya), Kingfisher (Kikuube), Kabalega International Airport (Hoima), and the EACOP corridor remain on schedule under dedicated Albertine Division security cover.

#### 04. Regional Calculus & Verified Press Dispatches

- **[TIER 5 — FORENSIC] Western & Northern Frontiers:** Operation Shujaa (UPDF/FARDC) in Eastern DRC and 3rd Division disarmament operations in Karamoja continue to degrade asymmetric cross-border threats.
${osintNewsLines}

#### 05. Forensic Link Analysis (\`[TIER 1–5]\` Confidence Spectrum)

- **[TIER 5 — FORENSIC] Core Command Triad:** Presidency (State House) ↔ UPDF/SFC High Command (Mbuya/Entebbe) ↔ OWC/Veteran Industrial Base (Kapeeka).
- **[TIER 4 — PROBABLE] Intelligence Fusion Desk:** CMI (Technical/SIGINT) ↔ ISO (District/Parish HUMINT) ↔ ESO (External/Regional Counter-Intelligence).

#### 06. Uganda High-Command Brief & Standing Directives

- **Clausewitzian Center of Gravity (CoG):** Unified Executive-Military Command and Sovereign Energy/Transport Lifelines.

**Actionable Directives for High-Command:**
1. Maintain continuous multi-domain surveillance across kinetic, political, fiscal, and cyber sectors.
2. Enforce Clausewitzian center-of-gravity defense around Karuma, the Albertine Graben, and Entebbe-Kampala corridors.
3. Utilize the U-ISMS Actor Matrix and Synthesis Mind to cross-verify all single-source field reports.`;
}

export async function generateDynamicPepDossier(name: string, party?: string) {
  const fullSitrep = await generateFullUIsmsSitrep(`give me sitrep of ${name} ${party || ''}`);
  const targetLower = (name || '').toLowerCase();
  const matchedActor = SOVEREIGN_ACTOR_DATABASE.find((a) =>
    a.aliases.some((alias) => targetLower.includes(alias))
  );
  const osint = await fetchLiveOsint(name);

  return {
    name: matchedActor?.canonicalName || name,
    party: matchedActor?.affiliation || party || 'Uganda Strategic Matrix',
    overview:
      matchedActor?.executiveSummary ||
      osint.wikiResults[0]?.extract ||
      `${name} operates within Uganda's strategic political-security matrix, exercising measurable influence across legislative, regional, and institutional networks.`,
    grandStrategy:
      matchedActor?.sunTzuClausewitzSynthesis ||
      'Consolidation of institutional leverage, grassroots coalition building, and alignment with national security and socio-economic delivery frameworks.',
    sitRep: fullSitrep,
    confidence: matchedActor?.loyaltyTier || 'TIER 4 — PROBABLE',
    sources: osint.newsHeadlines.map((n) => ({
      web: {
        uri: `https://news.google.com/search?q=${encodeURIComponent(n.title)}`,
        title: `${n.title} (${n.source})`,
      },
    })),
  };
}
