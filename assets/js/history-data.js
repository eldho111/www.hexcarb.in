/* HexCarb history timeline dataset */
(function (windowObj) {
  "use strict";

  var milestones = [
    {
      id: "go_oxidation_1958",
      year_start: 1958,
      year_end: 1958,
      year_label: "1958",
      title: "A chemistry recipe that still powers graphene production today",
      summary:
        "The Hummers method for oxidizing graphite — developed in 1958 — remains the starting point for making graphene oxide in labs and factories worldwide.",
      material_family: "Graphene oxide (GO)",
      breakthrough_type: "Synthesis chemistry",
      current_use_snapshot:
        "Graphene oxide chemistry is still widely used in coatings, membranes, composites, and conductive inks.",
      image: "/assets/media/history/timeline-v2-01.svg",
      references: [
        {
          reference_id: "hummers_1958",
          title:
            "Hummers, W. S.; Offeman, R. E. Preparation of Graphitic Oxide. Journal of the American Chemical Society (1958).",
          url: "https://doi.org/10.1021/ja01539a017",
          source_type: "journal",
          publication_year: 1958,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "vgcf_1976",
      year_start: 1976,
      year_end: 1976,
      year_label: "1976",
      title: "Growing carbon fibers from gas — the technique behind nanotubes",
      summary:
        "Scientists learned to grow thin carbon fibers from vapor in the 1970s. That same process knowledge later made nanotube manufacturing possible.",
      material_family: "Carbon nanofibers / hybrid carbon systems",
      breakthrough_type: "Process foundation",
      current_use_snapshot:
        "The techniques developed here are still used to make conductive additives, strong composites, and carbon nanofibers.",
      image: "/assets/media/history/timeline-v2-02.svg",
      references: [
        {
          reference_id: "oberlin_endo_koyama_1976",
          title:
            "Oberlin, A.; Endo, M.; Koyama, T. Filamentous growth of carbon through benzene decomposition. Journal of Crystal Growth (1976).",
          url: "https://doi.org/10.1016/0022-0248(76)90115-9",
          source_type: "journal",
          publication_year: 1976,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "fullerene_1985",
      year_start: 1985,
      year_end: 1985,
      year_label: "1985",
      title: "A soccer-ball-shaped carbon molecule opens a new era",
      summary:
        "The discovery of C60 buckminsterfullerene showed carbon could form perfect molecular cages — expanding possibilities far beyond graphite and diamond.",
      material_family: "Fullerenes",
      breakthrough_type: "Allotrope discovery",
      current_use_snapshot:
        "Fullerenes are still used in organic electronics, solar cell research, and specialty chemical formulations.",
      image: "/assets/media/history/timeline-v2-03.svg",
      references: [
        {
          reference_id: "kroto_1985",
          title:
            "Kroto, H. W. et al. C60: Buckminsterfullerene. Nature (1985).",
          url: "https://doi.org/10.1038/318162a0",
          source_type: "journal",
          publication_year: 1985,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "detonation_nanodiamond_1988",
      year_start: 1988,
      year_end: 1989,
      year_label: "Late 1980s",
      title: "Explosions create nanoscale diamonds — at industrial scale",
      summary:
        "Controlled detonation methods made it possible to produce nanodiamond particles in bulk — opening the door to ultra-hard polishing and coating applications.",
      material_family: "Nanodiamond",
      breakthrough_type: "Scale-up pathway",
      current_use_snapshot:
        "Nanodiamond is used in lubricants, precision polishing, wear-resistant coatings, and biomedical surface treatments.",
      image: "/assets/media/history/timeline-v2-04.svg",
      references: [
        {
          reference_id: "dolmatov_2007",
          title:
            "Dolmatov, V. Y. Detonation-synthesis nanodiamonds: synthesis, structure and properties. Russian Chemical Reviews (2007).",
          url: "https://doi.org/10.1070/RC2007v076n04ABEH003658",
          source_type: "journal",
          publication_year: 2007,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "cnt_1991",
      year_start: 1991,
      year_end: 1991,
      year_label: "1991",
      title: "The paper that launched the nanotube revolution",
      summary:
        "Iijima's 1991 electron microscopy images of multi-walled carbon nanotubes sparked worldwide research and turned nanotubes into a household name in science.",
      material_family: "MWCNT",
      breakthrough_type: "Foundational observation",
      current_use_snapshot:
        "MWCNTs are now used to add conductivity and strength to plastics, coatings, and electromagnetic shielding materials.",
      image: "/assets/media/history/timeline-v2-05.svg",
      references: [
        {
          reference_id: "iijima_1991",
          title:
            "Iijima, S. Helical microtubules of graphitic carbon. Nature (1991).",
          url: "https://doi.org/10.1038/354056a0",
          source_type: "journal",
          publication_year: 1991,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "swcnt_1993",
      year_start: 1993,
      year_end: 1993,
      year_label: "1993",
      title: "Single-walled nanotubes — thinner, purer, and electronically tuneable",
      summary:
        "Using metal catalysts, researchers grew single-walled carbon nanotubes for the first time — opening the door to controllable electronic properties.",
      material_family: "SWCNT",
      breakthrough_type: "Catalytic synthesis",
      current_use_snapshot:
        "SWCNTs are now used in conductive films, sensors, thermal interfaces, and high-performance electronics.",
      image: "/assets/media/history/timeline-v2-06.svg",
      references: [
        {
          reference_id: "bethune_1993",
          title:
            "Bethune, D. S. et al. Cobalt-catalysed growth of carbon nanotubes with single-atomic-layer walls. Nature (1993).",
          url: "https://doi.org/10.1038/363605a0",
          source_type: "journal",
          publication_year: 1993,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "swnt_ropes_1996",
      year_start: 1996,
      year_end: 1996,
      year_label: "1996",
      title: "Nanotube ropes reveal their true electrical potential",
      summary:
        "By assembling purified nanotubes into crystalline ropes, scientists measured their electrical and structural properties — key data for engineering applications.",
      material_family: "SWCNT",
      breakthrough_type: "Characterization advance",
      current_use_snapshot:
        "Quality control for modern SWCNT products still relies on the same characterization methods developed here.",
      image: "/assets/media/history/timeline-v2-07.svg",
      references: [
        {
          reference_id: "thess_1996",
          title:
            "Thess, A. et al. Crystalline Ropes of Metallic Carbon Nanotubes. Science (1996).",
          url: "https://doi.org/10.1126/science.273.5274.483",
          source_type: "journal",
          publication_year: 1996,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "go_structure_1998",
      year_start: 1998,
      year_end: 1998,
      year_label: "1998",
      title: "Understanding graphene oxide — the key to controlling it",
      summary:
        "Detailed spectroscopy work revealed the actual structure of graphene oxide, giving chemists better control over how to process and reduce it.",
      material_family: "Graphene oxide (GO)",
      breakthrough_type: "Structure model",
      current_use_snapshot:
        "GO and reduced GO are used today in anti-static coatings, water filtration membranes, conductive inks, and composites.",
      image: "/assets/media/history/timeline-v2-08.svg",
      references: [
        {
          reference_id: "lerf_1998",
          title:
            "Lerf, A. et al. Structure of Graphite Oxide Revisited. Journal of Physical Chemistry B (1998).",
          url: "https://doi.org/10.1021/jp9731821",
          source_type: "journal",
          publication_year: 1998,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "graphene_isolation_2004",
      year_start: 2004,
      year_end: 2004,
      year_label: "2004",
      title: "Graphene isolated for the first time — and it works",
      summary:
        "Using sticky tape on graphite, researchers isolated single-atom-thick graphene and proved it conducted electricity — launching a global research boom.",
      material_family: "Graphene",
      breakthrough_type: "Device milestone",
      current_use_snapshot:
        "Graphene is now used or tested in coatings, heat spreaders, barrier films, sensors, and flexible electronics.",
      image: "/assets/media/history/timeline-v2-09.svg",
      references: [
        {
          reference_id: "novoselov_2004",
          title:
            "Novoselov, K. S. et al. Electric Field Effect in Atomically Thin Carbon Films. Science (2004).",
          url: "https://doi.org/10.1126/science.1102896",
          source_type: "journal",
          publication_year: 2004,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "thermal_graphene_2008",
      year_start: 2008,
      year_end: 2008,
      year_label: "2008",
      title: "Graphene conducts heat better than almost anything",
      summary:
        "Lab measurements showed graphene's thermal conductivity is among the highest ever recorded — making it a top candidate for cooling electronics.",
      material_family: "Graphene",
      breakthrough_type: "Property benchmark",
      current_use_snapshot:
        "Graphene-based materials are now used in thermal pads, heat-spreading films, and electronics packaging.",
      image: "/assets/media/history/timeline-v2-10.svg",
      references: [
        {
          reference_id: "balandin_2008",
          title:
            "Balandin, A. A. et al. Superior Thermal Conductivity of Single-Layer Graphene. Nano Letters (2008).",
          url: "https://doi.org/10.1021/nl801318y",
          source_type: "journal",
          publication_year: 2008,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "cvd_graphene_2009",
      year_start: 2009,
      year_end: 2009,
      year_label: "2009",
      title: "Growing graphene on copper foil — a manufacturing breakthrough",
      summary:
        "By growing graphene on copper foil using chemical vapor deposition, researchers showed it was possible to make large sheets — moving graphene toward real manufacturing.",
      material_family: "Graphene",
      breakthrough_type: "Scale process",
      current_use_snapshot:
        "CVD graphene films are now used in R&D and pilot production for sensors, shielding, and specialty coatings.",
      image: "/assets/media/history/timeline-v2-01.svg",
      references: [
        {
          reference_id: "li_2009",
          title:
            "Li, X. et al. Large-Area Synthesis of High-Quality and Uniform Graphene Films on Copper Foils. Science (2009).",
          url: "https://doi.org/10.1126/science.1171245",
          source_type: "journal",
          publication_year: 2009,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "nobel_graphene_2010",
      year_start: 2010,
      year_end: 2010,
      year_label: "2010",
      title: "Graphene wins the Nobel Prize in Physics",
      summary:
        "Geim and Novoselov received the 2010 Nobel Prize for their graphene work, bringing massive research funding and industrial interest worldwide.",
      material_family: "Graphene",
      breakthrough_type: "Scientific recognition",
      current_use_snapshot:
        "The Nobel Prize triggered a wave of industry programs to qualify graphene for commercial products.",
      image: "/assets/media/history/timeline-v2-02.svg",
      references: [
        {
          reference_id: "nobel_graphene_2010",
          title:
            "Nobel Prize in Physics 2010 - Andre Geim and Konstantin Novoselov.",
          url: "https://www.nobelprize.org/prizes/physics/2010/summary/",
          source_type: "institutional",
          publication_year: 2010,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "graphene_membrane_2012",
      year_start: 2012,
      year_end: 2012,
      year_label: "2012",
      title: "Graphene membranes can filter water while blocking gases",
      summary:
        "Research showed that graphene-based membranes allow water to pass through while blocking other molecules — a breakthrough for filtration and barrier applications.",
      material_family: "Graphene / GO",
      breakthrough_type: "Application mechanism",
      current_use_snapshot:
        "Graphene membranes are being explored for water filtration, protective packaging, and anti-corrosion coatings.",
      image: "/assets/media/history/timeline-v2-03.svg",
      references: [
        {
          reference_id: "nair_2012",
          title:
            "Nair, R. R. et al. Unimpeded Permeation of Water Through Helium-Leak-Tight Graphene-Based Membranes. Science (2012).",
          url: "https://doi.org/10.1126/science.1211694",
          source_type: "journal",
          publication_year: 2012,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "cnt_scaling_review_2013",
      year_start: 2013,
      year_end: 2013,
      year_label: "2013",
      title: "Nanotubes go commercial — with manufacturing challenges mapped out",
      summary:
        "A landmark review catalogued the real challenges of producing nanotubes at scale: consistency, purity, and dispersion — the roadmap for industrial CNT.",
      material_family: "SWCNT / MWCNT",
      breakthrough_type: "Industrial readiness",
      current_use_snapshot:
        "The same quality challenges identified here — consistency, purity, dispersion — still define CNT procurement today.",
      image: "/assets/media/history/timeline-v2-04.svg",
      references: [
        {
          reference_id: "devolder_2013",
          title:
            "De Volder, M. F. L. et al. Carbon Nanotubes: Present and Future Commercial Applications. Science (2013).",
          url: "https://doi.org/10.1126/science.1222453",
          source_type: "journal",
          publication_year: 2013,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "vdw_systems_2015",
      year_start: 2015,
      year_end: 2016,
      year_label: "2015-2016",
      title: "Stacking different 2D materials together — like Lego for atoms",
      summary:
        "Researchers showed that layering graphene with other 2D materials creates hybrid structures with tuneable properties — a powerful design tool.",
      material_family: "Graphene / hybrid carbon systems",
      breakthrough_type: "System integration",
      current_use_snapshot:
        "Hybrid 2D stacks are now being tested in advanced electronics, sensors, and high-performance coatings.",
      image: "/assets/media/history/timeline-v2-05.svg",
      references: [
        {
          reference_id: "geim_grigorieva_2013",
          title:
            "Geim, A. K.; Grigorieva, I. V. Van der Waals heterostructures. Nature (2013).",
          url: "https://doi.org/10.1038/nature12385",
          source_type: "journal",
          publication_year: 2013,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "conductive_composites_2016",
      year_start: 2016,
      year_end: 2017,
      year_label: "2016-2017",
      title: "Carbon additives make plastics conductive — at production scale",
      summary:
        "CNT, graphene, and carbon black additives matured to the point where they could reliably add electrical conductivity and EMI shielding to mass-produced plastics.",
      material_family: "CNT / graphene / conductive carbon black systems",
      breakthrough_type: "Application scaling",
      current_use_snapshot:
        "Carbon-based conductive compounds are now in production for device housings, cables, coatings, and molded parts.",
      image: "/assets/media/history/timeline-v2-06.svg",
      references: [
        {
          reference_id: "kuilla_2010",
          title:
            "Kuilla, T. et al. Recent advances in graphene based polymer composites. Progress in Polymer Science (2010).",
          url: "https://doi.org/10.1016/j.progpolymsci.2010.07.005",
          source_type: "journal",
          publication_year: 2010,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "wearable_sensors_2018",
      year_start: 2018,
      year_end: 2019,
      year_label: "2018-2019",
      title: "Wearable tech needs flexible conductors — carbon delivers",
      summary:
        "The rise of smart watches, health monitors, and e-textiles drove demand for lightweight, flexible conductive materials based on carbon nanotubes and graphene.",
      material_family: "SWCNT / graphene / CNF",
      breakthrough_type: "Wearable transition",
      current_use_snapshot:
        "Carbon nanomaterials are now used in smart textiles, health sensors, and lightweight wiring for wearable devices.",
      image: "/assets/media/history/timeline-v2-07.svg",
      references: [
        {
          reference_id: "he_2019_wearable",
          title:
            "He, Q. et al. MXene- and graphene-based wearable sensors: a review of sensing materials and integration routes. Nanoscale (2019).",
          url: "https://doi.org/10.1039/C9NR04665A",
          source_type: "journal",
          publication_year: 2019,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "energy_storage_2020",
      year_start: 2020,
      year_end: 2021,
      year_label: "2020-2021",
      title: "Better batteries need better carbon — nanotubes and graphene step in",
      summary:
        "Battery and supercapacitor researchers turned to graphene and nanotube additives to improve conductivity and performance inside electrodes.",
      material_family: "Graphene / CNT",
      breakthrough_type: "Energy integration",
      current_use_snapshot:
        "Carbon nanomaterials are actively used in battery and supercapacitor development, especially for improving charge rate and conductivity.",
      image: "/assets/media/history/timeline-v2-08.svg",
      references: [
        {
          reference_id: "bonaccorso_2015_energy",
          title:
            "Bonaccorso, F. et al. Graphene, related two-dimensional crystals, and hybrid systems for energy conversion and storage. Science (2015).",
          url: "https://doi.org/10.1126/science.1246501",
          source_type: "journal",
          publication_year: 2015,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "thermal_tim_2023",
      year_start: 2022,
      year_end: 2023,
      year_label: "2022-2023",
      title: "Chips get hotter — carbon materials cool them down",
      summary:
        "As processors pack more power into smaller spaces, graphene and nanotube thermal pads and spreaders become critical for keeping electronics cool.",
      material_family: "Graphene / CNT / TIM hybrids",
      breakthrough_type: "Thermal management focus",
      current_use_snapshot:
        "Active development targets better thermal pads, more reliable interfaces, and scalable manufacturing of thermal products.",
      image: "/assets/media/history/timeline-v2-09.svg",
      references: [
        {
          reference_id: "malek_2021_tim_review",
          title:
            "Malek, M. et al. Advanced thermal interface materials: a review of materials, structures, and reliability challenges. Journal of Electronic Materials (2021).",
          url: "https://doi.org/10.1007/s11664-021-08921-0",
          source_type: "journal",
          publication_year: 2021,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      id: "ai_materials_2026",
      year_start: 2024,
      year_end: 2026,
      year_label: "2024-2026",
      title: "AI meets materials science — faster development, smarter choices",
      summary:
        "Machine learning and data-driven tools now help researchers screen materials faster, prioritise experiments, and reduce time-to-market.",
      material_family: "Hybrid carbon systems",
      breakthrough_type: "Workflow acceleration",
      current_use_snapshot:
        "Leading teams now combine lab experiments with AI-guided iteration to develop materials faster and make better decisions.",
      image: "/assets/media/history/timeline-v2-10.svg",
      references: [
        {
          reference_id: "butler_2018_ml_materials",
          title:
            "Butler, K. T. et al. Machine learning for molecular and materials science. Nature (2018).",
          url: "https://doi.org/10.1038/s41586-018-0337-2",
          source_type: "journal",
          publication_year: 2018,
          accessed_on: "2026-03-05"
        }
      ]
    }
  ];

  var milestoneEnhancements = {
    go_oxidation_1958: {
      confidence_level: "established",
      deployment_level: "deployed",
      impact_tags: ["synthesis", "go", "process_foundation"],
      fact_ids: ["fact_hummers_route", "fact_iso_standardization_need"]
    },
    vgcf_1976: {
      confidence_level: "established",
      deployment_level: "pilot",
      impact_tags: ["cnf", "catalysis", "manufacturing_route"],
      fact_ids: ["fact_cnt_commercial_signal"]
    },
    fullerene_1985: {
      confidence_level: "established",
      deployment_level: "pilot",
      impact_tags: ["allotrope", "molecular_carbon", "chemistry_platform"],
      fact_ids: ["fact_fullerene_allotrope"]
    },
    detonation_nanodiamond_1988: {
      confidence_level: "strong",
      deployment_level: "deployed",
      impact_tags: ["nanodiamond", "scale", "surface_engineering"],
      fact_ids: ["fact_cnt_commercial_signal"]
    },
    cnt_1991: {
      confidence_level: "established",
      deployment_level: "deployed",
      impact_tags: ["mwcnt", "foundational_observation", "conductive_networks"],
      fact_ids: ["fact_cnt_current_density", "fact_cnt_commercial_signal"]
    },
    swcnt_1993: {
      confidence_level: "established",
      deployment_level: "pilot",
      impact_tags: ["swcnt", "catalytic_growth", "high_purity"],
      fact_ids: ["fact_cnt_current_density"]
    },
    swnt_ropes_1996: {
      confidence_level: "strong",
      deployment_level: "pilot",
      impact_tags: ["swcnt", "transport", "characterization"],
      fact_ids: ["fact_cnt_current_density"]
    },
    go_structure_1998: {
      confidence_level: "established",
      deployment_level: "deployed",
      impact_tags: ["go", "structure_control", "reduction_routes"],
      fact_ids: ["fact_hummers_route"]
    },
    graphene_isolation_2004: {
      confidence_level: "established",
      deployment_level: "pilot",
      impact_tags: ["graphene", "2d_materials", "device_physics"],
      fact_ids: ["fact_graphene_strength"]
    },
    thermal_graphene_2008: {
      confidence_level: "strong",
      deployment_level: "pilot",
      impact_tags: ["graphene", "thermal_transport", "tim_interest"],
      fact_ids: ["fact_graphene_thermal_transport"]
    },
    cvd_graphene_2009: {
      confidence_level: "strong",
      deployment_level: "pilot",
      impact_tags: ["graphene", "cvd", "manufacturability"],
      fact_ids: ["fact_large_area_graphene"]
    },
    nobel_graphene_2010: {
      confidence_level: "established",
      deployment_level: "pilot",
      impact_tags: ["graphene", "institutional_validation", "research_acceleration"],
      fact_ids: ["fact_fullerene_allotrope"]
    },
    graphene_membrane_2012: {
      confidence_level: "strong",
      deployment_level: "pilot",
      impact_tags: ["graphene", "membranes", "selective_transport"],
      fact_ids: ["fact_graphene_impermeability"]
    },
    cnt_scaling_review_2013: {
      confidence_level: "established",
      deployment_level: "deployed",
      impact_tags: ["cnt", "commercialization", "quality_control"],
      fact_ids: ["fact_cnt_commercial_signal", "fact_iso_standardization_need"]
    },
    vdw_systems_2015: {
      confidence_level: "strong",
      deployment_level: "pilot",
      impact_tags: ["2d_hybrids", "system_integration", "interfaces"],
      fact_ids: ["fact_2d_integration_challenge"]
    },
    conductive_composites_2016: {
      confidence_level: "established",
      deployment_level: "deployed",
      impact_tags: ["composites", "emi_esd", "production_compounding"],
      fact_ids: ["fact_cnt_commercial_signal", "fact_iso_standardization_need"]
    },
    wearable_sensors_2018: {
      confidence_level: "strong",
      deployment_level: "pilot",
      impact_tags: ["wearables", "flexible_electronics", "sensing"],
      fact_ids: ["fact_graphene_strength"]
    },
    energy_storage_2020: {
      confidence_level: "strong",
      deployment_level: "deployed",
      impact_tags: ["energy_storage", "conductive_additives", "electrode_design"],
      fact_ids: ["fact_energy_pathways"]
    },
    thermal_tim_2023: {
      confidence_level: "strong",
      deployment_level: "pilot",
      impact_tags: ["tim", "thermal_management", "reliability"],
      fact_ids: ["fact_graphene_thermal_transport", "fact_2d_integration_challenge"]
    },
    ai_materials_2026: {
      confidence_level: "emerging",
      deployment_level: "pilot",
      impact_tags: ["materials_informatics", "workflow_speed", "screening"],
      fact_ids: ["fact_ai_materials_acceleration"]
    }
  };

  windowObj.HEXCARB_HISTORY_ERAS = [
    {
      id: "era_pre_1990",
      label: "Era 1",
      year_range: "Pre-1990",
      year_start: 1859,
      year_end: 1989,
      thesis: "Foundational chemistry and new carbon allotropes",
      confidence_level: "established"
    },
    {
      id: "era_1990_2004",
      label: "Era 2",
      year_range: "1990-2004",
      year_start: 1990,
      year_end: 2004,
      thesis: "CNT acceleration and graphene isolation",
      confidence_level: "established"
    },
    {
      id: "era_2005_2014",
      label: "Era 3",
      year_range: "2005-2014",
      year_start: 2005,
      year_end: 2014,
      thesis: "Property benchmarks and manufacturing pathways",
      confidence_level: "strong"
    },
    {
      id: "era_2015_2026",
      label: "Era 4",
      year_range: "2015-2026",
      year_start: 2015,
      year_end: 2026,
      thesis: "Deployment-focused qualification and digital workflows",
      confidence_level: "strong"
    }
  ];

  windowObj.HEXCARB_HISTORY_FACTS = [
    {
      fact_id: "fact_hummers_route",
      title: "A 1958 recipe still powers today's graphene oxide production",
      statement:
        "The Hummers oxidation method — nearly 70 years old — is still the most common starting point for making graphene oxide in labs and factories.",
      material_family: "Graphene oxide (GO)",
      confidence_level: "established",
      references: [
        {
          reference_id: "fact_hummers_1958",
          title: "Hummers, W. S.; Offeman, R. E. Preparation of Graphitic Oxide. JACS (1958).",
          url: "https://doi.org/10.1021/ja01539a017",
          source_type: "journal",
          publication_year: 1958,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_fullerene_allotrope",
      title: "New forms of carbon keep reshaping the industry",
      statement:
        "Fullerenes in 1985, then graphene's Nobel Prize in 2010 — each new carbon discovery rapidly changed what materials scientists thought was possible.",
      material_family: "Fullerenes / Graphene",
      confidence_level: "established",
      references: [
        {
          reference_id: "fact_kroto_1985",
          title: "Kroto, H. W. et al. C60: Buckminsterfullerene. Nature (1985).",
          url: "https://doi.org/10.1038/318162a0",
          source_type: "journal",
          publication_year: 1985,
          accessed_on: "2026-03-05"
        },
        {
          reference_id: "fact_nobel_physics_2010",
          title: "Nobel Prize in Physics 2010 - Geim and Novoselov.",
          url: "https://www.nobelprize.org/prizes/physics/2010/summary/",
          source_type: "institutional",
          publication_year: 2010,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_cnt_current_density",
      title: "Nanotubes can carry far more current than copper",
      statement:
        "In lab tests, individual carbon nanotubes handle current densities far beyond what copper wires can tolerate — a key reason for their use in electronics.",
      material_family: "SWCNT / MWCNT",
      confidence_level: "strong",
      references: [
        {
          reference_id: "fact_cnt_current_1998",
          title: "Tans, S. J. et al. Room-temperature transistor based on a single carbon nanotube. Nature (1998).",
          url: "https://www.nature.com/articles/29954",
          source_type: "journal",
          publication_year: 1998,
          accessed_on: "2026-03-05"
        },
        {
          reference_id: "fact_cnt_commercial_2013",
          title: "De Volder, M. F. L. et al. Carbon Nanotubes: Present and Future Commercial Applications. Science (2013).",
          url: "https://doi.org/10.1126/science.1222453",
          source_type: "journal",
          publication_year: 2013,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_graphene_strength",
      title: "Graphene is one atom thick but stronger than steel",
      statement:
        "Lab measurements show monolayer graphene has extraordinary strength for its thickness — one reason it's so valued for reinforced materials and coatings.",
      material_family: "Graphene",
      confidence_level: "established",
      references: [
        {
          reference_id: "fact_lee_2008",
          title: "Lee, C. et al. Measurement of the Elastic Properties and Intrinsic Strength of Monolayer Graphene. Science (2008).",
          url: "https://pubmed.ncbi.nlm.nih.gov/18635798/",
          source_type: "journal",
          publication_year: 2008,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_graphene_thermal_transport",
      title: "Graphene is one of the best heat conductors ever measured",
      statement:
        "Graphene's exceptional thermal conductivity drove its adoption into heat spreaders and thermal interface materials for electronics cooling.",
      material_family: "Graphene / TIM",
      confidence_level: "strong",
      references: [
        {
          reference_id: "fact_balandin_2008",
          title: "Balandin, A. A. et al. Superior Thermal Conductivity of Single-Layer Graphene. Nano Letters (2008).",
          url: "https://doi.org/10.1021/nl801318y",
          source_type: "journal",
          publication_year: 2008,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_graphene_impermeability",
      title: "Graphene membranes let water through but block gases",
      statement:
        "Graphene-based membranes can selectively filter molecules — letting water pass while blocking helium — opening up filtration and barrier applications.",
      material_family: "Graphene / GO",
      confidence_level: "strong",
      references: [
        {
          reference_id: "fact_nair_2012",
          title: "Nair, R. R. et al. Unimpeded Permeation of Water Through Helium-Leak-Tight Graphene-Based Membranes. Science (2012).",
          url: "https://doi.org/10.1126/science.1211694",
          source_type: "journal",
          publication_year: 2012,
          accessed_on: "2026-03-05"
        },
        {
          reference_id: "fact_bunch_2008",
          title: "Bunch, J. S. et al. Impermeable Atomic Membranes from Graphene Sheets. Nano Letters (2008).",
          url: "https://pubmed.ncbi.nlm.nih.gov/18687034/",
          source_type: "journal",
          publication_year: 2008,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_large_area_graphene",
      title: "Growing graphene on copper foil changed the game",
      statement:
        "CVD on copper foil made it possible to grow large sheets of graphene — moving it from tiny lab flakes to manufacturing-ready films.",
      material_family: "Graphene",
      confidence_level: "strong",
      references: [
        {
          reference_id: "fact_li_2009",
          title: "Li, X. et al. Large-Area Synthesis of High-Quality and Uniform Graphene Films on Copper Foils. Science (2009).",
          url: "https://pubmed.ncbi.nlm.nih.gov/19423775/",
          source_type: "journal",
          publication_year: 2009,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_cnt_commercial_signal",
      title: "Nanotubes went from lab curiosity to commercial material",
      statement:
        "By the early 2010s, carbon nanotubes were already in commercial products — though challenges with scale and consistency remained.",
      material_family: "CNT",
      confidence_level: "established",
      references: [
        {
          reference_id: "fact_devolder_2013",
          title: "De Volder, M. F. L. et al. Carbon Nanotubes: Present and Future Commercial Applications. Science (2013).",
          url: "https://doi.org/10.1126/science.1222453",
          source_type: "journal",
          publication_year: 2013,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_2d_integration_challenge",
      title: "The material works — getting it into products is the challenge",
      statement:
        "The biggest hurdles for 2D materials aren't performance — they're integration, process compatibility, and long-term reliability in real products.",
      material_family: "Graphene / 2D hybrids",
      confidence_level: "strong",
      references: [
        {
          reference_id: "fact_akinwande_2019",
          title: "Akinwande, D. et al. Graphene and two-dimensional materials for silicon technology. Nature (2019).",
          url: "https://www.nature.com/articles/s41586-019-1573-9",
          source_type: "journal",
          publication_year: 2019,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_iso_standardization_need",
      title: "Without standards, buyers and sellers can't agree on quality",
      statement:
        "Shared terminology and testing standards (like ISO specs) are essential for suppliers, labs, and production teams to work together reliably.",
      material_family: "Cross-material",
      confidence_level: "established",
      references: [
        {
          reference_id: "fact_iso_80004_13_2024",
          title: "ISO/TS 80004-13:2024 Nanotechnologies - Vocabulary - Graphene and related 2D materials.",
          url: "https://www.iso.org/standard/82855.html",
          source_type: "standard",
          publication_year: 2024,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_energy_pathways",
      title: "Batteries and supercapacitors rely on carbon nanomaterials",
      statement:
        "Graphene and nanotube additives improve how batteries and supercapacitors conduct electricity and store energy — a major active research area.",
      material_family: "Graphene / CNT",
      confidence_level: "strong",
      references: [
        {
          reference_id: "fact_bonaccorso_2015",
          title: "Bonaccorso, F. et al. Graphene, related two-dimensional crystals, and hybrid systems for energy conversion and storage. Science (2015).",
          url: "https://doi.org/10.1126/science.1246501",
          source_type: "journal",
          publication_year: 2015,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      fact_id: "fact_ai_materials_acceleration",
      title: "AI speeds up material discovery — but still needs real experiments",
      statement:
        "Machine learning helps screen candidates faster and prioritise experiments, but the results only matter when validated by real lab testing.",
      material_family: "Hybrid carbon systems",
      confidence_level: "emerging",
      references: [
        {
          reference_id: "fact_butler_2018",
          title: "Butler, K. T. et al. Machine learning for molecular and materials science. Nature (2018).",
          url: "https://doi.org/10.1038/s41586-018-0337-2",
          source_type: "journal",
          publication_year: 2018,
          accessed_on: "2026-03-05"
        }
      ]
    }
  ];

  windowObj.HEXCARB_HISTORY_ADOPTION_GAPS = [
    {
      gap_id: "gap_purity_consistency",
      title: "Every batch needs to be the same — and that's still hard",
      summary:
        "Scaling up often stalls when batches aren't consistent. Small changes in purity, shape, or how the material disperses can derail a production run.",
      constraint_type: "Batch consistency",
      references: [
        {
          reference_id: "gap_devolder_2013",
          title: "De Volder, M. F. L. et al. Carbon Nanotubes: Present and Future Commercial Applications. Science (2013).",
          url: "https://doi.org/10.1126/science.1222453",
          source_type: "journal",
          publication_year: 2013,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      gap_id: "gap_dispersion_interface",
      title: "Mixing nanomaterials evenly into products is harder than it sounds",
      summary:
        "Performance depends on how well the material blends with its host — the right chemistry, even distribution, and stability through processing.",
      constraint_type: "Dispersion & mixing",
      references: [
        {
          reference_id: "gap_nature_roadmap_2012",
          title: "Novoselov, K. S. et al. A roadmap for graphene. Nature (2012).",
          url: "https://www.nature.com/articles/nature11458",
          source_type: "journal",
          publication_year: 2012,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      gap_id: "gap_qualification_cycles",
      title: "Getting approved takes time — especially in aerospace and electronics",
      summary:
        "Industries like aerospace and electronics need extensive testing, documentation, and repeatability data before they'll buy at scale.",
      constraint_type: "Qualification timeline",
      references: [
        {
          reference_id: "gap_akinwande_2019",
          title: "Akinwande, D. et al. Graphene and two-dimensional materials for silicon technology. Nature (2019).",
          url: "https://www.nature.com/articles/s41586-019-1573-9",
          source_type: "journal",
          publication_year: 2019,
          accessed_on: "2026-03-05"
        },
        {
          reference_id: "gap_iso_2024",
          title: "ISO/TS 80004-13:2024 Nanotechnologies Vocabulary baseline.",
          url: "https://www.iso.org/standard/82855.html",
          source_type: "standard",
          publication_year: 2024,
          accessed_on: "2026-03-05"
        }
      ]
    },
    {
      gap_id: "gap_cost_performance",
      title: "The cost only makes sense if the performance gain is big enough",
      summary:
        "Carbon nanomaterials are powerful, but whether they're worth the cost depends on the specific application, process fit, and reliability needs.",
      constraint_type: "Cost vs. performance",
      references: [
        {
          reference_id: "gap_devolder_2013_b",
          title: "De Volder, M. F. L. et al. Carbon Nanotubes: Present and Future Commercial Applications. Science (2013).",
          url: "https://doi.org/10.1126/science.1222453",
          source_type: "journal",
          publication_year: 2013,
          accessed_on: "2026-03-05"
        },
        {
          reference_id: "gap_bonaccorso_2015",
          title: "Bonaccorso, F. et al. Graphene and hybrid systems for energy conversion and storage. Science (2015).",
          url: "https://doi.org/10.1126/science.1246501",
          source_type: "journal",
          publication_year: 2015,
          accessed_on: "2026-03-05"
        }
      ]
    }
  ];

  windowObj.HEXCARB_HISTORY_DATA = milestones.map(function (milestone) {
    var enhancement = milestoneEnhancements[milestone.id] || {};
    return Object.assign(
      {
        confidence_level: "strong",
        deployment_level: "pilot",
        impact_tags: [],
        fact_ids: []
      },
      milestone,
      enhancement
    );
  });
})(window);

