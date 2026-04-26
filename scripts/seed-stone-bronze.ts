import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Récupérer les IDs des ligues Stone et Bronze
  const { data: leagues, error: leaguesErr } = await (supabase as any)
    .from('leagues')
    .select('id, name')
    .in('name', ['Stone', 'Bronze'])

  if (leaguesErr) { console.error('❌ Fetch leagues error:', leaguesErr); return }
  if (!leagues || leagues.length === 0) {
    console.error('❌ Aucune ligue Stone/Bronze trouvée')
    return
  }

  const stoneId  = leagues.find((l: any) => l.name === 'Stone')?.id
  const bronzeId = leagues.find((l: any) => l.name === 'Bronze')?.id
  console.log('Ligues trouvées :', { stoneId, bronzeId })
  if (!stoneId || !bronzeId) {
    console.error('❌ Stone ou Bronze manquant en DB')
    return
  }

  const challenges = [
    // ─── STONE — UX/UI (10) ───────────────────────
    {
      title: "Flow d'inscription app bancaire",
      specialty: 'UX Designer', challenge_type: 'User Flow', industry: 'Fintech',
      league_id: stoneId, xp_reward: 200, deadline_days: 5,
      brief: "Conçois le flow complet d'inscription d'une app bancaire mobile pour les 18-30 ans.",
      context: "La startup NeoBank veut réduire son taux d'abandon à l'inscription de 70% à moins de 20%.",
      deliverable: "Flow annoté min 6 étapes + écrans wireframes. Lien Figma.",
      constraints: "Mobile first. Max 4 étapes visibles. Accessible WCAG AA.",
      criteria: "Fluidité, clarté, logique UX, réduction des frictions.",
      is_published: true,
    },
    {
      title: "UX audit app de livraison",
      specialty: 'UX Designer', challenge_type: 'UX Research', industry: 'E-commerce',
      league_id: stoneId, xp_reward: 200, deadline_days: 5,
      brief: "Identifie les 3 principales frictions dans le parcours de commande d'une app de livraison.",
      context: "L'app ZappFood perd 60% de ses users à l'étape du panier. Pourquoi ?",
      deliverable: "Document : problématique + 3 frictions + 3 solutions visuelles.",
      constraints: "Basé sur une vraie app existante. Screenshots requis.",
      criteria: "Pertinence des frictions, clarté des solutions, argumentation.",
      is_published: true,
    },
    {
      title: "Écran dashboard fitness",
      specialty: 'UI Designer', challenge_type: 'UI Screen', industry: 'Fitness',
      league_id: stoneId, xp_reward: 180, deadline_days: 4,
      brief: "Crée l'écran principal d'une app de suivi sportif pour les 20-35 ans actifs.",
      context: "PulseFit veut un dashboard qui motive au premier coup d'œil.",
      deliverable: "1 écran mobile haute fidélité 375x812px. Lien Figma.",
      constraints: "Dark mode recommandé. Afficher : calories, steps, objectif, streak.",
      criteria: "Impact visuel, hiérarchie des données, motivation visuelle.",
      is_published: true,
    },
    {
      title: "Onboarding app méditation",
      specialty: 'UX Designer', challenge_type: 'User Flow', industry: 'Bien-être',
      league_id: stoneId, xp_reward: 200, deadline_days: 5,
      brief: "Conçois le flow d'onboarding d'une app de méditation pour les professionnels stressés.",
      context: "Serena veut accueillir ses users avec douceur et personnalisation en moins de 3 min.",
      deliverable: "Flow complet + 4 écrans UI. Lien Figma.",
      constraints: "Ambiance apaisante. Questionnaire de personnalisation inclus.",
      criteria: "Émotion, fluidité, personnalisation, cohérence visuelle.",
      is_published: true,
    },
    {
      title: "Page d'accueil app e-learning",
      specialty: 'UI Designer', challenge_type: 'UI Screen', industry: 'Éducation',
      league_id: stoneId, xp_reward: 180, deadline_days: 4,
      brief: "Redesigne la page d'accueil d'une plateforme e-learning pour augmenter l'engagement.",
      context: "LearnUp veut que les users trouvent leur cours en moins de 30 secondes.",
      deliverable: "1 écran desktop + 1 écran mobile. Lien Figma.",
      constraints: "Afficher : cours en cours, recommandations, progression, streak.",
      criteria: "Clarté, hiérarchie, engagement, responsive.",
      is_published: true,
    },
    {
      title: "Wireframes app de covoiturage",
      specialty: 'UX Designer', challenge_type: 'Wireframes', industry: 'Mobilité',
      league_id: stoneId, xp_reward: 220, deadline_days: 6,
      brief: "Crée les wireframes du flow de réservation d'un trajet en covoiturage.",
      context: "RideTogether veut simplifier la réservation en moins de 3 clics.",
      deliverable: "Min 5 wireframes annotés. Lien Figma.",
      constraints: "Mobile first. Inclure : recherche, résultats, détail, confirmation.",
      criteria: "Architecture, clarté, logique UX.",
      is_published: true,
    },
    {
      title: "Écran profil utilisateur SaaS",
      specialty: 'UI Designer', challenge_type: 'UI Screen', industry: 'SaaS',
      league_id: stoneId, xp_reward: 180, deadline_days: 4,
      brief: "Crée la page profil d'un outil SaaS de gestion de projet pour les équipes remote.",
      context: "TeamFlow veut un profil qui affiche les compétences, disponibilité et contributions.",
      deliverable: "1 écran desktop haute fidélité. Lien Figma.",
      constraints: "Afficher : avatar, skills, projets, disponibilité, stats.",
      criteria: "Clarté, densité d'info maîtrisée, design professionnel.",
      is_published: true,
    },
    {
      title: "Flow paiement checkout mobile",
      specialty: 'UX Designer', challenge_type: 'User Flow', industry: 'E-commerce',
      league_id: stoneId, xp_reward: 220, deadline_days: 6,
      brief: "Conçois le flow de checkout d'une boutique mobile avec paiement en 1-clic.",
      context: "ShopEasy perd 40% de ses ventes au moment du paiement.",
      deliverable: "Flow complet + min 4 écrans. Lien Figma.",
      constraints: "Inclure : panier, livraison, paiement, confirmation. Max 3 étapes.",
      criteria: "Réduction des frictions, confiance, rapidité.",
      is_published: true,
    },
    {
      title: "Composants boutons & inputs",
      specialty: 'UI Designer', challenge_type: 'UI Screen', industry: 'SaaS',
      league_id: stoneId, xp_reward: 160, deadline_days: 3,
      brief: "Crée une bibliothèque de composants boutons et inputs pour un SaaS B2B.",
      context: "HubWork a besoin d'un mini design system de base pour ses développeurs.",
      deliverable: "Boutons (5 états) + inputs (5 types). Lien Figma.",
      constraints: "Dark et light mode. Accessible. Bien nommé.",
      criteria: "Cohérence, accessibilité, utilité.",
      is_published: true,
    },
    {
      title: "Redesign écran login",
      specialty: 'UI Designer', challenge_type: 'Redesign', industry: 'Fintech',
      league_id: stoneId, xp_reward: 180, deadline_days: 4,
      brief: "Redesigne l'écran de connexion d'une app bancaire classique pour la rendre moderne.",
      context: "OldBank a un login des années 2010. Public cible : 25-40 ans tech-savvy.",
      deliverable: "Avant + Après. 1 écran redesigné. Lien Figma.",
      constraints: "Garder les infos essentielles. Style moderne et rassurant.",
      criteria: "Amélioration visible, modernité, confiance.",
      is_published: true,
    },

    // ─── STONE — GRAPHIC (10) ─────────────────────
    {
      title: "Logo startup tech fictive",
      specialty: 'Graphic Designer', challenge_type: 'Logo', industry: 'SaaS',
      league_id: stoneId, xp_reward: 180, deadline_days: 4,
      brief: "Crée le logo d'une startup tech fictive dans le domaine du SaaS.",
      context: "La startup s'appelle Nexio. Elle propose un outil de collaboration pour équipes remote.",
      deliverable: "Logo couleur + NB + SVG ou PDF. Lien Figma.",
      constraints: "Simple, mémorable, déclinable. Version couleur + NB.",
      criteria: "Originalité, mémorabilité, cohérence avec le positionnement tech.",
      is_published: true,
    },
    {
      title: "Affiche festival de design",
      specialty: 'Graphic Designer', challenge_type: 'Affiche', industry: 'Éducation',
      league_id: stoneId, xp_reward: 200, deadline_days: 5,
      brief: "Crée l'affiche d'un festival de design fictif dans ta ville.",
      context: "Le festival s'appelle DesignFest. Moderne, créatif, pour designers 20-35 ans.",
      deliverable: "Affiche A3 PNG ou PDF haute résolution.",
      constraints: "Format A3. Inclure : nom, date fictive, lieu fictif.",
      criteria: "Impact visuel, typographie, hiérarchie de l'information.",
      is_published: true,
    },
    {
      title: "Kit réseaux sociaux café",
      specialty: 'Graphic Designer', challenge_type: 'Social Media Kit', industry: 'Food & Beverage',
      league_id: stoneId, xp_reward: 200, deadline_days: 4,
      brief: "Crée un kit de 4 templates pour les réseaux sociaux d'un café artisanal.",
      context: "Le café s'appelle Roast. Style vintage, chaleureux, pour amateurs de café.",
      deliverable: "4 templates PNG + lien Figma.",
      constraints: "2 posts carrés + 2 stories. Cohérence visuelle obligatoire.",
      criteria: "Cohérence, identité forte, adaptabilité des templates.",
      is_published: true,
    },
    {
      title: "Logo association sportive",
      specialty: 'Graphic Designer', challenge_type: 'Logo', industry: 'Sport',
      league_id: stoneId, xp_reward: 180, deadline_days: 4,
      brief: "Crée le logo d'une association de sport fictive dans ta ville.",
      context: "L'association s'appelle Volt FC. Football urbain, jeunes 15-25 ans.",
      deliverable: "Logo couleur + NB. Lien Figma ou SVG.",
      constraints: "Style moderne et énergique. Version couleur + NB.",
      criteria: "Énergie, mémorabilité, cohérence sport.",
      is_published: true,
    },
    {
      title: "Affiche concert rap",
      specialty: 'Graphic Designer', challenge_type: 'Affiche', industry: 'Musique',
      league_id: stoneId, xp_reward: 200, deadline_days: 5,
      brief: "Crée l'affiche d'un concert de rap fictif.",
      context: "L'artiste s'appelle Kara. Style urbain, sombre, percutant.",
      deliverable: "Affiche PNG ou PDF haute résolution.",
      constraints: "Format A2. Inclure : nom artiste, date, lieu, prix fictif.",
      criteria: "Impact visuel, typographie urbaine, atmosphère.",
      is_published: true,
    },
    {
      title: "Identité visuelle app fitness",
      specialty: 'Graphic Designer', challenge_type: 'Brand Identity', industry: 'Fitness',
      league_id: stoneId, xp_reward: 220, deadline_days: 5,
      brief: "Crée une identité visuelle basique pour une app de fitness.",
      context: "L'app s'appelle PulseFit. Jeune, dynamique, pour sportifs 20-35 ans.",
      deliverable: "Logo + palette + typo + 1 mockup app. Lien Figma.",
      constraints: "Logo + palette de 3 couleurs + 1 typographie principale.",
      criteria: "Cohérence, positionnement sport, énergie visuelle.",
      is_published: true,
    },
    {
      title: "Packaging bière artisanale",
      specialty: 'Graphic Designer', challenge_type: 'Packaging', industry: 'Food & Beverage',
      league_id: stoneId, xp_reward: 220, deadline_days: 6,
      brief: "Crée le packaging d'une bière artisanale fictive.",
      context: "La bière s'appelle Forge. Style craft, masculin, authentique.",
      deliverable: "Mockup packaging PNG + lien Figma.",
      constraints: "Design de la canette ou de la bouteille. Mockup inclus.",
      criteria: "Impact visuel, originalité, cohérence craft.",
      is_published: true,
    },
    {
      title: "Logo ONG environnement",
      specialty: 'Graphic Designer', challenge_type: 'Logo', industry: 'ONG',
      league_id: stoneId, xp_reward: 180, deadline_days: 4,
      brief: "Crée le logo d'une ONG fictive de protection de l'environnement.",
      context: "L'ONG s'appelle GreenPact. Mission : protection des océans.",
      deliverable: "Logo couleur + NB. Lien Figma ou SVG.",
      constraints: "Éviter les clichés verts. Simple et mémorable.",
      criteria: "Originalité, mission claire, déclinabilité.",
      is_published: true,
    },
    {
      title: "Affiche sensibilisation santé",
      specialty: 'Graphic Designer', challenge_type: 'Affiche', industry: 'Santé',
      league_id: stoneId, xp_reward: 200, deadline_days: 4,
      brief: "Crée une affiche de sensibilisation sur la santé mentale pour les jeunes.",
      context: "Campagne fictive pour un lycée. Public : 15-20 ans.",
      deliverable: "Affiche A3 PNG ou PDF.",
      constraints: "Message positif et accessible. Pas de stigmatisation.",
      criteria: "Clarté du message, impact émotionnel, adaptation au public.",
      is_published: true,
    },
    {
      title: "Kit social media startup",
      specialty: 'Graphic Designer', challenge_type: 'Social Media Kit', industry: 'SaaS',
      league_id: stoneId, xp_reward: 200, deadline_days: 5,
      brief: "Crée un kit social media pour le lancement d'une startup SaaS.",
      context: "La startup s'appelle Flowly. Outil de gestion de tâches. Style minimaliste.",
      deliverable: "4 templates PNG + lien Figma.",
      constraints: "4 templates : 2 posts LinkedIn + 2 posts Instagram. Cohérence requise.",
      criteria: "Cohérence, professionnalisme, adaptabilité.",
      is_published: true,
    },

    // ─── BRONZE — UX/UI (10) ──────────────────────
    {
      title: "Audit UX app santé",
      specialty: 'UX Designer', challenge_type: 'UX Research', industry: 'Santé',
      league_id: bronzeId, xp_reward: 300, deadline_days: 6,
      brief: "Analyse les frictions d'une app de suivi médical et propose des solutions.",
      context: "MedTrack a 60% d'abandon au premier usage. Identifie pourquoi.",
      deliverable: "Document : analyse + insights + recommandations visuelles.",
      constraints: "Min 3 frictions. Min 2 solutions prototypées.",
      criteria: "Rigueur, pertinence, clarté.",
      is_published: true,
    },
    {
      title: "Wireframes dashboard analytics",
      specialty: 'UX Designer', challenge_type: 'Wireframes', industry: 'SaaS',
      league_id: bronzeId, xp_reward: 320, deadline_days: 7,
      brief: "Crée les wireframes d'un dashboard analytics pour une startup SaaS.",
      context: "DataPulse veut un dashboard qui permet de comprendre ses KPIs en 30 secondes.",
      deliverable: "Min 5 wireframes desktop annotés. Lien Figma.",
      constraints: "Afficher : revenue, users, churn, conversions. Mobile view inclus.",
      criteria: "Architecture info, clarté, densité maîtrisée.",
      is_published: true,
    },
    {
      title: "Flow onboarding SaaS B2B",
      specialty: 'UX Designer', challenge_type: 'User Flow', industry: 'SaaS',
      league_id: bronzeId, xp_reward: 300, deadline_days: 6,
      brief: "Conçois le flow d'activation d'un SaaS RH pour les PME.",
      context: "HRFlow veut activer ses users en moins de 10 min après l'inscription.",
      deliverable: "Flow complet + min 5 écrans UI. Lien Figma.",
      constraints: "Inclure : setup compte, invite équipe, première action.",
      criteria: "Fluidité, activation, réduction du time-to-value.",
      is_published: true,
    },
    {
      title: "Redesign page panier e-commerce",
      specialty: 'UI Designer', challenge_type: 'Redesign', industry: 'E-commerce',
      league_id: bronzeId, xp_reward: 280, deadline_days: 6,
      brief: "Redesigne la page panier d'une boutique en ligne pour réduire l'abandon.",
      context: "CartDrop a 75% d'abandon panier. Compare avant/après.",
      deliverable: "Avant + Après + 2 écrans redesignés + justification.",
      constraints: "Garder toutes les infos. Réduire les distractions. Mobile first.",
      criteria: "Amélioration UX mesurable, argumentation.",
      is_published: true,
    },
    {
      title: "UI Kit app santé",
      specialty: 'UI Designer', challenge_type: 'UI Kit', industry: 'Santé',
      league_id: bronzeId, xp_reward: 320, deadline_days: 7,
      brief: "Crée un mini UI kit pour une app de suivi santé grand public.",
      context: "Healthy App cible les 30-50 ans peu tech-savvy. Interface simple.",
      deliverable: "Min 15 composants documentés. Lien Figma.",
      constraints: "Couleurs apaisantes. Grande lisibilité. Accessible.",
      criteria: "Cohérence, accessibilité, utilité des composants.",
      is_published: true,
    },
    {
      title: "Flow téléconsultation médicale",
      specialty: 'UX Designer', challenge_type: 'User Flow', industry: 'Santé',
      league_id: bronzeId, xp_reward: 320, deadline_days: 7,
      brief: "Conçois le flow de prise de RDV pour une téléconsultation médicale.",
      context: "DocNow veut permettre de consulter un médecin en moins de 5 min.",
      deliverable: "Flow complet + min 5 écrans. Lien Figma.",
      constraints: "Inclure : choix médecin, créneau, motif, confirmation.",
      criteria: "Rapidité, clarté, confiance, accessibilité.",
      is_published: true,
    },
    {
      title: "Écrans app sport communautaire",
      specialty: 'UI Designer', challenge_type: 'UI Screen', industry: 'Sport',
      league_id: bronzeId, xp_reward: 280, deadline_days: 6,
      brief: "Crée 3 écrans clés d'une app de sport communautaire pour organiser des matchs.",
      context: "PlayTogether veut connecter les joueurs de sport amateur en ville.",
      deliverable: "3 écrans : accueil + recherche + détail match. Lien Figma.",
      constraints: "Style énergique. Social features visibles. Mobile first.",
      criteria: "Énergie visuelle, clarté, social design.",
      is_published: true,
    },
    {
      title: "Prototype notifications push",
      specialty: 'UX Designer', challenge_type: 'Prototype', industry: 'E-commerce',
      league_id: bronzeId, xp_reward: 300, deadline_days: 6,
      brief: "Crée un prototype du système de notifications d'une app e-commerce.",
      context: "ShopAlert veut des notifs contextuelles qui convertissent sans annoyer.",
      deliverable: "Prototype Figma : min 3 types de notifications + flow interaction.",
      constraints: "Inclure : promo, panier abandonné, livraison. Interactions réalistes.",
      criteria: "Réalisme, pertinence, expérience utilisateur.",
      is_published: true,
    },
    {
      title: "Wireframes app de voyage",
      specialty: 'UX Designer', challenge_type: 'Wireframes', industry: 'Voyage',
      league_id: bronzeId, xp_reward: 320, deadline_days: 7,
      brief: "Crée les wireframes d'une app de voyage pour les backpackers.",
      context: "WanderApp cible les 20-35 ans qui voyagent en mode découverte.",
      deliverable: "Min 6 wireframes annotés. Lien Figma.",
      constraints: "Inclure : destination, itinéraire, hébergement, budget, communauté.",
      criteria: "Architecture, logique, couverture des besoins.",
      is_published: true,
    },
    {
      title: "Redesign app bancaire legacy",
      specialty: 'UI Designer', challenge_type: 'Redesign', industry: 'Fintech',
      league_id: bronzeId, xp_reward: 300, deadline_days: 6,
      brief: "Modernise l'interface d'une app bancaire traditionnelle pour attirer les 25-40 ans.",
      context: "ClassicBank perd ses clients jeunes à cause d'une interface dépassée.",
      deliverable: "3 écrans redesignés : accueil + virement + historique. Avant/Après.",
      constraints: "Garder la confiance et la clarté. Style moderne sans être déstabilisant.",
      criteria: "Modernisation, confiance, cohérence.",
      is_published: true,
    },

    // ─── BRONZE — GRAPHIC (10) ────────────────────
    {
      title: "Identité visuelle marque mode durable",
      specialty: 'Graphic Designer', challenge_type: 'Brand Identity', industry: 'Mode',
      league_id: bronzeId, xp_reward: 300, deadline_days: 7,
      brief: "Crée l'identité visuelle complète d'une marque de mode durable.",
      context: "La marque s'appelle Verde. Mode éco-responsable pour femmes 25-40 ans.",
      deliverable: "Logo + charte graphique basique + mockup. Lien Figma.",
      constraints: "Logo + palette + typographie + 1 mockup produit.",
      criteria: "Cohérence, positionnement premium, originalité.",
      is_published: true,
    },
    {
      title: "Packaging gamme cosmétiques",
      specialty: 'Graphic Designer', challenge_type: 'Packaging', industry: 'Beauté',
      league_id: bronzeId, xp_reward: 320, deadline_days: 7,
      brief: "Crée le packaging d'une gamme de 3 produits cosmétiques naturels.",
      context: "La marque s'appelle Bloom. Cosmétiques naturels, minimalistes, pour 20-35 ans.",
      deliverable: "3 mockups packaging cohérents. Lien Figma ou PNG.",
      constraints: "3 produits cohérents. Style épuré et naturel.",
      criteria: "Cohérence de gamme, impact visuel, lisibilité.",
      is_published: true,
    },
    {
      title: "Affiche campagne ONG",
      specialty: 'Graphic Designer', challenge_type: 'Affiche', industry: 'ONG',
      league_id: bronzeId, xp_reward: 280, deadline_days: 6,
      brief: "Crée une affiche de campagne pour une ONG de lutte contre la pauvreté.",
      context: "L'ONG s'appelle HopeFirst. Campagne de collecte de dons annuelle.",
      deliverable: "Affiche A2 PNG ou PDF haute résolution.",
      constraints: "Impact émotionnel fort. Message clair. Format A2.",
      criteria: "Impact émotionnel, clarté du message, appel à l'action.",
      is_published: true,
    },
    {
      title: "Kit réseaux sociaux fitness",
      specialty: 'Graphic Designer', challenge_type: 'Social Media Kit', industry: 'Fitness',
      league_id: bronzeId, xp_reward: 280, deadline_days: 6,
      brief: "Crée un kit social media complet pour un coach sportif indépendant.",
      context: "Le coach s'appelle Max Fit. Spécialiste crossfit, public 25-40 ans.",
      deliverable: "6 templates PNG + lien Figma.",
      constraints: "6 templates : posts, stories, réels covers. Cohérence obligatoire.",
      criteria: "Cohérence, identité forte, adaptabilité.",
      is_published: true,
    },
    {
      title: "Identité visuelle restaurant",
      specialty: 'Graphic Designer', challenge_type: 'Brand Identity', industry: 'Food & Beverage',
      league_id: bronzeId, xp_reward: 300, deadline_days: 7,
      brief: "Crée l'identité visuelle d'un restaurant fusion asiatique-méditerranéen.",
      context: "Le restaurant s'appelle Zaya. Cuisine fusion, ambiance moderne et chaleureuse.",
      deliverable: "Logo + charte + mockup menu. Lien Figma.",
      constraints: "Logo + palette + typo + menu mockup.",
      criteria: "Cohérence, ambiance, originalité.",
      is_published: true,
    },
    {
      title: "Packaging café premium",
      specialty: 'Graphic Designer', challenge_type: 'Packaging', industry: 'Food & Beverage',
      league_id: bronzeId, xp_reward: 320, deadline_days: 7,
      brief: "Crée le packaging d'une gamme de cafés premium single origin.",
      context: "La marque s'appelle Origin. Cafés de spécialité, public connaisseur 25-45 ans.",
      deliverable: "3 mockups emballage. Lien Figma ou PNG.",
      constraints: "3 origines différentes. Cohérence de gamme. Style premium.",
      criteria: "Cohérence, premium, différenciation des origines.",
      is_published: true,
    },
    {
      title: "Logo studio de musique",
      specialty: 'Graphic Designer', challenge_type: 'Logo', industry: 'Musique',
      league_id: bronzeId, xp_reward: 280, deadline_days: 5,
      brief: "Crée le logo d'un studio d'enregistrement indépendant.",
      context: "Le studio s'appelle WaveHouse. Style moderne, pour artistes indie et électro.",
      deliverable: "Logo couleur + NB + vectoriel. Lien Figma ou SVG.",
      constraints: "Style professionnel et créatif. Version couleur + NB.",
      criteria: "Originalité, professionnalisme, mémorabilité.",
      is_published: true,
    },
    {
      title: "Affiche exposition art contemporain",
      specialty: 'Graphic Designer', challenge_type: 'Affiche', industry: 'Éducation',
      league_id: bronzeId, xp_reward: 300, deadline_days: 6,
      brief: "Crée l'affiche d'une exposition d'art contemporain fictive.",
      context: "L'exposition s'appelle Fragments. Art abstrait, galerie urbaine, public 25-40 ans.",
      deliverable: "Affiche A2 PNG ou PDF.",
      constraints: "Format A2. Style avant-gardiste. Hiérarchie typographique forte.",
      criteria: "Originalité, impact visuel, cohérence avec l'art contemporain.",
      is_published: true,
    },
    {
      title: "Kit social media marque luxe",
      specialty: 'Graphic Designer', challenge_type: 'Social Media Kit', industry: 'Luxe',
      league_id: bronzeId, xp_reward: 320, deadline_days: 7,
      brief: "Crée un kit social media pour une marque de montres de luxe.",
      context: "La marque s'appelle Aurum. Montres haut de gamme, public 35-55 ans CSP+.",
      deliverable: "8 templates PNG + lien Figma.",
      constraints: "8 templates : posts, stories, réels. Style épuré et élégant.",
      criteria: "Cohérence luxe, élégance, différenciation.",
      is_published: true,
    },
    {
      title: "Identité visuelle startup healthtech",
      specialty: 'Graphic Designer', challenge_type: 'Brand Identity', industry: 'Santé',
      league_id: bronzeId, xp_reward: 300, deadline_days: 7,
      brief: "Crée l'identité visuelle d'une startup de santé numérique.",
      context: "La startup s'appelle Vita. App de suivi santé, public 30-50 ans.",
      deliverable: "Logo + charte basique + 2 mockups. Lien Figma.",
      constraints: "Logo + palette + typo + 2 mockups (app + carte de visite).",
      criteria: "Confiance, modernité, cohérence santé.",
      is_published: true,
    },
  ]

  console.log(`Insertion de ${challenges.length} challenges...`)
  const { data, error } = await (supabase as any)
    .from('challenges')
    .insert(challenges)
    .select('id, title, specialty, league_id')

  if (error) {
    console.error('❌ Erreur insertion :', error)
    return
  }

  console.log(`✅ ${data?.length} challenges insérés`)

  // Recap
  const recap = { 'Stone UX/UI': 0, 'Stone Graphic': 0, 'Bronze UX/UI': 0, 'Bronze Graphic': 0 }
  for (const c of data ?? []) {
    const isStone = c.league_id === stoneId
    const isGraphic = c.specialty === 'Graphic Designer'
    const key = `${isStone ? 'Stone' : 'Bronze'} ${isGraphic ? 'Graphic' : 'UX/UI'}` as keyof typeof recap
    recap[key]++
  }
  console.table(recap)
}

main().catch(console.error)
