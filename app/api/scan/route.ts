import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Traductions des titres courants
function translateTitle(title: string): string {
  const translations: Record<string, string> = {
    'Document does not have a main landmark': 'Pas de balise <main> principale',
    'Lists do not contain only <li> elements': 'Listes mal structurées',
    'Heading elements are not in a sequentially-descending order': 'Titres dans le désordre (H1, H2, H3...)',
    'Background and foreground colors do not have a sufficient contrast ratio': 'Contraste des couleurs insuffisant',
    'Links do not have a discernible name': 'Liens sans texte descriptif',
    'Form elements do not have associated labels': 'Champs de formulaire sans labels',
    'Image elements do not have [alt] attributes': 'Images sans attribut alt',
    '[aria-*] attributes do not match their roles': 'Attributs ARIA incorrects',
    'Buttons do not have an accessible name': 'Boutons sans nom accessible',
  }
  
  return translations[title] || title
}

// Simplifier les descriptions
function translateDescription(desc: string): string {
  if (desc.includes('main landmark')) {
    return 'Votre page doit contenir une balise <main> pour aider les lecteurs d\'écran à naviguer.'
  }
  if (desc.includes('list structure')) {
    return 'Les listes doivent contenir uniquement des éléments <li>. Corrigez la structure HTML.'
  }
  if (desc.includes('heading order')) {
    return 'Les titres (H1, H2, H3...) doivent être dans l\'ordre. Ne sautez pas de niveaux.'
  }
  if (desc.includes('contrast ratio')) {
    return 'Le contraste entre le texte et l\'arrière-plan est trop faible. Ratio minimum : 4.5:1.'
  }
  if (desc.includes('Link text')) {
    return 'Certains liens n\'ont pas de texte visible. Ajoutez du texte descriptif.'
  }
  if (desc.includes('Form elements')) {
    return 'Les champs de formulaire doivent avoir des labels associés avec <label for="...">.'
  }
  if (desc.includes('alt attributes')) {
    return 'Toutes les images doivent avoir un attribut alt décrivant leur contenu.'
  }
  
  // Si pas de traduction, retourne une version simplifiée
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
          help: translateDescription(audit.description || '')
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
