/* HexCarb history timeline dataset */
(function (windowObj) {
  "use strict";

  var milestones = [
    {
      id: "go_oxidation_1958",
      year_start: 1958,
      year_end: 1958,
      year_label: "1958",
      title: "Graphite oxidation methods formalize routes to graphene-oxide precursors",
      summary:
        "The Hummers oxidation approach helped standardize oxidized graphitic feedstocks, later used in modern graphene-oxide and reduced-graphene workflows.",
      material_family: "Graphene oxide (GO)",
      breakthrough_type: "Synthesis chemistry",
      current_use_snapshot:
        "GO chemistry remains common in coatings, membranes, composites, and functional ink research pipelines.",
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
      title: "Vapor-grown carbon fibers establish high-aspect-ratio carbon growth pathways",
      summary:
        "Catalytic vapor growth work in the 1970s created process knowledge that later informed carbon nanofiber and nanotube manufacturing methods.",
      material_family: "Carbon nanofibers / hybrid carbon systems",
      breakthrough_type: "Process foundation",
      current_use_snapshot:
        "CNF-derived know-how is still used in conductive additives, structural composites, and precursor process design.",
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
      title: "C60 fullerenes are identified as a new carbon allotrope class",
      summary:
        "Discovery of buckminsterfullerene expanded carbon nanomaterial science beyond graphite and diamond, opening molecular-scale carbon design directions.",
      material_family: "Fullerenes",
      breakthrough_type: "Allotrope discovery",
      current_use_snapshot:
        "Fullerene chemistry remains active in organic electronics, photovoltaic research, and specialized additive systems.",
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
      title: "Detonation routes accelerate nanoscale diamond powder availability",
      summary:
        "Detonation synthesis routes gave nanodiamond a scalable entry point for polishing, tribology, and surface-functional systems.",
      material_family: "Nanodiamond",
      breakthrough_type: "Scale-up pathway",
      current_use_snapshot:
        "Nanodiamond is currently used or evaluated in lubricants, coatings, polishing compounds, and biomedical surface engineering.",
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
      title: "Multi-walled carbon nanotubes are reported with high-impact microscopy evidence",
      summary:
        "Iijima's helical microtubule report became a central milestone for nanotube science and a trigger for rapid global research growth.",
      material_family: "MWCNT",
      breakthrough_type: "Foundational observation",
      current_use_snapshot:
        "MWCNT systems are now widely evaluated for conductivity networks, reinforcement, and EMI-related composite design.",
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
      title: "Single-walled nanotube growth is demonstrated using transition-metal catalysts",
      summary:
        "Catalyst-supported synthesis routes established SWCNT as a practical research material with tunable morphology and high-value electronic behavior.",
      material_family: "SWCNT",
      breakthrough_type: "Catalytic synthesis",
      current_use_snapshot:
        "SWCNTs are now used or assessed for high-performance conductive networks, sensing, and advanced thermal-electrical interfaces.",
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
      title: "Crystalline ropes of metallic carbon nanotubes support property-scale studies",
      summary:
        "Purified and assembled SWNT rope studies improved understanding of transport and structure-property links relevant to engineering use.",
      material_family: "SWCNT",
      breakthrough_type: "Characterization advance",
      current_use_snapshot:
        "Modern SWCNT process qualification still depends on lot-level morphology and transport characterization.",
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
      title: "Graphene oxide structural models are clarified with spectroscopy-led analysis",
      summary:
        "Structural interpretation of GO chemistry improved reduction strategies and process controls used in functional graphene derivatives.",
      material_family: "Graphene oxide (GO)",
      breakthrough_type: "Structure model",
      current_use_snapshot:
        "GO and rGO systems are currently used in antistatic coatings, membranes, inks, and multifunctional composite studies.",
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
      title: "Isolated graphene devices trigger a new era of two-dimensional carbon engineering",
      summary:
        "The electric-field-effect demonstration in atomically thin carbon accelerated fundamental and applied graphene research worldwide.",
      material_family: "Graphene",
      breakthrough_type: "Device milestone",
      current_use_snapshot:
        "Graphene development now spans coatings, thermal pathways, barrier layers, sensors, and electronic interface materials.",
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
      title: "Graphene thermal transport results elevate heat-spreading design interest",
      summary:
        "Measured high intrinsic thermal conductivity made graphene a key candidate for next-generation heat management architectures.",
      material_family: "Graphene",
      breakthrough_type: "Property benchmark",
      current_use_snapshot:
        "Graphene-derived fillers are currently used or evaluated in TIMs, thermal films, and compact electronics packaging.",
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
      title: "Large-area CVD graphene pathways improve transfer toward manufacturing",
      summary:
        "Copper-foil CVD demonstrated practical routes to broader-area graphene films, improving manufacturability research.",
      material_family: "Graphene",
      breakthrough_type: "Scale process",
      current_use_snapshot:
        "Large-area film pathways are now used in R&D and pilot lines for sensors, shielding layers, and specialty coatings.",
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
      title: "Graphene receives Nobel-level validation and mainstream technical visibility",
      summary:
        "Recognition of graphene breakthroughs accelerated institutional research investment and industrial technology scouting.",
      material_family: "Graphene",
      breakthrough_type: "Scientific recognition",
      current_use_snapshot:
        "The post-2010 cycle increased multi-industry qualification programs for carbon nanomaterial-enabled products.",
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
      title: "Graphene-based membranes show selective transport behavior",
      summary:
        "Membrane studies highlighted how atomically thin carbon structures can support selective transport and barrier engineering concepts.",
      material_family: "Graphene / GO",
      breakthrough_type: "Application mechanism",
      current_use_snapshot:
        "Membrane and barrier concepts are now widely explored in filtration, packaging, and corrosion-control material systems.",
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
      title: "CNT manufacturing review maps the path from promise to production controls",
      summary:
        "Comprehensive manufacturing reviews clarified dispersion, purification, and consistency constraints needed for commercial reliability.",
      material_family: "SWCNT / MWCNT",
      breakthrough_type: "Industrial readiness",
      current_use_snapshot:
        "Today's procurement-grade CNT programs still rely on the same consistency, purity, and process-window controls.",
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
      title: "Layered and hybrid 2D-carbon stacks expand system-level design options",
      summary:
        "van der Waals assembly concepts reinforced multi-material integration strategies for transport, sensing, and interface control.",
      material_family: "Graphene / hybrid carbon systems",
      breakthrough_type: "System integration",
      current_use_snapshot:
        "Hybrid stack design is now commonly evaluated in advanced electronics, sensing layers, and functional coatings.",
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
      title: "Conductive composite pathways mature for ESD and EMI-focused product classes",
      summary:
        "CNT, graphene, and conductive carbon-black additives advanced in polymer compounding programs targeting electrical conductivity and shielding performance.",
      material_family: "CNT / graphene / conductive carbon black systems",
      breakthrough_type: "Application scaling",
      current_use_snapshot:
        "Conductive carbon networks are currently deployed in selected housings, cables, coatings, and molded compound programs.",
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
      title: "Flexible and wearable architectures increase demand for carbon nano-enabled conductors",
      summary:
        "Wearable electronics research accelerated use of lightweight conductive and strain-sensitive carbon nanomaterial networks.",
      material_family: "SWCNT / graphene / CNF",
      breakthrough_type: "Wearable transition",
      current_use_snapshot:
        "Carbon nanomaterials are now commonly evaluated for smart textiles, skin-adjacent sensing, and low-mass wiring concepts.",
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
      title: "Energy-storage programs deepen interest in conductive carbon nano-additives",
      summary:
        "Battery and supercapacitor R&D continued to evaluate graphene and nanotube additives for transport pathways and electrode architecture tuning.",
      material_family: "Graphene / CNT",
      breakthrough_type: "Energy integration",
      current_use_snapshot:
        "Carbon nanomaterials remain active in energy-storage design workflows, especially for conductivity and rate-performance optimization.",
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
      title: "Thermal interface and packaging programs prioritize carbon-enabled heat-path engineering",
      summary:
        "As power densities rise, graphene- and nanotube-assisted thermal pathways gain renewed relevance in interface and spreader architectures.",
      material_family: "Graphene / CNT / TIM hybrids",
      breakthrough_type: "Thermal management focus",
      current_use_snapshot:
        "Current work targets lower thermal resistance, improved bond-line stability, and manufacturable thermal stacks.",
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
      title: "Digital and AI-guided materials workflows begin shaping faster formulation cycles",
      summary:
        "Data-driven screening and surrogate models increasingly support candidate selection, experiment prioritization, and qualification planning.",
      material_family: "Hybrid carbon systems",
      breakthrough_type: "Workflow acceleration",
      current_use_snapshot:
        "Teams now combine physical experiments with data-guided iteration to reduce development loops and improve technical decision quality.",
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
      title: "GO scale begins with old but still relevant oxidation chemistry",
      statement:
        "The 1958 Hummers route remains a practical baseline for graphite oxide feedstocks used in modern GO and rGO process chains.",
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
      title: "Carbon allotrope discoveries repeatedly reset the field",
      statement:
        "Fullerenes (1985), then graphene recognition (2010 Nobel context), show how carbon allotrope discoveries can rapidly reframe materials priorities.",
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
      title: "Nanotubes tolerate extreme current densities in laboratory studies",
      statement:
        "Individual nanotubes have demonstrated current-density tolerance well beyond traditional copper limits in foundational transport studies.",
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
      title: "Graphene combines atomic thinness with high measured strength",
      statement:
        "Nanoindentation studies report very high intrinsic strength for monolayer graphene, helping explain sustained interest in reinforced interfaces.",
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
      title: "Graphene thermal transport data drove TIM and spreader interest",
      statement:
        "High intrinsic thermal conductivity measurements pushed graphene into heat-spreading and interface-material research programs.",
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
      title: "Atomically thin graphene-based membranes can be selective barriers",
      statement:
        "Experimental work showed selective transport behavior in graphene-based membranes, expanding barrier and membrane application pathways.",
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
      title: "Large-area CVD was a pivotal manufacturing step",
      statement:
        "Copper-foil CVD enabled larger-area graphene film routes, moving field momentum from laboratory flakes toward manufacturing-relevant workflows.",
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
      title: "CNTs moved from novelty to commercial materials engineering",
      statement:
        "By the early 2010s, review evidence already showed carbon nanotubes entering selected commercial pathways with persistent scale and consistency constraints.",
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
      title: "Material promise is high, but integration remains the hard part",
      statement:
        "Recent perspective work highlights integration, process compatibility, and reliability as key hurdles for broader 2D-material deployment.",
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
      title: "Standard language and metrology remain essential for procurement trust",
      statement:
        "Terminology and characterization standards are still a prerequisite for consistent qualification between suppliers, labs, and production teams.",
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
      title: "Carbon nanomaterials remain central in energy device optimization",
      statement:
        "Graphene and related hybrid systems continue to be evaluated for transport pathways and electrode architecture in energy conversion and storage.",
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
      title: "AI workflows can shorten candidate-screening loops, but need strong data discipline",
      statement:
        "Materials informatics methods can accelerate screening and prioritization when paired with robust experimental validation and process context.",
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
      title: "Purity and lot-to-lot consistency still limit scale confidence",
      summary:
        "Programs often stall between pilot and volume production when morphology, impurity profile, or dispersion behavior drifts across lots.",
      constraint_type: "process_consistency",
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
      title: "Dispersion and interface engineering remain application-critical bottlenecks",
      summary:
        "Material performance depends on matrix compatibility, functionalization route, and stable microstructure after processing.",
      constraint_type: "dispersion_interface",
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
      title: "Qualification cycles are long for regulated and reliability-heavy sectors",
      summary:
        "Electronics, aerospace, and energy teams require evidence packages, protocol alignment, and repeatability data before procurement scale-up.",
      constraint_type: "qualification_timeline",
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
      title: "Cost-to-performance windows are still use-case specific",
      summary:
        "These materials are powerful, but deployment depends on total-system value, process compatibility, and required reliability margins.",
      constraint_type: "commercial_tradeoff",
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

