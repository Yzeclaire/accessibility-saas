import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chromium } from 'playwright-core'
import chromiumMin from '@sparticuz/chromium-min'
import { injectAxe, getViolations } from 'axe-playwright'

async function getBrowser() {
  if (process.env.VERCEL_ENV === 'production') {
    return chromium.launch({
      args: chromiumMin.args,
      executablePath: await chromiumMin.executablePath(),
      headless: true
    })
  } else {
    // En local, utilise Chromium installé
    return chromium.launch({ headless: true })
  }
}

function calculateScore(violations: any[]): number {
  const weights = { critical: 20, serious: 10, moderate: 5, minor: 2 }
  const deductions = violations.reduce((sum, v) => {
    return sum + ((weights as any)[v.impact] || 0)
  }, 0)
  return Math.max(0, 100 - deductions)
}

export async function POST(req: NextRequest) {
  let browser
  
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

    // Lance le scan en arrière-plan (ne pas await pour pas timeout)
    performScan(scan.id, url).catch(err => {
      console.error('Scan error:', err)
    })

    return NextResponse.json({ success: true, scanId: scan.id })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur' 
    }, { status: 500 })
  } finally {
    if (browser) await browser.close()
  }
}

async function performScan(scanId: string, url: string) {
  let browser
  
  try {
    browser = await getBrowser()
    const page = await browser.newPage()
    
    // Va sur la page
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    })
    
    // Injecte axe et récupère violations
    await injectAxe(page)
    const violations = await getViolations(page)
    
    // Limite à 20 violations max
    const limitedViolations = violations.slice(0, 20).map(v => ({
      id: v.id,
      impact: v.impact || 'minor',
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes?.slice(0, 3).map((n: any) => ({
        html: n.html,
        target: n.target
      }))
    }))
    
    const score = calculateScore(limitedViolations)
    
    // Update Supabase
    const supabase = await createClient()
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        score,
        violations: limitedViolations
      })
      .eq('id', scanId)
      
    console.log(`Scan ${scanId} completed: ${score}/100`)
    
  } catch (error) {
    console.error('Scan failed:', error)
    
    const supabase = await createClient()
    await supabase
      .from('scans')
      .update({ status: 'failed' })
      .eq('id', scanId)
  } finally {
    if (browser) await browser.close()
  }
}
