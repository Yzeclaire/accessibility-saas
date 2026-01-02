import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Traductions détaillées avec explications actionnables
function translateTitle(title: string): string {
  const translations: Record<string, string> = {
    'Document does not have a main landmark': 'Structure HTML : Balise <main> manquante',
    'Lists do not contain only <li> elements': 'Structure HTML : Listes mal formées',
    'Heading elements are not in a sequentially-descending order': 'Hiérarchie : Titres dans le désordre',
    'Background and foreground colors do not have a sufficient contrast ratio': 'Contraste : Texte difficile à lire',
    'Links do not have a discernible name': 'Navigation : Liens sans texte descriptif',
    'Form elements do not have associated labels': 'Formulaires : Champs sans étiquettes',
    'Image elements do not have [alt] attributes': 'Images : Attribut alt manquant',
    '[aria-*] attributes do not match their roles': 'ARIA : Attributs incorrects',
    'Buttons do not have an accessible name': 'Navigation : Boutons sans nom',
    'color-contrast': 'Contraste : Texte difficile à lire',
    'link-name': 'Navigation : Liens sans texte',
    'heading-order': 'Hiérarchie : Titres mal ordonnés',
    'label': 'Formulaires : Labels manquants',
  }
  
  return translations[title] || title
}

function translateDescription(desc: string, title: string): string {
  const guides: Record<string, {
    problem: string
    impact: string
    solution: string
    example: string
  }> = {
    'main landmark': {
      problem: 'Votre page ne contient pas de balise <main>',
      impact: 'Les personnes utilisant un lecteur d\'écran ne peuvent pas identifier rapidement le contenu principal de la page',
      solution: 'Enveloppez votre contenu principal dans une balise <main>',
      example: '<main><h1>Mon contenu</h1><p>...</p></main>'
    },
    'list structure': {
      problem: 'Vos listes HTML contiennent des éléments autres que <li>',
      impact: 'Les lecteurs d\'écran annoncent mal le nombre d\'éléments dans la liste',
      solution: 'Assurez-vous que <ul> et <ol> ne contiennent que des <li>',
      example: '<ul><li>Item 1</li><li>Item 2</li></ul>'
    },
    'heading order': {
      problem: 'Vos titres ne suivent pas l\'ordre hiérarchique (H1 → H2 → H3)',
      impact: 'Les utilisateurs de lecteurs d\'écran se perdent dans la navigation',
      solution: 'Ne sautez jamais de niveau de titre (pas de H1 puis H4)',
      example: 'H1 (titre page) → H2 (section) → H3 (sous-section)'
    },
    'contrast': {
      problem: 'Le contraste entre le texte et l\'arrière-plan est insuffisant',
      impact: 'Les personnes malvoyantes ou avec daltonisme ne peuvent pas lire le texte',
      solution: 'Utilisez un ratio de contraste minimum de 4.5:1 (7:1 pour le petit texte)',
      example: 'Testez vos couleurs sur WebAIM Contrast Checker'
    },
    'link': {
      problem: 'Certains liens n\'ont pas de texte visible ou descriptif',
      impact: 'Les lecteurs d\'écran annoncent "lien" sans contexte',
      solution: 'Ajoutez un texte descriptif ou un aria-label',
      example: '<a href="/contact">Contactez-nous</a> ou <a aria-label="Contactez-nous"><img src="mail.svg"></a>'
    },
    'label': {
      problem: 'Vos champs de formulaire n\'ont pas de <label> associé',
      impact: 'Les utilisateurs ne savent pas à quoi sert le champ',
      solution: 'Ajoutez un <label> avec l\'attribut for qui correspond à l\'id du champ',
      example: '<label for="email">Email</label><input id="email" type="email">'
    },
    'alt': {
      problem: 'Des images n\'ont pas d\'attribut alt',
      impact: 'Les lecteurs d\'écran ne peuvent pas décrire les images',
      solution: 'Ajoutez un alt descriptif (ou alt="" pour les images décoratives)',
      example: '<img src="chat.jpg" alt="Chat tigré endormi sur un canapé">'
    }
  }
  
  // Trouve le guide correspondant
  const key = Object.keys(guides).find(k => 
    desc.toLowerCase().includes(k) || title.toLowerCase().includes(k)
  )
  
  if (key) {
    const guide = guides[key]
    return `❌ ${guide.problem}\n\n💡 Impact : ${guide.impact}\n\n✅ Solution : ${guide.solution}\n\n📝 Exemple : ${guide.example}`
  }
  
  return desc.split('[Learn more')[0].trim() || 'Problème d\'accessibilité détecté'
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Crée le scan en pending
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({ url, status: 'pending' })
      .select()
      .single()

    if (scanError) {
      console.error('Erreur Supabase:', scanError)
      return NextResponse.json({ error: 'Erreur DB' }, { status: 500 })
    }

    // Lance le scan avec timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s max pour gros sites
      
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=accessibility&key=${process.env.GOOGLE_PAGESPEED_API_KEY}`
      
      const response = await fetch(psiUrl, { 
        signal: controller.signal 
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`PageSpeed API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      const accessibilityScore = data.lighthouseResult?.categories?.accessibility?.score || 0
      const audits = data.lighthouseResult?.audits || {}
      
      // Extrait les violations
      const violations = Object.entries(audits)
        .filter(([_, audit]: any) => {
          return audit.score !== null && audit.score !== undefined && audit.score < 1
        })
        .slice(0, 20)
        .map(([id, audit]: any) => ({
          id,
          impact: audit.score < 0.5 ? 'serious' : 'moderate',
          description: translateTitle(audit.title || 'Problème détecté'),
          help: translateDescription(audit.description || '', audit.title || ''),
          wcagLevel: 'A' // Tu peux parser ça depuis audit.details si besoin
        }))
      
      const score = Math.round(accessibilityScore * 100)
      
      // Update Supabase
      await supabase
        .from('scans')
        .update({
          status: 'completed',
          score,
          violations
        })
        .eq('id', scan.id)

      return NextResponse.json({ success: true, scanId: scan.id })
      
    } catch (scanError: any) {
      console.error('Erreur scan:', scanError)
      
      // Marque comme failed
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', scan.id)
      
      return NextResponse.json({ 
        error: 'Erreur lors du scan', 
        details: scanError.message 
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Erreur API:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error.message
    }, { status: 500 })
  }
}
