// Content of the site. Edit this file to change what the page says; main.js only reads it.
// regions: Desikan-Killiany names as in assets/brain.json (lh-/rh- prefix). Where a piece sits is for display.
window.SITE = {
  email: "zhangjiashu0612@gmail.com",
  github: "https://github.com/zhangjiashu0612",
  cv: "",                      // path to a PDF, e.g. "assets/lucas-zhang-cv.pdf"; empty = no CV link shown
  photo: "assets/lucas.jpg",   // a portrait, 3:4 works best
  photoHead: { x: 0.51, y: 0.39, crown: 0.18 },   // where the head is in that photo: centre x, centre y, top of the head, as fractions of the image
  who: [
    "EnterpriseWorks 204, 60 Hazelwood Drive",
    "Champaign, Illinois 61820"
  ],
  hello: {
    hey: "hi, this is Lucas.",
    h1: "I'm dedicated to building closed-loop systems for neuromodulation.",
    lead: "If you scroll down, you'll see what I've done so far.",
    toc: ""
  },
  areas: [
    { title: "Where I started", keys: ["ad"] },
    { title: "Decoding", keys: ["ssvep", "meg"] },
    { title: "Behaviour and language", keys: ["n400"] },
    { title: "Whole-brain dynamics", keys: ["hcp", "dfc", "a3"] },
    { title: "Hardware", keys: ["focuskit"] }
  ],
  projects: [
    { key: "ad", year: "2023", title: "Isoorientin and Nt5c1a", color: "#B08A70",
      regions: ["lh-entorhinal", "lh-parahippocampal", "rh-entorhinal", "rh-parahippocampal"],
      where: "APP/PS1 mice, a proteomics screen, and one protein",
      blurb: "I joined this project because I wanted to know what consciousness is, and I thought the way in was from the bottom: trace a degeneration pathway from molecules to cognition, then run it backwards. Alzheimer's looked like the one place where cognitive decline maps onto molecular pathology. We gave APP/PS1 mice eight weeks of nano-encapsulated isoorientin, the main flavonoid in bamboo leaves, and looked for a target in the proteome.",
      status: "High school. Shanghai Pinghe, with Prof. Li's lab at Beijing Forestry University, 2023.",
      then: "It didn't work the way I imagined. The molecular layer and the cognitive layer are separated by many levels of organization that don't reduce cleanly to one another. That is when I turned around and started from the top: whole-brain dynamics, EEG, behaviour.",
      links: [{ label: "Paper source", href: "https://github.com/zhangjiashu0612/AD-isoorientin-paper" }],
      signal: "bars" },
    { key: "ssvep", year: "2024", title: "A Chinese speller you steer with your eyes", color: "#C2A05A",
      regions: ["lh-lateraloccipital", "rh-lateraloccipital", "lh-pericalcarine", "rh-pericalcarine"],
      where: "Visual cortex",
      blurb: "An SSVEP brain-computer interface I built in high school, under Prof. Qing Cai at ECNU. You look at one letter on a flickering keyboard, the EEG over your visual cortex picks up that flicker, and a pinyin language model rides the prediction from there: w, then 我, then 想要, then 喝水. It cuts the usual six or more gazes per character down to one or two.",
      status: "High school, with Prof. Qing Cai's group at ECNU.",
      then: "The first time a brain signal did something on a screen because I asked it to.",
      how: "32 targets, each flickering at its own frequency between 8 and 14.2 Hz. The signal came from an 8-channel OpenBCI Cyton over the back of the head. A CCA-family classifier decides which target you are looking at; the language model does the rest in software, so the same code runs on a simulated signal and on the real headset.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/SSVEP-BCI-Project" }],
      signal: "ssvep" },
    { key: "meg", year: "2024", title: "Words out of MEG", color: "#7B93BD",
      regions: ["lh-superiortemporal", "lh-bankssts", "lh-transversetemporal"],
      where: "Auditory and language cortex",
      blurb: "A replication of Tang et al. 2023, the fMRI language decoder, moved to MEG on the open MEG-MASC dataset. I started it in Google Colab in high school and ran three subjects during an internship at ECNU. The computer with those results is gone, so this year I rebuilt the pipeline from scratch and published it. A learning project, not a lab output.",
      status: "Started in high school; rebuilt and published in 2026.",
      then: "I wanted to understand the Tang et al. pipeline by writing it myself. Nobody had put a MEG-to-text replication on MEG-MASC in public, so I did.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/MEG-to-Text-decoding" }],
      signal: "meg" },
    { key: "hcp", year: "2026", title: "Brain states as a Markov chain", color: "#779E84",
      regions: ["rh-inferiorparietal", "rh-precuneus", "rh-posteriorcingulate"],
      where: "Default-mode hubs",
      blurb: "The methods of Jun et al. 2022 and 2025, rebuilt from the papers: a hidden Markov model over HCP resting-state fMRI, four states, and how much time each person spends in each. Validated on synthetic data; the real HCP run is waiting on data access. A methods exercise, not new science.",
      status: "Method demonstration.",
      then: "I rebuilt the lab's methods from the papers before I was anywhere near the lab's data.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/hcp-hmm-dynamics" }],
      signal: "states" },
    { key: "dfc", year: "2026", title: "One pipeline, two scales", color: "#6FA3A6",
      regions: ["rh-supramarginal", "rh-superiorparietal"],
      where: "Parietal cortex, placed here for display",
      blurb: "The same sliding-window connectivity analysis, run on a dish of cultured neurons recorded for three weeks and on thirty resting human brains. The point was to apply one procedure consistently at two very different scales and see what the parallel looks like. It produces readable states at both. That does not make the states the same thing.",
      status: "Practice.",
      then: "I wanted to feel where the maths stops meaning the same thing.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/cross-scale-dfc-demo" }],
      signal: "dfc" },
    { key: "n400", year: "2026", title: "What does the brain predict over?", color: "#9480B1",
      regions: ["lh-middletemporal", "lh-inferiortemporal"],
      where: "Left temporal cortex",
      blurb: "When the brain predicts the next word, what kind of representation is it predicting over? I built six language models that differ only in how they define context, trained them on the same text, and scored each against the N400 in human EEG. The hypothesis, from Prof. Willits' work, was that a graph built on syntactic dependencies would beat one built on linear adjacency. The dependency graph predicted single trials best, but syntax did not beat plain adjacency.",
      status: "BCOG 200 final project, Illinois.",
      then: "A course project that turned into a question I still like.",
      links: [{ label: "GitHub", href: "https://github.com/zhangjiashu0612/BCOG-200-" }],
      signal: "erp" },
    { key: "a3", year: "2026 →", title: "The seconds before a lapse", color: "#BE8591",
      regions: ["lh-inferiorparietal", "lh-precuneus", "lh-posteriorcingulate", "lh-isthmuscingulate"],
      where: "Default-mode network, left",
      blurb: "Simultaneous EEG and fMRI while people do a long, boring attention task, on a public dataset. I'm looking at what the brain is doing in the seconds before attention slips, and whether the default-mode network takes up more of that time. Ongoing.",
      status: "Undergraduate research, Illinois.",
      then: "The question I actually care about.",
      links: [],
      signal: "zone" },
    { key: "focuskit", year: "2026 →", title: "FocusKit", color: "#C4573A",
      regions: ["lh-parsorbitalis", "lh-parstriangularis", "lh-temporalpole"],
      where: "Under the left temple, where the electrode sits",
      blurb: "Glasses with one dry electrode at the temple. They notice the moment you've stopped, and tap you back. Once. Quietly. I'm building the first working unit now.",
      status: "Founder.",
      then: "Everything above, pointed at one electrode and one tap.",
      how: "One dry electrode at the temple and a reference at the ear, on an OpenBCI Cyton for now. The detection runs on the device. The only output is a single tap from a small motor.",
      links: [{ label: "focuskit.org", href: "https://www.focuskit.org" }],
      signal: "slow" }
  ],
  missing: [],
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
  // Four directions I want to take neuromodulation in later, with my current thinking on each. Not shown on the page yet;
  // the regions are still used to place words in the story animation.
  states: [
    { key: "focus", label: "focus", regions: ["lh-parsorbitalis", "lh-parstriangularis", "lh-temporalpole"], view: { theta: -2.0, phi: 1.3 }, hide: null,
      card: "Focus is where I am starting, because it is the one state with a behavioural ground truth every few seconds. My current thinking: read it from one channel at the temple, act once with a tap, and judge the loop by whether a timed tap beats a random one." },
    { key: "sleep", label: "sleep", regions: ["rh-superiorfrontal", "lh-superiorfrontal"], view: { theta: 0.9, phi: 0.55 }, hide: null,
      card: "Sleep is the second direction. The readout has existed for seventy years; what is missing is a lever gentle enough to live in a nightly routine. My current thinking: timed sound or touch locked to the slow waves, tested the same way, timed against random." },
    { key: "thought", label: "a thought that loops", regions: ["rh-rostralanteriorcingulate", "rh-medialorbitofrontal", "rh-frontalpole"], view: { theta: -1.6, phi: 1.45 }, hide: "L",
      card: "A thought that loops is the third. It lives on the midline, where an electrode on the outside reads poorly, so the readout has to come from behaviour and the body first. My current thinking: start from the moment a loop begins, not from its content." },
    { key: "energy", label: "energy", regions: ["rh-caudalanteriorcingulate", "lh-caudalanteriorcingulate"], view: { theta: -1.6, phi: 1.4 }, hide: "L",
      card: "Energy is the fourth and the least neural: heart, breath, sleep debt. The scalp sees only its shadow. My current thinking: this one is read from the body and nudged through the day's structure, not through the head." }
  ],
  build: {
    story: [
      "If you hurt your leg, you don't just let it get worse. You know there is surgery if it comes to that. If you're tired you rest. For the body we have a whole routine of noticing that something is off and doing something about it.",
      "For the mind we mostly don't have that. When I can't start working, or can't sleep, or keep turning the same thought over, the honest answer about what to do is still to try harder, and maybe see someone if it gets bad enough. There is very little in between.",
      "What I want to build is that in-between, a way to read what state you're in, do one small thing about it, and see whether it worked, as ordinary as eating when you're hungry. I don't mean treating a disease. I mean the everyday version, the way glasses are the everyday version of not seeing well.",
      "I started with focus because it is the state I can actually measure right now, with one electrode at the temple, and because you can tell within seconds whether the nudge did anything.",
      "There is one thing I care about more than the hardware. The attention economy already reads people all day, how long they stay, what pulls them back, and uses that to keep them there. That is other people deciding where your attention goes. I want to build the version where you decide. So the signal stays on the device and nobody else sees it. The whole reason for building this is to give you more control over your own head. Nobody else needs a window into it."
    ],
    mechanics: [
      ["", "There are four parts, and I'm building them in this order."],
      ["Readout", "Dry electrodes at the mastoid and T7/T8, referenced to the ear, on a consumer amplifier for now. Lapses do show up in EEG a few seconds before they happen, at least in a lab, with gel electrodes and a still head. What I don't know yet is how much of that survives a dry channel on someone who is moving around. That is what I'm measuring first."],
      ["Decision", "A threshold set per person on a slow feature that leads the lapse, tuned so it rarely fires when it shouldn't. I would rather miss some lapses than push too often. From the interviews I've done, people switch off anything that nags them within about a week."],
      ["Lever", "I'm thinking about haptics for now, a short vibration, only when the readout says so, and only during a block of work the person started themselves. No score or streak to keep up."],
      ["Test", "Compare it with the same number of vibrations delivered at random times. If a timed push doesn't do better than a random one on what the person does in the next minute, then it doesn't work, and I would rather know it now."],
      ["Scope", "Ordinary mental states, not neurological disease. Focus first, because you can check it against behaviour every few seconds."],
      ["Privacy", "Detection and the decision to push both run on the device. The only thing that leaves the frame is the tap itself. There is no account, and nothing is uploaded unless someone decides to share data for research, which they can take back."]
    ],
    weather: [
      { key: "focus", word: "can't focus" },
      { key: "sleep", word: "can't sleep" },
      { key: "thought", word: "a thought that won't stop" },
      { key: "energy", word: "no energy" }
    ],
    chips: {}
  },
  looking: "Careful skeptics, curious people, and biohackers."
};
