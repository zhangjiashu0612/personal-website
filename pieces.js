// Content of the puzzle. Edit this file to change what the brain says; main.js only reads it.
// regions: Desikan-Killiany names as in assets/brain.json (lh-/rh- prefix). Placement is for display.
window.SITE = {
  email: "zhangjiashu0612@gmail.com",
  github: "https://github.com/zhangjiashu0612",
  cv: "",                      // path to a PDF, e.g. "assets/lucas-zhang-cv.pdf"; empty = no CV link shown
  photo: "",                   // path to a portrait (3:4 works best), e.g. "assets/lucas.jpg"; empty = a silhouette placeholder
  photoHead: { x: 0.5, y: 0.37, crown: 0.18 },   // where the head is in that photo: centre x, centre y, top of the head, as fractions of the image
  who: [
    "First-year, neural engineering, University of Illinois Urbana-Champaign.",
    "Founder of FocusKit. Undergraduate researcher in a cognitive network neuroscience lab."
  ],
  hello: {
    hey: "hi, this is Lucas.",
    h1: "I'm dedicated to building closed-loop systems for neuromodulation.",
    lead: "If you scroll down, you'll see what I've done so far.",
    toc: ""
  },
  areas: [
    { title: "Molecules", keys: ["ad"] },
    { title: "Behaviour and language", keys: ["n400"] },
    { title: "Decoding", keys: ["ssvep", "meg"] },
    { title: "Whole-brain dynamics", keys: ["hcp", "dfc", "a3"] },
    { title: "Hardware", keys: ["focuskit"] }
  ],
  now: {
    when: "October 2026",
    lines: [
      "Recording the first clean alpha from a gold electrode on my own head, on an OpenBCI Cyton, to prove the chain before anything dry touches a temple.",
      "Sewing the first pair of fabric electrodes: silver knit wrapped around a cured silicone pad.",
      "Working through a public EEG-fMRI attention dataset one subject at a time, by eye before by script.",
      "Turning the glasses into a clip that rides on any frame."
    ],
    photos: [
      { src: "", caption: "the bench: two Cyton boards, gold cups, a metre of silver knit" },
      { src: "", caption: "the first fabric electrode" }
    ]
  },
  question: "If you could change one thing about your brain today, which?",
  states: [
    { key: "focus", label: "focus", regions: ["lh-parsorbitalis", "lh-parstriangularis", "lh-temporalpole"], view: { theta: -2.0, phi: 1.3 }, hide: null,
      card: "Focus. Readable seconds ahead from one channel at the temple; the lever is the open question. On my bench now.", missing: "lever" },
    { key: "sleep", label: "sleep", regions: ["rh-superiorfrontal", "lh-superiorfrontal"], view: { theta: 0.9, phi: 0.55 }, hide: null,
      card: "Sleep. Readable from the scalp for seventy years; the lever that fits a routine does not exist yet. On my list, not on my bench.", missing: "sleep" },
    { key: "thought", label: "a thought that loops", regions: ["rh-rostralanteriorcingulate", "rh-medialorbitofrontal", "rh-frontalpole"], view: { theta: -1.6, phi: 1.45 }, hide: "L",
      card: "A thought that loops. Lives on the midline, where no dry electrode reaches well. No readout, no lever. The hardest of the four.", missing: "thought" },
    { key: "energy", label: "energy", regions: ["rh-caudalanteriorcingulate", "lh-caudalanteriorcingulate"], view: { theta: -1.6, phi: 1.4 }, hide: "L",
      card: "Energy. Mostly a body signal: heart, breath, sleep debt. The scalp sees its shadow. Not on my list yet, and I would rather say so.", missing: null }
  ],
  build: {
    story: [
      "A hundred years ago bad eyesight was fate. Then someone measured it, ground a lens, and it stopped being a character flaw. We did the same for a bad knee, a weak heart, a slow thyroid: measure, correct, carry on.",
      "The mind never got that. Can't focus, can't sleep, a thought that loops: the advice is still to try harder.",
      "I want the same routine for mental states. Read the state from outside, nudge it at the right moment, see whether it moved. Not a treatment. A habit, like putting on glasses.",
      "I started with focus because it is the one I can read first, with one electrode at the temple. Sleep and the looping thought are next, and I don't have the tools for them yet."
    ],
    mechanics: [
      ["", "A closed loop has four parts. I'm building them in order."],
      ["Readout", "One dry channel at the temple against an ear reference, on a consumer amplifier. The question is not whether lapses have an EEG signature in the lab; they do, seconds ahead. It is whether one dry channel on a head that moves keeps enough of it to time anything."],
      ["Decision", "A per-person threshold on a slow, predictive feature, tuned for few false alarms rather than high recall. A push that comes too often is ignored within a week."],
      ["Lever", "One brief haptic pulse, only when the readout calls, only inside a block the person started. No continuous stimulation, no score to chase."],
      ["Test", "The one comparison that matters: the same number of pulses on a yoked random schedule. If timed does not beat random on the next minute of behaviour, there is no product, only a vibration."],
      ["Scope", "Mental states, not neurological disease. Focus first because it has a behavioural ground truth every few seconds. Sleep has a readout and no lever that fits a routine. Rumination has neither, yet."]
    ],
    weather: [
      { key: "focus", word: "can't focus" },
      { key: "sleep", word: "can't sleep" },
      { key: "thought", word: "a thought that won't stop" },
      { key: "energy", word: "no energy" }
    ],
    chips: { focus: "focus · on the bench", sleep: "sleep · outlined", thought: "a thought that loops · outlined", energy: "energy · not yet" }
  },
  looking: "Three kinds of people: someone who has this problem and will tell me the truth about it, a PI with a dataset and a question, and someone who likes soldering as much as I do.",
  // the longer version of the opening story, shown under a toggle
  longer: [
    "Things we now fix without a second thought used to be a sentence. A hundred years ago bad eyesight was fate; now you put on glasses and forget about them. If you're tired, you rest. If you hurt your leg, you don't let it rot: you know there is a brace, a physio, a surgeon.",
    "The brain gets none of that. When something goes wrong in it, not the neurological kind but the ordinary kind, you can't start, you can't sleep, a thought loops for hours, the usual answer is to try harder, and the rest is luck.",
    "I want a different habit. Treat the brain like any other organ you look after: measure the state you're in, get something back the same day, and have a lever you can pull. Not a cure, a routine. Sitting down to work and putting on the glasses, the way you'd put on running shoes.",
    "Most of what I've built so far is the measuring half. The lever is the half nobody has done properly, which is why it is a missing piece on the brain."
  ],
  projects: [
    { key: "ad", then: "Shanghai, high school. I wanted to know whether one molecule could move a disease, and learned how slowly real biology answers.", how: "Four groups of mice (normal, normal + drug, AD, AD + drug), eight weeks of nano-encapsulated isoorientin. Mass-spectrometry proteomics on brain tissue, then GO/KEGG and protein-interaction analysis to pick a target; western blot and qPCR to confirm it.", result: "Nt5c1a was sharply reduced in the AD mice; treatment brought it to roughly 2× (mRNA) and 3× (protein) of the untreated AD level, still short of normal. A partial rescue and a candidate axis, not a therapy.", figure: "", figcaption: "Western blot and qPCR of Nt5c1a across the four groups", wherePlain: "The memory part that Alzheimer's hits first", blurbPlain: "A molecule from bamboo leaves, given to mice bred to get Alzheimer's. It nudged one protein part of the way back toward normal. High school science, done properly: real mice, real measurements.", year: "2023", title: "Isoorientin and Nt5c1a", color: "#B08A70",
      regions: ["lh-entorhinal", "lh-parahippocampal", "rh-entorhinal", "rh-parahippocampal"],
      where: "Entorhinal cortex, where Alzheimer's begins",
      blurb: "The main flavonoid in bamboo leaves, given to APP/PS1 mice for eight weeks. Proteomics pointed to Nt5c1a; the drug brought it part of the way back, about 2× mRNA and 3× protein against untreated AD mice.",
      status: "High school, Shanghai Pinghe, supervised at Beijing Forestry University.",
      links: [{ label: "Paper source", href: "https://github.com/zhangjiashu0612/AD-isoorientin-paper" }],
      signal: "bars" },
    { key: "ssvep", then: "High school still. The first time a brain signal did something on a screen because I asked it to.", how: "32 targets at 8 to 14.2 Hz in 0.2 Hz steps on a 26-letter pinyin keyboard with six candidate slots, read from an 8-channel OpenBCI Cyton at 250 Hz through BrainFlow and LSL. Decoders: PSDA, CCA, FBCCA, TRCA. A pinyin language model (character frequency, word bigrams) ranks candidates.", result: "Offline benchmarks on the Wang 2016 set in the usual range (FBCCA about 90 %, TRCA about 95 % at two-second windows). The language model takes a character from six or more gazes down to one or two. 36 tests pass.", figure: "", figcaption: "", wherePlain: "The part that sees", blurbPlain: "Stare at a square that flickers twelve times a second and your visual cortex flickers back at the same rate. Read that from the scalp and you can type by looking. Mine typed Chinese.", year: "2024", title: "A Chinese speller you steer with your eyes", color: "#C2A05A",
      regions: ["lh-lateraloccipital", "rh-lateraloccipital", "lh-pericalcarine", "rh-pericalcarine"],
      where: "Visual cortex, where a flicker becomes a frequency",
      blurb: "32 targets flickering at 8 to 14.2 Hz, read from an 8-channel OpenBCI Cyton. A pinyin language model with bigram prediction cuts the gazes per character from six or more to one or two.",
      status: "High school, with Prof. Qing Cai's group at ECNU.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/SSVEP-BCI-Project" }],
      signal: "ssvep" },
    { key: "meg", then: "First year at Illinois. I wanted to see how far the decoding papers really go when you rebuild them yourself.", how: "Five stages: preprocessing, GPT-2 layer-8 word embeddings, a multi-subject contrastive encoder (dilated convolutions, a per-subject linear layer, InfoNCE with Pearson similarity, after Défossez 2023 and Wang 2024), retrieval at 3, 5 and 10 s, then beam-search text generation.", result: "The pipeline runs end to end on smoke tests. Real-data preprocessing, event parsing and retrieval convergence are untested, because the full run needs a 24 GB GPU for a day or more.", figure: "", figcaption: "", wherePlain: "The part that hears words", blurbPlain: "A magnetic scanner records the brain while people listen to stories. I rebuilt a method that tries to guess the words back from the recording. The code works; it never got its big training run.", year: "2025", title: "Words out of MEG", color: "#7B93BD",
      regions: ["lh-superiortemporal", "lh-bankssts", "lh-transversetemporal"],
      where: "Auditory and language cortex",
      blurb: "Tang et al.'s 2023 semantic decoder, moved from fMRI to MEG on MEG-MASC: a contrastive encoder, GPT-2 embeddings, beam search. Written and smoke-tested; the full training run needs a GPU I didn't have.",
      status: "A learning project, not a lab output.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/MEG-to-Text-decoding" }],
      signal: "meg" },
    { key: "hcp", then: "The lab's methods, rebuilt from the papers before I was anywhere near the lab's data.", how: "Group HMM with four states on an ICA-300 parcellation of HCP resting-state fMRI, no global-signal regression, osl-dynamics with an hmmlearn fallback. Per subject: fractional occupancy and transition probabilities. Extensions: a Schaefer-200 robustness check, task-versus-rest repertoires, test-retest ICC(3,1).", result: "On synthetic data the method behaves: occupancy ICC 0.68 to 0.91 across states, transition ICC 0.47. Those are checks of the code, not findings. The real HCP run waits on data access after the BALSA migration; family structure in HCP is a known gap.", figure: "", figcaption: "Reliability of state occupancy on synthetic data", wherePlain: "The network that comes on when you rest", blurbPlain: "The resting brain hops between a few patterns, like weather. I rebuilt a published way of finding those patterns and measuring how long each one lasts.", year: "2026", title: "Brain states as a Markov chain", color: "#779E84",
      regions: ["rh-inferiorparietal", "rh-precuneus", "rh-posteriorcingulate"],
      where: "Default-mode hubs",
      blurb: "Connectome state dynamics on HCP resting-state fMRI, after Jun et al. 2022 and 2025: a group HMM with four states on an ICA-300 parcellation, with occupancy, transition and test-retest reliability. Validated on synthetic data; the real run waits on data access.",
      status: "Method demonstration.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/hcp-hmm-dynamics" }],
      signal: "states" },
    { key: "dfc", then: "A dish of neurons and thirty brains through the same code, to feel where the maths stops meaning the same thing.", how: "Sliding-window correlation, then k-means into connectivity states, written once and pointed at two inputs: 60-electrode spike trains from a developing culture (Wagenaar 2006, day 4 to 25, 100 ms bins) and 30 ABIDE resting-state subjects on the CC200 atlas.", result: "A figure of the states at each scale, side by side. The README says it plainly: a practice framework, no claim that the states mean the same thing at both scales.", figure: "", figcaption: "The same state analysis at two scales", wherePlain: "Parietal cortex (placed here, not where it happened)", blurbPlain: "The same code run on two very different things: a dish of 60 living neurons and 30 whole human brains. Same maths, two scales.", year: "2026", title: "One pipeline, two scales", color: "#6FA3A6",
      regions: ["rh-supramarginal", "rh-superiorparietal"],
      where: "Parietal cortex, placed here for display",
      blurb: "The same sliding-window dynamic connectivity code run on 60 cultured neurons on a microelectrode array (Wagenaar 2006) and on 30 resting-state brains from ABIDE. A framework exercise, not a finding.",
      status: "Practice.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/cross-scale-dfc-demo" }],
      signal: "dfc" },
    { key: "n400", then: "A course project that turned into a question I still like: what does the brain predict over?", how: "Six language models that differ only in what they predict over: two graph models (linear adjacency, syntactic dependency), PPMI-SVD, word2vec, a Kneser-Ney n-gram, an LSTM, with GPT-2 as the ceiling. Graph similarities become probabilities by random walk with restart, so every model yields a surprisal. Scored against ERP CORE N400 (Biosemi, 10 of 40 participants downloaded) and the Frank 2015 reading ERPs.", result: "The relatedness effect replicated (−5.3 µV, p = .013). The dependency graph was the best single-trial predictor; in the 24-participant set the n-gram kept unique variance while phrase-structure syntax did not, so the syntax-over-adjacency hypothesis was not supported.", figure: "", figcaption: "The N400 waveform, related against unrelated", wherePlain: "The part that gets surprised by a word", blurbPlain: "When a sentence ends with a word you didn't expect, the brain gives a small jolt about 400 ms later. I tested which kind of language model best predicts that jolt.", year: "2026", title: "What does the brain predict over?", color: "#9480B1",
      regions: ["lh-middletemporal", "lh-inferiortemporal"],
      where: "Left temporal cortex, where the N400 is generated",
      blurb: "Six language models that differ only in what they predict over, scored against the N400 in ERP CORE and Frank et al. 2015. The relatedness effect replicated (−5.3 µV). A dependency graph was the best single-trial predictor, but syntax did not beat plain adjacency.",
      status: "BCOG 200 final project, Illinois.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/BCOG-200-" }],
      signal: "erp" },
    { key: "a3", then: "The question I actually care about, asked on public data: what is the brain doing in the seconds before attention slips?", how: "Public gradCPT EEG-fMRI (ds006040). Brain states from the fMRI, behaviour from reaction-time variability, and the question whether default-mode states take up more of the time before attention slips.", result: "In progress. First-pass numbers exist but belong in a paper, not here.", figure: "", figcaption: "", wherePlain: "The network that comes on when your mind wanders", blurbPlain: "People do a boring task inside a scanner. I'm looking at what the brain was doing in the seconds before their attention slipped.", year: "2026 →", title: "The seconds before a lapse", color: "#BE8591",
      regions: ["lh-inferiorparietal", "lh-precuneus", "lh-posteriorcingulate", "lh-isthmuscingulate"],
      where: "Default-mode network, left",
      blurb: "Simultaneous EEG-fMRI during a sustained-attention task: do default-mode states occupy more of the time before attention drifts? Public gradCPT data, ongoing.",
      status: "Undergraduate research, Illinois.",
      links: [],
      signal: "zone" },
    { key: "focuskit", then: "All of the above, pointed at one electrode and one tap.", how: "One dry electrode at the temple, a reference at the ear, an OpenBCI Cyton for now. Detection runs on the device; the only output is a single tap from a small motor.", result: "A works-like unit by the end of the year, then the count that matters: does a tap timed by the readout beat a tap at random?", figure: "", figcaption: "", wherePlain: "Under the left temple, where the sensor sits", blurbPlain: "Glasses with one tiny sensor at the temple. They notice when you've drifted off, and tap you once. I'm building the first working one now.", year: "2026 →", title: "FocusKit", color: "#C4573A",
      regions: ["lh-parsorbitalis", "lh-parstriangularis", "lh-temporalpole"],
      where: "Under the left temple, where the electrode sits",
      blurb: "Glasses with one dry electrode at the temple. They notice the moment you've stopped, and tap you back. Once. Quietly. Building the works-like unit now on an OpenBCI Cyton.",
      status: "Founder.",
      links: [{ label: "focuskit.org", href: "https://www.focuskit.org" }],
      signal: "slow" }
  ],
  missing: [
    { key: "lever", titlePlain: "A tap that actually helps", wherePlain: "The part that feels a touch on the temple", questionPlain: "If the glasses tap you at the right moment, do you come back faster than if they tapped at random? Nobody has counted it properly. Everything depends on that count.", title: "A lever that works",
      regions: ["rh-postcentral"],
      where: "Somatosensory cortex, where a tap on the left temple lands",
      question: "Does a tap timed by your own brain beat a random one? Nobody has counted it properly. That count is the whole product." },
    { key: "sleep", titlePlain: "The same thing, at night", wherePlain: "The part where deep-sleep waves are biggest", questionPlain: "Something you'd wear to bed that knows how you slept, and does one gentle thing about it.", title: "The same question, at night",
      regions: ["rh-superiorfrontal"],
      where: "Frontal cortex, where slow waves are largest",
      question: "A readout of sleep you'd trust from one dry electrode, and something gentle that changes what comes next." },
    { key: "thought", titlePlain: "A thought that won't stop", wherePlain: "The part that keeps chewing on things", questionPlain: "Everything above measures. Nothing I have yet changes this one.", title: "A thought that won't stop",
      regions: ["rh-rostralanteriorcingulate", "rh-medialorbitofrontal", "rh-frontalpole"],
      where: "Anterior cingulate and medial prefrontal cortex",
      question: "Everything above reads states. Nothing I have changes this one yet." }
  ]
};
