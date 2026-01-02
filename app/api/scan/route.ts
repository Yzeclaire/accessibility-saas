import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s max
      
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=accessibility`
      
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
          description: audit.title || 'Problème détecté',
          help: audit.description || ''
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
