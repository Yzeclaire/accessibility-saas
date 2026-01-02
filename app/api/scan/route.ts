import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function calculateScore(lighthouseScore: number): number {
  return Math.round(lighthouseScore * 100)
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
      console.error('Supabase error:', scanError)
      return NextResponse.json({ error: 'Erreur DB' }, { status: 500 })
    }

    // Lance PageSpeed Insights API (Lighthouse Accessibility)
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=accessibility`
    
    const response = await fetch(psiUrl)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error('PageSpeed API error')
    }

    const accessibilityScore = data.lighthouseResult?.categories?.accessibility?.score || 0
    const audits = data.lighthouseResult?.audits || {}
    
    // Extrait les violations (audits qui ont échoué)
    const violations = Object.entries(audits)
      .filter(([_, audit]: any) => {
        return audit.score !== null && audit.score !== undefined && audit.score < 1
      })
      .slice(0, 20)
      .map(([id, audit]: any) => ({
        id,
        impact: audit.score < 0.5 ? 'serious' : 'moderate',
        description: audit.title,
        help: audit.description || 'Améliorer l\'accessibilité de cet élément'
      }))
    
    const score = calculateScore(accessibilityScore)
    
    // Update Supabase avec les résultats
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        score,
        violations
      })
      .eq('id', scan.id)

    return NextResponse.json({ success: true, scanId: scan.id })
    
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json({ 
      error: 'Erreur lors du scan' 
    }, { status: 500 })
  }
}
